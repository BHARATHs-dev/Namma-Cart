const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order");
const { logActivity, getUserActivities } = require("./activityService");

/**
 * Generate signed JWT token
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || "replace_with_a_secure_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
}

/**
 * Register a new customer
 */
async function registerCustomer({ fullName, email, phone, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("An account with this email address already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : "",
    password,
    role: "CUSTOMER",
  });

  const token = generateToken(user);

  await logActivity(user._id, "REGISTER", "Customer registered successfully", {
    email: user.email,
    role: user.role,
  });

  return {
    user: user.toSafeObject(),
    token,
  };
}

/**
 * Authenticate user with email and password
 */
async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account has been deactivated. Please contact support.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  await logActivity(user._id, "LOGIN", "User logged in successfully", {
    role: user.role,
  });

  return {
    user: user.toSafeObject(),
    token,
  };
}

/**
 * Get current user details
 */
async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
}

/**
 * Generate password reset token
 */
async function forgotPassword(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message: "If that email address is in our database, we have initiated the password reset process.",
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  await user.save();

  await logActivity(user._id, "FORGOT_PASSWORD_REQUESTED", "Password reset requested");

  const responsePayload = {
    message: "Password reset token generated. Use it within 1 hour to reset your password.",
  };

  if (process.env.NODE_ENV === "development") {
    responsePayload.developmentResetToken = resetToken;
  }

  return responsePayload;
}

/**
 * Reset password using valid reset token
 */
async function resetPassword(token, newPassword) {
  if (!token) {
    const error = new Error("Reset token is required.");
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("Invalid or expired password reset token.");
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await logActivity(user._id, "PASSWORD_RESET_SUCCESS", "Password reset successfully completed");

  return {
    message: "Password has been reset successfully. You can now log in with your new password.",
  };
}

/**
 * User Profile & Management (Integrated from userService)
 */
async function getUserProfile(userId) {
  return getCurrentUser(userId);
}

async function updateUserProfile(userId, updateData) {
  const allowedFields = ["fullName", "phone", "profileImage", "address", "city", "state", "pincode"];
  const updates = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updates[field] = typeof updateData[field] === "string" ? updateData[field].trim() : updateData[field];
    }
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  await logActivity(userId, "PROFILE_UPDATE", "User profile details updated", {
    updatedFields: Object.keys(updates),
  });

  return user.toSafeObject();
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    const error = new Error("Current password does not match.");
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  await logActivity(userId, "PASSWORD_CHANGE", "User changed account password");

  return { message: "Password updated successfully." };
}

async function getUserOrders(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 });
}

module.exports = {
  generateToken,
  registerCustomer,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserOrders,
  getUserActivities,
};

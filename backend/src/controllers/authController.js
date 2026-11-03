const authService = require("../services/authService");
const { logActivity } = require("../services/activityService");
const { successResponse } = require("../middleware/validation");

async function register(req, res, next) {
  try {
    const { fullName, email, phone, password } = req.body;
    const result = await authService.registerCustomer({ fullName, email, phone, password });
    return successResponse(res, 201, "Customer registered successfully", result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return successResponse(res, 200, "Login successful", result);
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    return successResponse(res, 200, "Current user retrieved successfully", { user });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user) {
      await logActivity(req.user._id, "LOGOUT", "User logged out");
    }
    return successResponse(
      res,
      200,
      "Logged out successfully. Note: JWT is stateless; the client must clear the stored token from localStorage or session cookies.",
      {
        statelessNotice:
          "JWT tokens are self-contained and stateless. Once issued, a token remains cryptographically valid until its expiry date. For complete server-side token invalidation, implement a Redis token blacklist or short-lived access tokens with rotating refresh tokens.",
      }
    );
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return successResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};

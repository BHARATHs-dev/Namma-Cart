const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { errorResponse } = require("./validation");

/**
 * Verifies JWT token from Authorization header and attaches user to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Authentication required. Please provide a valid Bearer token.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return errorResponse(res, 401, "Authentication token missing.");
    }

    const secret = process.env.JWT_SECRET || "replace_with_a_secure_secret";

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return errorResponse(res, 401, "Token has expired. Please log in again.");
      }
      return errorResponse(res, 401, "Invalid authentication token.");
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 401, "The user belonging to this token no longer exists.");
    }

    if (!user.isActive) {
      return errorResponse(res, 403, "User account has been deactivated. Please contact support.");
    }

    req.user = user;
    next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Optional authentication - attaches user if valid token exists, otherwise continues as guest
 */
async function optionalAuthenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const secret = process.env.JWT_SECRET || "replace_with_a_secure_secret";
      try {
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (_err) {
        // Ignore invalid token for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};

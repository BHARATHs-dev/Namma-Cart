const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { errorResponse } = require("./validation");

const tokenErrors = {
  TokenExpiredError: "Token has expired. Please log in again.",
  JsonWebTokenError: "Invalid authentication token.",
};

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return errorResponse(res, 401, "Please log in to continue.");
  }

  const token = header.slice(7);
  if (!token) return errorResponse(res, 401, "Authentication token is missing.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "replace_with_a_secure_secret");
    const user = await User.findById(decoded.id);

    if (!user) return errorResponse(res, 401, "User account was not found.");
    if (!user.isActive) return errorResponse(res, 403, "This account has been deactivated.");

    req.user = user;
    next();
  } catch (error) {
    if (tokenErrors[error.name]) return errorResponse(res, 401, tokenErrors[error.name]);
    next(error);
  }
}

async function optionalAuthenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || "replace_with_a_secure_secret");
    const user = await User.findById(decoded.id);
    if (user?.isActive) req.user = user;
    next();
  } catch (error) {
    if (tokenErrors[error.name]) return next();
    next(error);
  }
}

module.exports = { authenticate, optionalAuthenticate };

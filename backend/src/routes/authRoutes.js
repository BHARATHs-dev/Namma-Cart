const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { authenticate, optionalAuthenticate } = require("../middleware/authentication");
const { validateRequest, errorResponse } = require("../middleware/validation");

const router = express.Router();

/**
 * Authentication rate limiter to mitigate brute-force attempts
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(res, 429, "Too many authentication attempts. Please try again after 15 minutes.");
  },
});

// Register Validation
const registerValidation = [
  body("fullName").trim().notEmpty().withMessage("Full name is required").isLength({ max: 100 }),
  body("email").trim().isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("phone").optional().trim(),
];

// Login Validation
const loginValidation = [
  body("email").trim().isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Forgot Password Validation
const forgotPasswordValidation = [
  body("email").trim().isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
];

// Reset Password Validation
const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Password reset token is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
];

// Endpoints
router.post("/register", authRateLimiter, validateRequest(registerValidation), authController.register);
router.post("/login", authRateLimiter, validateRequest(loginValidation), authController.login);
router.get("/me", authenticate, authController.getMe);
router.post("/logout", optionalAuthenticate, authController.logout);
router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest(forgotPasswordValidation),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authRateLimiter,
  validateRequest(resetPasswordValidation),
  authController.resetPassword
);

module.exports = router;

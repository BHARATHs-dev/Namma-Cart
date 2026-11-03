const express = require("express");
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authentication");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

// Require authentication for all user endpoints
router.use(authenticate);

const updateProfileValidation = [
  body("fullName").optional().trim().notEmpty().withMessage("Full name cannot be empty"),
  body("phone").optional().trim(),
  body("address").optional().trim(),
  body("city").optional().trim(),
  body("state").optional().trim(),
  body("pincode").optional().trim(),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
];

router.get("/profile", userController.getProfile);
router.put("/profile", validateRequest(updateProfileValidation), userController.updateProfile);
router.put("/change-password", validateRequest(changePasswordValidation), userController.changePassword);
router.get("/orders", userController.getOrders);
router.get("/activities", userController.getActivities);

module.exports = router;


const express = require("express");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authentication");

const router = express.Router();

// Require authentication for all user endpoints
router.use(authenticate);

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.put("/change-password", userController.changePassword);
router.get("/orders", userController.getOrders);
router.get("/activities", userController.getActivities);

module.exports = router;


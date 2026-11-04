const express = require("express");
const orderController = require("../controllers/orderController");
const { authenticate, optionalAuthenticate } = require("../middleware/authentication");

const router = express.Router();

// Coupon endpoints (supported directly and via /api/coupons mounting)
router.post("/apply", optionalAuthenticate, orderController.applyCoupon);
router.post("/coupons/apply", optionalAuthenticate, orderController.applyCoupon);
router.get("/coupons", optionalAuthenticate, orderController.getCoupons);

// Order endpoints (require authentication)
router.post("/checkout", authenticate, orderController.checkout);
router.get("/", authenticate, orderController.getOrders);
router.get(
  "/:id/tracking",
  authenticate,
  orderController.getOrderTracking
);
router.put(
  "/:id/cancel",
  authenticate,
  orderController.cancelOrder
);
router.get(
  "/:id",
  authenticate,
  orderController.getOrderById
);

module.exports = router;

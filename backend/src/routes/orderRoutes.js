const express = require("express");
const { body, param } = require("express-validator");
const orderController = require("../controllers/orderController");
const { authenticate, optionalAuthenticate } = require("../middleware/authentication");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

const applyCouponValidation = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
  body("orderAmount").optional().isFloat({ min: 0 }).withMessage("Order amount must be a positive number"),
];

const checkoutValidation = [
  body("shippingAddress.fullName").trim().notEmpty().withMessage("Recipient full name is required"),
  body("shippingAddress.phone").trim().notEmpty().withMessage("Phone number is required"),
  body("shippingAddress.address").trim().notEmpty().withMessage("Street address is required"),
  body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.state").trim().notEmpty().withMessage("State is required"),
  body("shippingAddress.pincode").trim().notEmpty().withMessage("Pincode is required"),
  body("paymentMethod")
    .optional()
    .isIn(["Cash on Delivery", "Online Payment"])
    .withMessage("Payment method must be 'Cash on Delivery' or 'Online Payment'"),
  body("couponCode").optional().trim(),
];

// Coupon endpoints (supported directly and via /api/coupons mounting)
router.post(
  "/apply",
  optionalAuthenticate,
  validateRequest(applyCouponValidation),
  orderController.applyCoupon
);
router.post(
  "/coupons/apply",
  optionalAuthenticate,
  validateRequest(applyCouponValidation),
  orderController.applyCoupon
);
router.get("/coupons", optionalAuthenticate, orderController.getCoupons);

// Order endpoints (require authentication)
router.post("/checkout", authenticate, validateRequest(checkoutValidation), orderController.checkout);
router.get("/", authenticate, orderController.getOrders);
router.get(
  "/:id/tracking",
  authenticate,
  validateRequest([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.getOrderTracking
);
router.put(
  "/:id/cancel",
  authenticate,
  validateRequest([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.cancelOrder
);
router.get(
  "/:id",
  authenticate,
  validateRequest([param("id").isMongoId().withMessage("Invalid order ID")]),
  orderController.getOrderById
);

module.exports = router;

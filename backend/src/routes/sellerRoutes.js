const express = require("express");
const { body, param } = require("express-validator");
const sellerController = require("../controllers/sellerController");
const { authenticate } = require("../middleware/authentication");
const { authorize, requireApprovedSeller } = require("../middleware/authorization");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

router.use(authenticate);

const registerSellerValidation = [
  body("shopName").trim().notEmpty().withMessage("Shop name is required"),
  body("businessAddress").trim().notEmpty().withMessage("Business address is required"),
  body("shopDescription").optional().trim(),
];

// Seller Registration (Authenticated customer applies to become a seller)
router.post("/register", validateRequest(registerSellerValidation), sellerController.registerSeller);

// Admin-only application management
router.get("/admin/applications", authorize("ADMIN"), sellerController.getApplications);
router.put(
  "/admin/:sellerId/status",
  authorize("ADMIN"),
  validateRequest([
    param("sellerId").isMongoId().withMessage("Invalid seller user ID"),
    body("status").isIn(["APPROVED", "REJECTED", "PENDING"]).withMessage("Status must be APPROVED, REJECTED, or PENDING"),
  ]),
  sellerController.updateStatus
);

// Seller Dashboard & Management (Requires SELLER role)
router.get("/dashboard", authorize("SELLER", "ADMIN"), sellerController.getDashboard);
router.get("/products", authorize("SELLER", "ADMIN"), sellerController.getProducts);
router.get("/orders", authorize("SELLER", "ADMIN"), sellerController.getOrders);
router.get("/analytics", authorize("SELLER", "ADMIN"), sellerController.getAnalytics);

// Product management routes for seller
router.put(
  "/products/:id",
  authorize("SELLER", "ADMIN"),
  requireApprovedSeller,
  validateRequest([param("id").isMongoId().withMessage("Invalid product ID")]),
  sellerController.updateProduct
);

router.delete(
  "/products/:id",
  authorize("SELLER", "ADMIN"),
  requireApprovedSeller,
  validateRequest([param("id").isMongoId().withMessage("Invalid product ID")]),
  sellerController.deleteProduct
);

module.exports = router;


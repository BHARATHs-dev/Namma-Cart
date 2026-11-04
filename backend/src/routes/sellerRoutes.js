const express = require("express");
const sellerController = require("../controllers/sellerController");
const { authenticate } = require("../middleware/authentication");
const { authorize } = require("../middleware/authorization");
const { errorResponse } = require("../middleware/validation");
const Product = require("../models/Product");

const router = express.Router();

router.use(authenticate);

function checkSellerRegistration(req, res, next) {
  if (typeof req.body.shopName !== "string" || !req.body.shopName.trim()) return errorResponse(res, 400, "Shop name is required.");
  if (typeof req.body.businessAddress !== "string" || !req.body.businessAddress.trim()) return errorResponse(res, 400, "Business address is required.");
  next();
}

// Seller Registration (Authenticated customer applies to become a seller)
router.post("/register", checkSellerRegistration, sellerController.registerSeller);

// Admin-only application management
router.get("/admin/applications", authorize("ADMIN"), sellerController.getApplications);
router.put(
  "/admin/:sellerId/status",
  authorize("ADMIN"),
  sellerController.updateStatus
);

// Seller Dashboard & Management (Requires SELLER role)
router.get("/dashboard", authorize("SELLER", "ADMIN"), sellerController.getDashboard);
router.get("/products", authorize("SELLER", "ADMIN"), sellerController.getProducts);
router.get("/orders", authorize("SELLER", "ADMIN"), sellerController.getOrders);
router.get("/analytics", authorize("SELLER", "ADMIN"), sellerController.getAnalytics);

// Product management routes for seller
const sellerProductFields = ["name", "description", "price", "discountPrice", "stock", "category", "image", "material", "origin", "artisanName"];
function allowSellerProductFields(req, res, next) {
  const unexpected = Object.keys(req.body || {}).filter((key) => !sellerProductFields.includes(key));
  if (unexpected.length) return errorResponse(res, 400, `Unexpected product fields: ${unexpected.join(", ")}`);
  const required = req.method === "POST" ? ["name", "description", "price", "stock", "category", "image"] : [];
  const missing = required.filter((field) => req.body[field] === undefined || req.body[field] === "");
  if (missing.length) return errorResponse(res, 400, `Required product fields are missing: ${missing.join(", ")}`);
  if (req.method === "PUT" && !Object.keys(req.body || {}).length) return errorResponse(res, 400, "Provide at least one product field to update.");
  for (const field of ["name", "description", "category", "image", "material", "origin", "artisanName"]) {
    if (req.body[field] !== undefined && typeof req.body[field] !== "string") return errorResponse(res, 400, `${field} must be text.`);
  }
  if (req.body.name !== undefined && (!req.body.name.trim() || req.body.name.length > 200)) return errorResponse(res, 400, "Product name is required and must be 200 characters or fewer.");
  if (req.body.description !== undefined && (!req.body.description.trim() || req.body.description.length > 5000)) return errorResponse(res, 400, "Product description is required and must be 5000 characters or fewer.");
  if (req.body.category !== undefined && !Product.SUPPORTED_CATEGORIES.includes(req.body.category)) return errorResponse(res, 400, "Choose a supported product category.");
  for (const field of ["price", "discountPrice"]) {
    if (req.body[field] !== undefined && (!Number.isFinite(Number(req.body[field])) || Number(req.body[field]) < 0)) return errorResponse(res, 400, `${field} must be a non-negative number.`);
  }
  if (req.body.stock !== undefined && (!Number.isInteger(Number(req.body.stock)) || Number(req.body.stock) < 0)) return errorResponse(res, 400, "Stock must be a non-negative whole number.");
  if (req.body.image !== undefined && req.body.image !== "" && !/^https?:\/\//i.test(req.body.image)) return errorResponse(res, 400, "Upload a valid product image.");
  next();
}

router.post(
  "/products",
  authorize("SELLER", "ADMIN"),
  allowSellerProductFields,
  sellerController.createProduct
);

router.put(
  "/products/:id",
  authorize("SELLER", "ADMIN"),
  allowSellerProductFields,
  sellerController.updateProduct
);

router.delete(
  "/products/:id",
  authorize("SELLER", "ADMIN"),
  sellerController.deleteProduct
);

module.exports = router;


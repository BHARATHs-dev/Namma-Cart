const express = require("express");
const sellerController = require("../controllers/sellerController");
const { authenticate } = require("../middleware/authentication");
const { authorize } = require("../middleware/authorization");
const { errorResponse } = require("../middleware/validation");
const Product = require("../models/Product");

const router = express.Router();

router.use(authenticate);

function checkSellerRegistration(req, res, next) {
  const { shopName, businessAddress } = req.body;
  if (typeof shopName !== "string" || !shopName.trim()) return errorResponse(res, 400, "Shop name is required.");
  if (typeof businessAddress !== "string" || !businessAddress.trim()) return errorResponse(res, 400, "Business address is required.");
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
  const data = req.body || {};
  const keys = Object.keys(data);
  const unexpected = keys.find((key) => !sellerProductFields.includes(key));
  if (unexpected) return errorResponse(res, 400, `Unexpected product field: ${unexpected}`);

  const required = req.method === "POST" ? ["name", "description", "price", "stock", "category", "image"] : [];
  for (const field of required) {
    if (data[field] === undefined || data[field] === "") return errorResponse(res, 400, `${field} is required.`);
  }
  if (req.method === "PUT" && keys.length === 0) return errorResponse(res, 400, "Add a product detail to update.");

  const textFields = ["name", "description", "category", "image", "material", "origin", "artisanName"];
  for (const field of textFields) {
    if (data[field] !== undefined && typeof data[field] !== "string") return errorResponse(res, 400, `${field} must be text.`);
  }
  if (data.name !== undefined && (!data.name.trim() || data.name.length > 200)) return errorResponse(res, 400, "Enter a product name under 200 characters.");
  if (data.description !== undefined && (!data.description.trim() || data.description.length > 5000)) return errorResponse(res, 400, "Enter a product description under 5000 characters.");
  if (data.category !== undefined && !Product.SUPPORTED_CATEGORIES.includes(data.category)) return errorResponse(res, 400, "Choose a supported category.");

  for (const field of ["price", "discountPrice"]) {
    if (data[field] !== undefined && (!Number.isFinite(Number(data[field])) || Number(data[field]) < 0)) return errorResponse(res, 400, `${field} must be zero or more.`);
  }
  if (data.stock !== undefined && (!Number.isInteger(Number(data.stock)) || Number(data.stock) < 0)) return errorResponse(res, 400, "Stock must be a whole number of zero or more.");
  if (data.image && !/^https?:\/\//i.test(data.image)) return errorResponse(res, 400, "Upload a valid product image.");
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


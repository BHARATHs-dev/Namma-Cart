const express = require("express");
const productController = require("../controllers/productController");
const { authenticate } = require("../middleware/authentication");
const { authorize } = require("../middleware/authorization");
const uploadProductImages = require("../middleware/productImageUpload");
const { errorResponse } = require("../middleware/validation");

const router = express.Router();
const allowedFields = ["title", "price", "description", "category", "image", "images", "rating"];

function checkProductInput(req, res, next) {
  const unexpected = Object.keys(req.body || {}).filter((key) => !allowedFields.includes(key));
  const ratingFields = Object.keys(req.body?.rating || {}).filter((key) => !["rate", "count"].includes(key));
  if (unexpected.length || ratingFields.length) return errorResponse(res, 400, "Unexpected product fields.", [...unexpected, ...ratingFields]);
  if (req.method === "POST") {
    const required = ["title", "price", "description", "category", "rating"];
    const missing = required.filter((field) => req.body[field] === undefined || req.body[field] === "");
    if (missing.length) return errorResponse(res, 400, `Required fields are missing: ${missing.join(", ")}`);
    if (req.body.image === undefined && req.body.images === undefined) return errorResponse(res, 400, "A product image is required.");
  } else if (!Object.keys(req.body || {}).length) {
    return errorResponse(res, 400, "Provide at least one product field.");
  }
  if (req.body.title !== undefined && (typeof req.body.title !== "string" || !req.body.title.trim() || req.body.title.length > 200)) return errorResponse(res, 400, "Product title is required and must be 200 characters or fewer.");
  if (req.body.description !== undefined && (typeof req.body.description !== "string" || !req.body.description.trim())) return errorResponse(res, 400, "Product description is required.");
  if (req.body.category !== undefined && (typeof req.body.category !== "string" || !req.body.category.trim())) return errorResponse(res, 400, "Product category is required.");
  if (req.body.price !== undefined && (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) < 0)) return errorResponse(res, 400, "Price must be a non-negative number.");
  if (req.body.image !== undefined && (typeof req.body.image !== "string" || !/^https?:\/\//i.test(req.body.image))) return errorResponse(res, 400, "Product image must be a valid URL.");
  if (req.body.images !== undefined && (!Array.isArray(req.body.images) || req.body.images.length < 1 || req.body.images.length > 5 || req.body.images.some((image) => typeof image !== "string" || !/^https?:\/\//i.test(image)))) return errorResponse(res, 400, "Product images must contain 1 to 5 valid URLs.");
  if (req.body.rating !== undefined) {
    const { rate, count } = req.body.rating || {};
    if (!Number.isFinite(Number(rate)) || Number(rate) < 0 || Number(rate) > 5) return errorResponse(res, 400, "Rating must be from 0 to 5.");
    if (!Number.isInteger(Number(count)) || Number(count) < 0) return errorResponse(res, 400, "Review count must be a non-negative whole number.");
  }
  next();
}

router.get("/categories", productController.getCategories);
router.get("/categories/:slug", productController.getCategoryBySlug);
router.get("/featured", productController.getFeaturedProducts);
router.get("/search", productController.searchProducts);
router.get("/category/:slug", productController.getProductsByCategorySlug);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

router.post("/images", authenticate, authorize("SELLER", "ADMIN"), uploadProductImages, productController.uploadProductImages);
router.post("/", authenticate, authorize("ADMIN"), checkProductInput, productController.createProduct);
router.put("/:id", authenticate, authorize("ADMIN"), checkProductInput, productController.updateProduct);
router.delete("/:id", authenticate, authorize("ADMIN"), productController.deleteProduct);

module.exports = router;

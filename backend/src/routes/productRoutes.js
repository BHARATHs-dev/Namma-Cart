const express = require("express");
const { body, param } = require("express-validator");
const productController = require("../controllers/productController");
const { authenticate } = require("../middleware/authentication");
const { requireApprovedSeller } = require("../middleware/authorization");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();
const allowedFields = ["title", "price", "description", "category", "image", "rating"];

function allowProductFields(req, res, next) {
  const unexpected = Object.keys(req.body || {}).filter((key) => !allowedFields.includes(key));
  const ratingFields = Object.keys(req.body?.rating || {}).filter((key) => !["rate", "count"].includes(key));
  if (unexpected.length || ratingFields.length) {
    return errorResponse(res, 400, "Unexpected product fields", [...unexpected, ...ratingFields]);
  }
  if (!Object.keys(req.body || {}).length || (req.body.rating && !Object.keys(req.body.rating).length)) {
    return errorResponse(res, 400, "Provide at least one valid product field");
  }
  next();
}

const createValidation = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("image").isURL({ require_protocol: true }).withMessage("Image must be a valid URL"),
  body("rating").isObject().withMessage("Rating must be an object"),
  body("rating.rate").isFloat({ min: 0, max: 5 }).withMessage("Rating rate must be from 0 to 5"),
  body("rating.count").isInt({ min: 0 }).withMessage("Rating count must be a non-negative whole number"),
];

const updateValidation = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty").isLength({ max: 200 }),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty"),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
  body("image").optional().isURL({ require_protocol: true }).withMessage("Image must be a valid URL"),
  body("rating").optional().isObject().withMessage("Rating must be an object"),
  body("rating.rate").optional().isFloat({ min: 0, max: 5 }).withMessage("Rating rate must be from 0 to 5"),
  body("rating.count").optional().isInt({ min: 0 }).withMessage("Rating count must be a non-negative whole number"),
];

router.get("/categories", productController.getCategories);
router.get("/categories/:slug", productController.getCategoryBySlug);
router.get("/featured", productController.getFeaturedProducts);
router.get("/search", productController.searchProducts);
router.get("/category/:slug", productController.getProductsByCategorySlug);

// Catalog list and single item retrieval
router.get("/", productController.getAllProducts);
router.get("/:id", validateRequest([param("id").isMongoId().withMessage("Invalid product ID")]), productController.getProductById);

router.post("/", authenticate, authorize("ADMIN"), allowProductFields, validateRequest(createValidation), productController.createProduct);
router.put("/:id", authenticate, authorize("ADMIN"), allowProductFields, validateRequest([
  param("id").isMongoId().withMessage("Invalid product ID"),
  ...updateValidation,
]), productController.updateProduct);
router.delete("/:id", authenticate, authorize("ADMIN"), validateRequest([
  param("id").isMongoId().withMessage("Invalid product ID"),
]), productController.deleteProduct);

module.exports = router;

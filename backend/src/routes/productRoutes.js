const express = require("express");
const { body, param } = require("express-validator");
const productController = require("../controllers/productController");
const { authenticate } = require("../middleware/authentication");
const { requireApprovedSeller } = require("../middleware/authorization");
const { validateRequest } = require("../middleware/validation");
const uploadProductImages = require("../middleware/productImageUpload");

const router = express.Router();

const createProductValidation = [
  body("name").trim().notEmpty().withMessage("Product name is required").isLength({ max: 200 }),
  body("description").trim().notEmpty().withMessage("Product description is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("discountPrice").optional().isFloat({ min: 0 }).withMessage("Discount price must be a positive number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be an integer greater than or equal to 0"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("images").optional().isArray().withMessage("Images must be an array of URLs"),
  body("material").optional().trim(),
  body("origin").optional().trim(),
  body("artisanName").optional().trim(),
  body("isHandmade").optional().isBoolean(),
  body("isFeatured").optional().isBoolean(),
];

const updateProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID format"),
  body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty"),
  body("description").optional().trim().notEmpty().withMessage("Product description cannot be empty"),
  body("price").optional().isFloat({ min: 0 }),
  body("discountPrice").optional().isFloat({ min: 0 }),
  body("stock").optional().isInt({ min: 0 }),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
  body("images").optional().isArray(),
  body("material").optional().trim(),
  body("origin").optional().trim(),
  body("artisanName").optional().trim(),
  body("isHandmade").optional().isBoolean(),
  body("isFeatured").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
];

// Category routes (supported on both /api/products/categories and /api/categories via router mounting)
router.get("/categories", productController.getCategories);
router.get("/categories/:slug", productController.getCategoryBySlug);

// Specific product endpoints (must be declared BEFORE /:id)
router.get("/featured", productController.getFeaturedProducts);
router.get("/search", productController.searchProducts);
router.get("/category/:slug", productController.getProductsByCategorySlug);

// Upload product images for approved sellers and admins before creating a product.
router.post(
  "/images",
  authenticate,
  requireApprovedSeller,
  uploadProductImages,
  productController.uploadProductImages
);

// Catalog list and single item retrieval
router.get("/", productController.getAllProducts);
router.get(
  "/:id",
  validateRequest([param("id").isMongoId().withMessage("Invalid product ID")]),
  productController.getProductById
);

// Create product (Only approved sellers and admins)
router.post(
  "/",
  authenticate,
  requireApprovedSeller,
  validateRequest(createProductValidation),
  productController.createProduct
);

// Update product (Product owner or admin)
router.put(
  "/:id",
  authenticate,
  validateRequest(updateProductValidation),
  productController.updateProduct
);

// Delete product (Product owner or admin)
router.delete(
  "/:id",
  authenticate,
  validateRequest([param("id").isMongoId().withMessage("Invalid product ID")]),
  productController.deleteProduct
);

module.exports = router;

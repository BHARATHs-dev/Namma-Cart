const express = require("express");
const { body, param } = require("express-validator");
const sellerController = require("../controllers/sellerController");
const { authenticate } = require("../middleware/authentication");
const { authorize } = require("../middleware/authorization");
const { validateRequest } = require("../middleware/validation");
const Product = require("../models/Product");

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
const sellerProductFields = ["name", "description", "price", "discountPrice", "stock", "category", "image", "material", "origin", "artisanName"];
function allowSellerProductFields(req, res, next) {
  const unexpected = Object.keys(req.body || {}).filter((key) => !sellerProductFields.includes(key));
  if (unexpected.length) return res.status(400).json({ success: false, message: `Unexpected product fields: ${unexpected.join(", ")}` });
  if (req.method === "PUT" && !Object.keys(req.body || {}).length) return res.status(400).json({ success: false, message: "Provide at least one product field to update." });
  next();
}
const imageValidation = (field = "image") => body(field).custom((value) => {
  const validUrl = typeof value === "string" && /^https?:\/\//i.test(value);
  const validUpload = typeof value === "string" && value.length <= 4000000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
  if (!validUrl && !validUpload) throw new Error("Choose a JPEG, PNG, or WebP image up to 2 MB.");
  return true;
});
const createProductValidation = [
  body("name").trim().notEmpty().isLength({ max: 200 }),
  body("description").trim().notEmpty().isLength({ max: 5000 }),
  body("price").isFloat({ min: 0 }),
  body("discountPrice").optional({ values: "falsy" }).isFloat({ min: 0 }),
  body("stock").isInt({ min: 0 }),
  body("category").isIn(Product.SUPPORTED_CATEGORIES),
  imageValidation(),
  body("material").optional().trim().isLength({ max: 200 }),
  body("origin").optional().trim().isLength({ max: 200 }),
  body("artisanName").optional().trim().isLength({ max: 100 }),
];
const updateProductValidation = [
  body("name").optional().trim().notEmpty().isLength({ max: 200 }),
  body("description").optional().trim().notEmpty().isLength({ max: 5000 }),
  body("price").optional().isFloat({ min: 0 }),
  body("discountPrice").optional().isFloat({ min: 0 }),
  body("stock").optional().isInt({ min: 0 }),
  body("category").optional().isIn(Product.SUPPORTED_CATEGORIES),
  body("image").optional().custom((value) => {
    if (value === "") return true;
    const validUrl = typeof value === "string" && /^https?:\/\//i.test(value);
    const validUpload = typeof value === "string" && value.length <= 4000000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
    if (!validUrl && !validUpload) throw new Error("Choose a JPEG, PNG, or WebP image up to 2 MB.");
    return true;
  }),
  body("material").optional().trim().isLength({ max: 200 }),
  body("origin").optional().trim().isLength({ max: 200 }),
  body("artisanName").optional().trim().isLength({ max: 100 }),
];

router.post(
  "/products",
  authorize("SELLER", "ADMIN"),
  allowSellerProductFields,
  validateRequest(createProductValidation),
  sellerController.createProduct
);

router.put(
  "/products/:id",
  authorize("SELLER", "ADMIN"),
  allowSellerProductFields,
  validateRequest([param("id").isMongoId().withMessage("Invalid product ID"), ...updateProductValidation]),
  sellerController.updateProduct
);

router.delete(
  "/products/:id",
  authorize("SELLER", "ADMIN"),
  validateRequest([param("id").isMongoId().withMessage("Invalid product ID")]),
  sellerController.deleteProduct
);

module.exports = router;


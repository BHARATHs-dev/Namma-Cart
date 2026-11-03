const express = require("express");
const { body, param } = require("express-validator");
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/authentication");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

router.use(authenticate);

const addToCartValidation = [
  body("productId").isMongoId().withMessage("Valid product ID is required"),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const updateCartItemValidation = [
  param("itemId").isMongoId().withMessage("Valid cart item ID is required"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

router.get("/", cartController.getCart);
router.post("/add", validateRequest(addToCartValidation), cartController.addToCart);
router.put("/update/:itemId", validateRequest(updateCartItemValidation), cartController.updateCartItem);
router.delete("/remove/:itemId", validateRequest([param("itemId").isMongoId().withMessage("Valid cart item ID is required")]), cartController.removeCartItem);
router.delete("/clear", cartController.clearCart);

module.exports = router;


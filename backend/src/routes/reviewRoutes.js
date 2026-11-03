const express = require("express");
const { body, param } = require("express-validator");
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authentication");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

const createReviewValidation = [
  body("productId").isMongoId().withMessage("Valid product ID is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be an integer between 1 and 5"),
  body("comment").trim().notEmpty().withMessage("Comment is required").isLength({ max: 1000 }),
];

const updateReviewValidation = [
  param("id").isMongoId().withMessage("Valid review ID is required"),
  body("rating").optional().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().notEmpty().withMessage("Comment cannot be empty"),
];

// Public
router.get(
  "/product/:productId",
  validateRequest([param("productId").isMongoId().withMessage("Valid product ID is required")]),
  reviewController.getProductReviews
);

// Authenticated
router.post("/", authenticate, validateRequest(createReviewValidation), reviewController.createReview);
router.put("/:id", authenticate, validateRequest(updateReviewValidation), reviewController.updateReview);
router.delete(
  "/:id",
  authenticate,
  validateRequest([param("id").isMongoId().withMessage("Valid review ID is required")]),
  reviewController.deleteReview
);

module.exports = router;


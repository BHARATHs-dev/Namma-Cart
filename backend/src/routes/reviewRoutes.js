const express = require("express");
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authentication");

const router = express.Router();

// Public
router.get("/product/:productId", reviewController.getProductReviews);

// Authenticated
router.post("/", authenticate, reviewController.createReview);
router.put("/:id", authenticate, reviewController.updateReview);
router.delete("/:id", authenticate, reviewController.deleteReview);

module.exports = router;


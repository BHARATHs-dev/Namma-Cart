const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const { logActivity } = require("../services/activityService");
const { successResponse } = require("../middleware/validation");

/**
 * Recomputes and updates the average rating and review count on a product
 */
async function updateProductRatingMetrics(productId) {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
}

async function createReview(req, res, next) {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error("Invalid product ID.");
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      const error = new Error("Product not found or inactive.");
      error.statusCode = 404;
      throw error;
    }

    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      const error = new Error("You have already reviewed this product. You can update your existing review.");
      error.statusCode = 409;
      throw error;
    }

    const review = await Review.create({
      user: userId,
      product: productId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    await updateProductRatingMetrics(productId);

    await logActivity(userId, "REVIEW_ADDED", `Reviewed '${product.name}' with ${rating} stars`, {
      productId,
      rating,
    });

    await review.populate("user", "fullName profileImage");

    return successResponse(res, 201, "Review submitted successfully", { review });
  } catch (error) {
    next(error);
  }
}

async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error("Invalid product ID.");
      error.statusCode = 400;
      throw error;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "fullName profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: productId }),
    ]);

    return successResponse(res, 200, "Reviews fetched successfully", reviews, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    });
  } catch (error) {
    next(error);
  }
}

async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid review ID.");
      error.statusCode = 400;
      throw error;
    }

    const review = await Review.findById(id);
    if (!review) {
      const error = new Error("Review not found.");
      error.statusCode = 404;
      throw error;
    }

    if (review.user.toString() !== userId.toString()) {
      const error = new Error("You can only modify your own reviews.");
      error.statusCode = 403;
      throw error;
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment.trim();

    await review.save();
    await updateProductRatingMetrics(review.product);
    await review.populate("user", "fullName profileImage");

    return successResponse(res, 200, "Review updated successfully", { review });
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid review ID.");
      error.statusCode = 400;
      throw error;
    }

    const review = await Review.findById(id);
    if (!review) {
      const error = new Error("Review not found.");
      error.statusCode = 404;
      throw error;
    }

    const isOwner = review.user.toString() === user._id.toString();
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      const error = new Error("You can only delete your own reviews.");
      error.statusCode = 403;
      throw error;
    }

    const productId = review.product;
    await Review.deleteOne({ _id: id });
    await updateProductRatingMetrics(productId);

    return successResponse(res, 200, "Review deleted successfully.");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};

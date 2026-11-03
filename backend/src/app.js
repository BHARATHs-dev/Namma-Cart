const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { getDatabaseStatus } = require("./config/database");
const { successResponse, errorResponse } = require("./middleware/validation");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const sellerRoutes = require("./routes/sellerRoutes");

const productController = require("./controllers/productController");
const orderController = require("./controllers/orderController");

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health Check
  app.get("/api/health", (_req, res) => {
    const dbStatus = getDatabaseStatus();
    return successResponse(res, 200, "Server and database status", {
      status: "UP",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  });

  // Category and Coupon compatibility routes
  app.get("/api/categories", productController.getCategories);
  app.get("/api/categories/:slug", productController.getCategoryBySlug);
  app.post("/api/coupons/apply", orderController.applyCoupon);
  app.get("/api/coupons", orderController.getCoupons);

  // Mount Approved Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/sellers", sellerRoutes);

  // Route not found fallback
  app.use((req, res) => {
    return errorResponse(res, 404, `Route not found: [${req.method}] ${req.originalUrl}`);
  });

  // Centralized error handling
  app.use((err, _req, res, _next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = [];

    // Mongoose Bad ObjectId (CastError)
    if (err.name === "CastError") {
      statusCode = 400;
      message = `Invalid format for field: '${err.path}'`;
      errors = [{ field: err.path, message: `Invalid resource identifier: ${err.value}` }];
    } else if (err.name === "ValidationError") {
      statusCode = 400;
      message = "Database validation failed";
      errors = Object.values(err.errors).map((item) => ({
        field: item.path,
        message: item.message,
      }));
    } else if (err.code === 11000) {
      statusCode = 409;
      const duplicatedKeys = Object.keys(err.keyValue || {});
      const fieldName = duplicatedKeys.length ? duplicatedKeys.join(", ") : "field";
      message = `Duplicate value entered for ${fieldName}. Please provide unique values.`;
      errors = [{ field: fieldName, message: `A record with this ${fieldName} already exists.` }];
    } else if (err.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid authentication token";
    } else if (err.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Authentication token expired";
    }

    if (process.env.NODE_ENV === "development" && statusCode === 500) {
      console.error("Unhandled Error Details:", err);
    }

    return errorResponse(res, statusCode, message, errors);
  });

  module.exports = app;

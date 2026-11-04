const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const productService = require("../services/productService");
const { logActivity } = require("../services/activityService");
const { successResponse } = require("../middleware/validation");

/**
 * Register or upgrade an account to a seller account
 */
async function registerSeller(req, res, next) {
  try {
    const { shopName, shopDescription, businessAddress } = req.body;
      const userId = req.user._id;

      const user = await User.findById(userId);
      if(!user) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

    if(user.role === "SELLER" && user.sellerDetails?.approvalStatus === "APPROVED") {
        const error = new Error("You are already an approved seller.");
    error.statusCode = 400;
    throw error;
  }

    user.role = "SELLER";
  user.sellerDetails = {
    shopName: shopName.trim(),
    shopDescription: shopDescription ? shopDescription.trim() : "",
    businessAddress: businessAddress.trim(),
    approvalStatus: "APPROVED",
  };

  await user.save();

  await logActivity(user._id, "SELLER_REGISTERED", `Registered seller application for shop: ${shopName}`, {
    shopName,
  });

  return successResponse(
    res,
    201,
    "Your seller account is ready. You can now list products.",
      { user: user.toSafeObject() }
  );
} catch (error) {
  next(error);
}
}

/**
 * Seller dashboard overview stats
 */
async function getDashboard(req, res, next) {
  try {
    const sellerId = req.user._id;
    const sellerProducts = await Product.find({ seller: sellerId }).select("_id price stock isActive");
    const productIds = sellerProducts.map((p) => p._id);

    const totalProducts = sellerProducts.length;
    const activeProducts = sellerProducts.filter((p) => p.isActive).length;
    const lowStockProducts = sellerProducts.filter((p) => p.stock < 5).length;

    const orders = await Order.find({ "items.product": { $in: productIds } });

    let totalSales = 0;
    let totalUnitsSold = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;

    for (const order of orders) {
      if (order.orderStatus === "PLACED" || order.orderStatus === "PROCESSING") {
        pendingOrders += 1;
      }
      if (order.orderStatus === "DELIVERED") {
        deliveredOrders += 1;
      }

      if (order.orderStatus !== "CANCELLED") {
        for (const item of order.items) {
          if (productIds.some((id) => id.toString() === item.product.toString())) {
            totalSales += item.subtotal;
            totalUnitsSold += item.quantity;
          }
        }
      }
    }

    return successResponse(res, 200, "Seller dashboard stats fetched successfully", {
      dashboard: {
        shopName: req.user.sellerDetails?.shopName || "Seller",
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders: orders.length,
        pendingOrders,
        deliveredOrders,
        totalSales: Math.round(totalSales * 100) / 100,
        totalUnitsSold,
        currency: process.env.CURRENCY || "INR",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch seller's own products
 */
async function getProducts(req, res, next) {
  try {
    const sellerId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { seller: sellerId };
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Seller products fetched successfully", products, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch orders containing seller's products
 */
async function getOrders(req, res, next) {
  try {
    const sellerId = req.user._id;
    const sellerProducts = await Product.find({ seller: sellerId }).distinct("_id");
    const productIdsStr = sellerProducts.map((id) => id.toString());

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { "items.product": { $in: sellerProducts } };
    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "fullName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    const customizedOrders = orders.map((order) => {
      const sellerItems = order.items.filter((item) =>
        productIdsStr.includes(item.product.toString())
      );
      const sellerSubtotal = sellerItems.reduce((acc, item) => acc + item.subtotal, 0);

      return {
        _id: order._id,
        customer: order.user,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        items: sellerItems,
        sellerSubtotal,
        createdAt: order.createdAt,
      };
    });

    return successResponse(res, 200, "Seller orders fetched successfully", customizedOrders, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deep analytics for seller
 */
async function getAnalytics(req, res, next) {
  try {
    const sellerId = req.user._id;
    const sellerProducts = await Product.find({ seller: sellerId });
    const productIds = sellerProducts.map((p) => p._id);

    const orders = await Order.find({
      "items.product": { $in: productIds },
      orderStatus: { $ne: "CANCELLED" },
    });

    const productPerformance = {};
    for (const p of sellerProducts) {
      productPerformance[p._id.toString()] = {
        productId: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        unitsSold: 0,
        revenue: 0,
      };
    }

    for (const order of orders) {
      for (const item of order.items) {
        const pid = item.product.toString();
        if (productPerformance[pid]) {
          productPerformance[pid].unitsSold += item.quantity;
          productPerformance[pid].revenue += item.subtotal;
        }
      }
    }

    const topProducts = Object.values(productPerformance).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = topProducts.reduce((acc, p) => acc + p.revenue, 0);
    const totalUnits = topProducts.reduce((acc, p) => acc + p.unitsSold, 0);

    const lowStockAlerts = sellerProducts
      .filter((p) => p.stock < 5 && p.isActive)
      .map((p) => ({
        productId: p._id,
        name: p.name,
        currentStock: p.stock,
      }));

    return successResponse(res, 200, "Seller analytics fetched successfully", {
      analytics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalUnitsSold: totalUnits,
        topProducts: topProducts.slice(0, 5),
        lowStockAlerts,
        currency: process.env.CURRENCY || "INR",
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const fields = ["name", "description", "price", "discountPrice", "stock", "category", "material", "origin", "artisanName"];
    const changes = Object.fromEntries(fields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    if (req.body.image) changes.images = [req.body.image];
    const product = await productService.updateProduct(req.params.id, changes, req.user);
    return successResponse(res, 200, "Product updated successfully", { product });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      discountPrice: req.body.discountPrice || 0,
      stock: req.body.stock,
      category: req.body.category,
      images: [req.body.image],
      material: req.body.material,
      origin: req.body.origin,
      artisanName: req.body.artisanName,
      isHandmade: true,
    }, req.user);
    return successResponse(res, 201, "Product listed successfully", { product });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user);
    return successResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
}

  async function getApplications(_req, res, next) {
    try {
      const applications = await User.find({
        role: "SELLER",
        "sellerDetails.approvalStatus": "PENDING",
      }).select("fullName email phone sellerDetails createdAt");

      return successResponse(res, 200, "Seller applications fetched successfully", { applications });
    } catch (error) {
      next(error);
    }
  }

  async function updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const { sellerId } = req.params;

      if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
        const error = new Error("Invalid status. Must be APPROVED, REJECTED, or PENDING.");
        error.statusCode = 400;
        throw error;
      }

      const seller = await User.findById(sellerId);
      if (!seller) {
        const error = new Error("Seller not found.");
        error.statusCode = 404;
        throw error;
      }

      if (!seller.sellerDetails) {
        seller.sellerDetails = {};
      }

      seller.sellerDetails.approvalStatus = status;
      await seller.save();

      await logActivity(seller._id, "SELLER_STATUS_UPDATED", `Seller application set to ${status}`, {
        approvalStatus: status,
      });

      return successResponse(res, 200, `Seller status updated to ${status}`, {
        user: seller.toSafeObject(),
      });
    } catch (error) {
      next(error);
    }
  }

  module.exports = {
    registerSeller,
    getDashboard,
    getProducts,
    getOrders,
    getAnalytics,
    createProduct,
    updateProduct,
    deleteProduct,
    getApplications,
    updateStatus,
  };

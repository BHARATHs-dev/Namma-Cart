const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { getEffectivePrice } = require("./cartService");
const { logActivity } = require("./activityService");

/**
 * Built-in system coupons
 */
const SYSTEM_COUPONS = {
  SAVE10: {
    code: "SAVE10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minimumOrderAmount: 500,
    maximumDiscount: 1000,
    expiryDate: new Date("2028-12-31"),
    usageLimit: 1000,
    isActive: true,
  },
  NAMMA20: {
    code: "NAMMA20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minimumOrderAmount: 2000,
    maximumDiscount: 1500,
    expiryDate: new Date("2028-12-31"),
    usageLimit: 500,
    isActive: true,
  },
};

/**
 * Validates a coupon code and calculates discount amount entirely on the backend
 */
async function validateAndCalculateCoupon(code, orderAmount) {
  if (!code || typeof code !== "string") {
    const error = new Error("Coupon code is required.");
    error.statusCode = 400;
    throw error;
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = SYSTEM_COUPONS[cleanCode];

  if (!coupon || !coupon.isActive) {
    const error = new Error("Invalid coupon code or coupon is no longer active.");
    error.statusCode = 400;
    throw error;
  }

  if (new Date(coupon.expiryDate) < new Date()) {
    const error = new Error("This coupon has expired.");
    error.statusCode = 400;
    throw error;
  }

  const amount = Number(orderAmount) || 0;
  if (coupon.minimumOrderAmount && amount < coupon.minimumOrderAmount) {
    const error = new Error(
      `Minimum order amount of ₹${coupon.minimumOrderAmount} is required to apply coupon '${coupon.code}'.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Check persistent usage limit using Order.CouponUsage
  if (Order.CouponUsage) {
    const timesUsed = await Order.CouponUsage.countDocuments({ code: cleanCode });
    if (coupon.usageLimit && timesUsed >= coupon.usageLimit) {
      const error = new Error("Coupon usage limit has been reached.");
      error.statusCode = 400;
      throw error;
    }
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    const rawDiscount = (amount * coupon.discountValue) / 100;
    discountAmount = coupon.maximumDiscount
      ? Math.min(rawDiscount, coupon.maximumDiscount)
      : rawDiscount;
  } else if (coupon.discountType === "FIXED") {
    discountAmount = Math.min(coupon.discountValue, amount);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const newTotal = Math.max(0, Math.round((amount - discountAmount) * 100) / 100);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    newTotal,
    coupon,
  };
}

/**
 * Return all active system coupons
 */
function getAllCoupons() {
  return Object.values(SYSTEM_COUPONS).filter(
    (c) => c.isActive && new Date(c.expiryDate) > new Date()
  );
}

/**
 * Calculates shipping charges based on environment configuration
 */
function calculateShipping(subtotal) {
  const freeThreshold = Number(process.env.SHIPPING_FREE_THRESHOLD) || 1000;
  const standardCharge = Number(process.env.SHIPPING_CHARGE) || 50;

  if (subtotal >= freeThreshold) {
    return 0;
  }
  return standardCharge;
}

/**
 * Executes atomic stock deduction and checkout
 */
async function checkout(userId, { shippingAddress, paymentMethod, couponCode }) {
  if (!shippingAddress) {
    const error = new Error("Shipping address is required for checkout.");
    error.statusCode = 400;
    throw error;
  }

  const { fullName, phone, address, city, state, pincode } = shippingAddress;
  if (!fullName || !phone || !address || !city || !state || !pincode) {
    const error = new Error(
      "All shipping address fields (fullName, phone, address, city, state, pincode) are required."
    );
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    const error = new Error("Your cart is empty. Add items before checking out.");
    error.statusCode = 400;
    throw error;
  }

  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product);

    if (!product || !product.isActive) {
      const error = new Error("A product in your cart is no longer available.");
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < cartItem.quantity) {
      const error = new Error(
        `Insufficient stock for '${product.name}'. Only ${product.stock} units available, but ${cartItem.quantity} requested.`
      );
      error.statusCode = 400;
      throw error;
    }

    const effectivePrice = getEffectivePrice(product);
    const itemSubtotal = effectivePrice * cartItem.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productImage: product.images && product.images.length > 0 ? product.images[0] : "",
      quantity: cartItem.quantity,
      price: effectivePrice,
      subtotal: itemSubtotal,
    });
  }

  // Coupon calculation
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode && couponCode.trim()) {
    const couponResult = await validateAndCalculateCoupon(couponCode, subtotal);
    discountAmount = couponResult.discountAmount;
    appliedCoupon = couponResult.coupon;
  }

  // Shipping calculation
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const shippingAmount = calculateShipping(taxableAmount);
  const finalAmount = Math.round((taxableAmount + shippingAmount) * 100) / 100;

  // Atomic stock deduction
  for (const item of orderItems) {
    const updateResult = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (updateResult.modifiedCount === 0) {
      for (const previouslyDeducted of orderItems) {
        if (previouslyDeducted.product.toString() === item.product.toString()) break;
        await Product.updateOne(
          { _id: previouslyDeducted.product },
          { $inc: { stock: previouslyDeducted.quantity } }
        );
      }

      const error = new Error(`Stock error during checkout for ${item.productName}. Please try again.`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Create Order with price snapshots
  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalAmount: subtotal,
    discountAmount,
    shippingAmount,
    finalAmount,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    shippingAddress: {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    },
    paymentMethod: paymentMethod === "Online Payment" ? "Online Payment" : "Cash on Delivery",
    paymentStatus: "PENDING",
    orderStatus: "PLACED",
    statusHistory: [
      {
        status: "PLACED",
        timestamp: new Date(),
        note: `Order placed successfully with ${paymentMethod || "Cash on Delivery"}`,
      },
    ],
  });

    // Track coupon usage in Order.CouponUsage
    if (appliedCoupon && Order.CouponUsage) {
      await Order.CouponUsage.create({
        code: appliedCoupon.code,
        user: userId,
        order: order._id,
        discountAmount,
      });
    }

    // Clear user's cart
    cart.items = [];
    await cart.save();

    // Log activity
    await logActivity(userId, "ORDER_PLACED", `Placed order #${order._id} for ₹${finalAmount}`, {
      orderId: order._id,
      finalAmount,
      itemsCount: orderItems.length,
    });

    return order;
  }

  async function getOrderById(orderId, user) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      const error = new Error("Invalid order ID format.");
      error.statusCode = 400;
      throw error;
    }

    const order = await Order.findById(orderId).populate("user", "fullName email phone");
    if (!order) {
      const error = new Error("Order not found.");
      error.statusCode = 404;
      throw error;
    }

    const isOwner = order.user._id.toString() === user._id.toString();
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      const error = new Error("You are not authorized to view this order.");
      error.statusCode = 403;
      throw error;
    }

    return order;
  }

  async function getUserOrders(userId) {
    return Order.find({ user: userId }).sort({ createdAt: -1 });
  }

  async function getAllOrders(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (queryParams.status) {
      filter.orderStatus = queryParams.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "fullName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async function cancelOrder(orderId, user) {
    const order = await getOrderById(orderId, user);

    const nonCancellableStatuses = ["SHIPPED", "DELIVERED", "CANCELLED"];
    if (nonCancellableStatuses.includes(order.orderStatus)) {
      const error = new Error(`Order cannot be cancelled because it is already '${order.orderStatus}'.`);
      error.statusCode = 400;
      throw error;
    }

    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }

    order.orderStatus = "CANCELLED";
    order.statusHistory.push({
      status: "CANCELLED",
      timestamp: new Date(),
      note: `Order cancelled by ${user.role === "ADMIN" ? "Admin" : "Customer"}`,
    });

    await order.save();

    await logActivity(user._id, "ORDER_CANCELLED", `Cancelled order #${order._id}`, {
      orderId: order._id,
    });

    return order;
  }

  async function getOrderTracking(orderId, user) {
    const order = await getOrderById(orderId, user);
    return {
      orderId: order._id,
      currentStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingTimeline: order.statusHistory,
      estimatedDelivery: new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000),
    };
  }

  module.exports = {
    SYSTEM_COUPONS,
    validateAndCalculateCoupon,
    getAllCoupons,
    calculateShipping,
    checkout,
    getOrderById,
    getUserOrders,
    getAllOrders,
    cancelOrder,
    getOrderTracking,
  };

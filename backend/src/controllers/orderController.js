const orderService = require("../services/orderService");
const cartService = require("../services/cartService");
const { successResponse } = require("../middleware/validation");

// Coupon Handlers
async function applyCoupon(req, res, next) {
  try {
    const { code } = req.body;
    let orderAmount = req.body.orderAmount;

    if (orderAmount === undefined && req.user) {
      const cart = await cartService.getCart(req.user._id);
      orderAmount = cart.summary.subtotal;
    }

    const result = await orderService.validateAndCalculateCoupon(code, orderAmount);

    return successResponse(res, 200, `Coupon '${result.code}' applied successfully`, {
      code: result.code,
      discountType: result.discountType,
      discountValue: result.discountValue,
      originalAmount: orderAmount,
      discountAmount: result.discountAmount,
      finalAmount: result.newTotal,
    });
  } catch (error) {
    next(error);
  }
}

function getCoupons(_req, res, next) {
  try {
    const coupons = orderService.getAllCoupons();
    return successResponse(res, 200, "Active coupons fetched successfully", { coupons });
  } catch (error) {
    next(error);
  }
}

// Order Handlers
async function checkout(req, res, next) {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;
    const order = await orderService.checkout(req.user._id, {
      shippingAddress,
      paymentMethod,
      couponCode,
    });
    return successResponse(res, 201, "Order placed successfully", { order });
  } catch (error) {
    next(error);
  }
}

async function getOrders(req, res, next) {
  try {
    if (req.user.role === "ADMIN") {
      const result = await orderService.getAllOrders(req.query);
      return successResponse(res, 200, "Orders fetched successfully", result.orders, result.pagination);
    }

    const orders = await orderService.getUserOrders(req.user._id);
    return successResponse(res, 200, "Orders fetched successfully", { orders });
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    return successResponse(res, 200, "Order details fetched successfully", { order });
  } catch (error) {
    next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user);
    return successResponse(res, 200, "Order cancelled successfully", { order });
  } catch (error) {
    next(error);
  }
}

async function getOrderTracking(req, res, next) {
  try {
    const tracking = await orderService.getOrderTracking(req.params.id, req.user);
    return successResponse(res, 200, "Order tracking timeline fetched successfully", { tracking });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyCoupon,
  getCoupons,
  checkout,
  getOrders,
  getOrderById,
  cancelOrder,
  getOrderTracking,
};

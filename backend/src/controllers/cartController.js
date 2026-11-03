const cartService = require("../services/cartService");
const { successResponse } = require("../middleware/validation");

async function getCart(req, res, next) {
  try {
    const cart = await cartService.getCart(req.user._id);
    return successResponse(res, 200, "Cart fetched successfully", cart);
  } catch (error) {
    next(error);
  }
}

async function addToCart(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user._id, { productId, quantity });
    return successResponse(res, 200, "Product added to cart", cart);
  } catch (error) {
    next(error);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateCartItemQuantity(req.user._id, itemId, quantity);
    return successResponse(res, 200, "Cart item updated", cart);
  } catch (error) {
    next(error);
  }
}

async function removeCartItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const cart = await cartService.removeCartItem(req.user._id, itemId);
    return successResponse(res, 200, "Item removed from cart", cart);
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const result = await cartService.clearCart(req.user._id);
    return successResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};

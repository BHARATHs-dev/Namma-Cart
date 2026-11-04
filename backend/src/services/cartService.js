const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

/**
 * Calculates current effective price of a product
 */
function getEffectivePrice(product) {
  if (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price) {
    return product.discountPrice;
  }
  return product.price;
}

/**
 * Formats cart with computed prices, item subtotals, and overall totals
 */
function formatCartResponse(cart) {
  let subtotal = 0;
  let totalItems = 0;

  const validItems = [];

  for (const item of cart.items) {
    if (!item.product) continue;

    const product = item.product;
    const currentPrice = getEffectivePrice(product);
    const itemSubtotal = currentPrice * item.quantity;

    subtotal += itemSubtotal;
    totalItems += item.quantity;

    validItems.push({
      _id: item._id,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        price: product.price,
        discountPrice: product.discountPrice,
        effectivePrice: currentPrice,
        stock: product.stock,
        isActive: product.isActive,
      },
      quantity: item.quantity,
      price: currentPrice,
      subtotal: itemSubtotal,
    });
  }

  return {
    _id: cart._id,
    user: cart.user,
    items: validItems,
    summary: {
      totalItems,
      subtotal,
      currency: process.env.CURRENCY || "INR",
    },
    updatedAt: cart.updatedAt,
  };
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug images price discountPrice stock isActive",
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name slug images price discountPrice stock isActive",
    });
  }

  return cart;
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  return formatCartResponse(cart);
}

async function addToCart(userId, { productId, quantity = 1 }) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid product ID.");
    error.statusCode = 400;
    throw error;
  }

  const requestedQty = quantity === undefined ? 1 : Number(quantity);
  if (!Number.isInteger(requestedQty) || requestedQty < 1) {
    const error = new Error("Quantity must be a whole number greater than or equal to 1.");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    const error = new Error("Product is unavailable or has been removed.");
    error.statusCode = 404;
    throw error;
  }

  if (product.stock < 1) {
    const error = new Error(`Sorry, '${product.name}' is out of stock.`);
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ user: userId }) || new Cart({ user: userId, items: [] });

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  const effectivePrice = getEffectivePrice(product);

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + requestedQty;

    if (newQuantity > product.stock) {
      const error = new Error(
        `Cannot add ${requestedQty} more. Only ${product.stock} items are available in stock (${cart.items[existingItemIndex].quantity} already in cart).`
      );
      error.statusCode = 400;
      throw error;
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = effectivePrice;
  } else {
    if (requestedQty > product.stock) {
      const error = new Error(`Only ${product.stock} items are available in stock.`);
      error.statusCode = 400;
      throw error;
    }

    cart.items.push({
      product: product._id,
      quantity: requestedQty,
      price: effectivePrice,
    });
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "name slug images price discountPrice stock isActive",
  });

  return formatCartResponse(populatedCart);
}

async function updateCartItemQuantity(userId, itemId, quantity) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    const error = new Error("Invalid cart item ID.");
    error.statusCode = 400;
    throw error;
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1) {
    const error = new Error("Quantity must be an integer greater than or equal to 1.");
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const error = new Error("Cart not found.");
    error.statusCode = 404;
    throw error;
  }

  const item = cart.items.id(itemId);
  if (!item) {
    const error = new Error("Item not found in cart.");
    error.statusCode = 404;
    throw error;
  }

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) {
    const error = new Error("Product is no longer available.");
    error.statusCode = 400;
    throw error;
  }

  if (qty > product.stock) {
    const error = new Error(`Only ${product.stock} units of '${product.name}' are available.`);
    error.statusCode = 400;
    throw error;
  }

  item.quantity = qty;
  item.price = getEffectivePrice(product);

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "name slug images price discountPrice stock isActive",
  });

  return formatCartResponse(populatedCart);
}

async function removeCartItem(userId, itemId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    const error = new Error("Invalid cart item ID.");
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const error = new Error("Cart not found.");
    error.statusCode = 404;
    throw error;
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId.toString());
  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "name slug images price discountPrice stock isActive",
  });

  return formatCartResponse(populatedCart);
}

async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return { message: "Cart cleared successfully." };
}

module.exports = {
  getEffectivePrice,
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};


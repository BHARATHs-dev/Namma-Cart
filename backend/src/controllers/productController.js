const Product = require("../models/Product");
const productService = require("../services/productService");

function formatProduct(product) {
  return {
    id: String(product._id),
    title: product.name,
    price: product.price,
    discountPrice: product.discountPrice,
    stock: product.stock,
    description: product.description,
    category: product.category,
    image: product.images?.[0] || "",
    material: product.material,
    origin: product.origin,
    artisanName: product.artisanName,
    seller: product.seller ? {
      fullName: product.seller.fullName,
      sellerDetails: product.seller.sellerDetails,
    } : null,
    rating: {
      rate: Number(product.averageRating || 0),
      count: Number(product.totalReviews || 0),
    },
  };
}

function toModelData(data) {
  const result = {};
  if (data.title !== undefined) result.name = data.title;
  if (data.price !== undefined) result.price = data.price;
  if (data.description !== undefined) result.description = data.description;
  if (data.category !== undefined) result.category = data.category;
  if (data.image !== undefined) result.images = [data.image];
  if (data.rating?.rate !== undefined) result.averageRating = data.rating.rate;
  if (data.rating?.count !== undefined) result.totalReviews = data.rating.count;
  return result;
}

function sendProductList(res, result) {
  res.set("X-Total-Count", String(result.pagination.total));
  res.set("X-Total-Pages", String(result.pagination.totalPages));
  return res.json(result.products.map(formatProduct));
}

async function getCategories(_req, res, next) {
  try {
    const categories = await Product.distinct("category", { isActive: true });
    return res.json(categories.sort());
  } catch (error) { next(error); }
}

function getCategoryBySlug(req, res, next) {
  try {
    const category = productService.getCategoryBySlug(req.params.slug);
    return res.json(category);
  } catch (error) { next(error); }
}

async function getAllProducts(req, res, next) {
  try {
    const result = await productService.getAllProducts(req.query);
    return sendProductList(res, result);
  } catch (error) { next(error); }
}

async function getFeaturedProducts(req, res, next) {
  try {
    const products = await productService.getFeaturedProducts(req.query.limit || 8);
    return res.json(products.map(formatProduct));
  } catch (error) { next(error); }
}

async function getProductsByCategorySlug(req, res, next) {
  try {
    const result = await productService.getAllProducts({ ...req.query, category: req.params.slug });
    return sendProductList(res, result);
  } catch (error) { next(error); }
}

async function searchProducts(req, res, next) {
  try {
    const result = await productService.getAllProducts({ ...req.query, q: req.query.q || "" });
    return sendProductList(res, result);
  } catch (error) { next(error); }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.json(formatProduct(product));
  } catch (error) { next(error); }
}

async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct({
      ...toModelData(req.body),
      stock: 20,
      discountPrice: 0,
      origin: "Tamil Nadu",
      isHandmade: true,
    }, req.user);
    return res.status(201).json(formatProduct(product));
  } catch (error) { next(error); }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, toModelData(req.body), req.user);
    return res.json(formatProduct(product));
  } catch (error) { next(error); }
}

async function deleteProduct(req, res, next) {
  try {
    await productService.getProductById(req.params.id);
    const result = await productService.deleteProduct(req.params.id, req.user);
    return res.json({ message: result.message });
  } catch (error) { next(error); }
}

module.exports = {
  formatProduct,
  getCategories,
  getCategoryBySlug,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategorySlug,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

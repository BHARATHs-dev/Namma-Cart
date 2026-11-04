const Product = require("../models/Product");
const productService = require("../services/productService");
const { successResponse } = require("../middleware/validation");

// Category Handlers
function getCategories(_req, res, next) {
  try {
    const categories = productService.getAllCategories();
    return successResponse(res, 200, "Categories fetched successfully", { categories });
  } catch (error) {
    next(error);
  }
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

async function uploadProductImages(req, res, next) {
  try {
    if (!req.files?.length) {
      return errorResponse(res, 400, "At least one image file is required in the 'images' field.");
    }

    const images = await cloudinaryService.uploadProductImages(req.files, req.user._id);
    return successResponse(res, 201, "Product images uploaded successfully", { images });
  } catch (error) {
    next(error);
  }
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
  uploadProductImages,
  updateProduct,
  deleteProduct,
};

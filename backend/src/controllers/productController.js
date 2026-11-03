const productService = require("../services/productService");
const cloudinaryService = require("../services/cloudinaryService");
const { successResponse, errorResponse } = require("../middleware/validation");

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
    return successResponse(res, 200, "Category fetched successfully", { category });
  } catch (error) {
    next(error);
  }
}

// Product Handlers
async function getAllProducts(req, res, next) {
  try {
    const result = await productService.getAllProducts(req.query);
    return successResponse(
      res,
      200,
      "Products fetched successfully",
      result.products,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
}

async function getFeaturedProducts(req, res, next) {
  try {
    const products = await productService.getFeaturedProducts(req.query.limit || 8);
    return successResponse(res, 200, "Featured products fetched successfully", { products });
  } catch (error) {
    next(error);
  }
}

async function getProductsByCategorySlug(req, res, next) {
  try {
    const result = await productService.getProductsByCategorySlug(req.params.slug, req.query);
    return successResponse(
      res,
      200,
      `Products for category '${req.params.slug}' fetched successfully`,
      result.products,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
}

async function searchProducts(req, res, next) {
  try {
    const keyword = req.query.q || "";
    const result = await productService.getAllProducts({ ...req.query, q: keyword });
    return successResponse(
      res,
      200,
      "Search results fetched successfully",
      result.products,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    return successResponse(res, 200, "Product details fetched successfully", { product });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.body, req.user);
    return successResponse(res, 201, "Product created successfully", { product });
  } catch (error) {
    next(error);
  }
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
    const product = await productService.updateProduct(req.params.id, req.body, req.user);
    return successResponse(res, 200, "Product updated successfully", { product });
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

module.exports = {
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

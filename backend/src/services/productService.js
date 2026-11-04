const mongoose = require("mongoose");
const Product = require("../models/Product");
const { logActivity } = require("./activityService");

/**
 * Generate URL-friendly slug
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Return all supported traditional categories with metadata
 */
function getAllCategories() {
  return Product.CATEGORY_METADATA;
}

/**
 * Find single category metadata by slug
 */
function getCategoryBySlug(slug) {
  const cat = Product.CATEGORY_METADATA.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase()
  );

  if (!cat) {
    const error = new Error(`Category with slug '${slug}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  return cat;
}

async function getAllProducts(queryParams = {}) {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const allProducts = queryParams.page === undefined && queryParams.limit === undefined;
  const limit = allProducts ? 0 : Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 12));
  const skip = allProducts ? 0 : (page - 1) * limit;

  const filter = { isActive: true };

  // Category filter (match by slug or exact category name)
  if (queryParams.category) {
    const matchedCategory = Product.CATEGORY_METADATA.find(
      (c) =>
        c.slug.toLowerCase() === queryParams.category.toLowerCase() ||
        c.name.toLowerCase() === queryParams.category.toLowerCase()
    );

    const targetCategory = matchedCategory ? matchedCategory.name : queryParams.category;
    filter.category = new RegExp(
      `^${targetCategory.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
      "i"
    );
  }

  // Price range filters
  if (queryParams.minPrice !== undefined || queryParams.maxPrice !== undefined) {
    filter.price = {};
    if (queryParams.minPrice !== undefined && !isNaN(Number(queryParams.minPrice))) {
      filter.price.$gte = Number(queryParams.minPrice);
    }
    if (queryParams.maxPrice !== undefined && !isNaN(Number(queryParams.maxPrice))) {
      filter.price.$lte = Number(queryParams.maxPrice);
    }
  }

  // Origin filter
  if (queryParams.origin) {
    filter.origin = new RegExp(queryParams.origin.trim(), "i");
  }

  // Handmade filter
  if (queryParams.isHandmade !== undefined) {
    filter.isHandmade = queryParams.isHandmade === "true" || queryParams.isHandmade === true;
  }

  // Featured filter
  if (queryParams.isFeatured !== undefined) {
    filter.isFeatured = queryParams.isFeatured === "true" || queryParams.isFeatured === true;
  }

  if (queryParams.minRating !== undefined && !isNaN(Number(queryParams.minRating))) {
    filter.averageRating = { $gte: Math.max(0, Math.min(5, Number(queryParams.minRating))) };
  }

  // Keyword search
  const keyword = queryParams.search || queryParams.q;
  if (keyword && keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { origin: searchRegex },
      { material: searchRegex },
      { artisanName: searchRegex },
      { category: searchRegex },
    ];
  }

  // Sort mappings
  let sortOption = { createdAt: -1 };
  if (queryParams.sort) {
    switch (queryParams.sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "rating":
        sortOption = { averageRating: -1, totalReviews: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
  }

  let productQuery = Product.find(filter)
    .populate("seller", "fullName sellerDetails.shopName")
    .sort(sortOption);
  if (!allProducts) productQuery = productQuery.skip(skip).limit(limit);

  const [products, total] = await Promise.all([
    productQuery,
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit: allProducts ? total : limit,
      total,
      totalPages: allProducts ? (total ? 1 : 0) : Math.ceil(total / limit) || 0,
    },
  };
}

async function getProductById(id, includeInactive = false) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid product ID format.");
    error.statusCode = 400;
    throw error;
  }

  const query = { _id: id };
  if (!includeInactive) {
    query.isActive = true;
  }

  const product = await Product.findOne(query).populate(
    "seller",
    "fullName email sellerDetails.shopName sellerDetails.businessAddress"
  );

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  return product;
}

async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug: slug.toLowerCase(), isActive: true }).populate(
    "seller",
    "fullName sellerDetails.shopName sellerDetails.businessAddress"
  );

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  return product;
}

async function getFeaturedProducts(limit = 8) {
  return Product.find({ isFeatured: true, isActive: true })
    .populate("seller", "fullName sellerDetails.shopName")
    .sort({ createdAt: -1 })
    .limit(Number(limit));
}

async function getProductsByCategorySlug(slug, queryParams = {}) {
  const categoryMeta = getCategoryBySlug(slug);
  return getAllProducts({ ...queryParams, category: categoryMeta.name });
}

async function createProduct(data, user) {
    let categoryName = (data.category || "").trim();

    // Match against supported categories or metadata slugs
    const matched = Product.CATEGORY_METADATA.find(
      (c) =>
        c.slug.toLowerCase() === categoryName.toLowerCase() ||
        c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (matched) {
      categoryName = matched.name;
    } else if (!categoryName) {
      categoryName = "Handicrafts";
    }

    let slug = data.slug ? generateSlug(data.slug) : generateSlug(data.name);

    // Ensure slug uniqueness
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await Product.create({
      name: data.name.trim(),
      slug,
      description: data.description.trim(),
      price: Number(data.price),
      discountPrice: data.discountPrice !== undefined ? Number(data.discountPrice) : 0,
      stock: Number(data.stock),
      category: categoryName,
      seller: user._id,
      images: Array.isArray(data.images) ? data.images : data.images ? [data.images] : [],
      material: data.material ? data.material.trim() : "",
      origin: data.origin ? data.origin.trim() : "Tamil Nadu",
      artisanName: data.artisanName ? data.artisanName.trim() : "",
      isHandmade: data.isHandmade !== undefined ? data.isHandmade : true,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : false,
      isActive: true,
    });

    await logActivity(user._id, "PRODUCT_CREATED", `Created new product: ${product.name}`, {
      productId: product._id,
    });

    return product.populate({ path: "seller", select: "fullName sellerDetails.shopName" });
  }

  async function updateProduct(id, updateData, user) {
    const product = await getProductById(id, true);

    const isOwner = product.seller._id.toString() === user._id.toString();
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      const error = new Error("You do not have permission to modify this product.");
      error.statusCode = 403;
      throw error;
    }

    const updatableFields = [
      "name",
      "description",
      "price",
      "discountPrice",
      "stock",
      "category",
      "images",
      "material",
      "origin",
      "artisanName",
      "isHandmade",
      "isFeatured",
      "isActive",
      "averageRating",
      "totalReviews",
    ];

    for (const field of updatableFields) {
        if (updateData[field] !== undefined) {
          if (field === "category") {
            const matched = Product.CATEGORY_METADATA.find(
              (c) =>
                c.slug.toLowerCase() === updateData.category.toLowerCase() ||
                c.name.toLowerCase() === updateData.category.toLowerCase()
            );
            product.category = matched ? matched.name : updateData.category.trim();
          } else {
            product[field] = updateData[field];
          }
        }
      }

      if (updateData.name && !updateData.slug) {
        let newSlug = generateSlug(updateData.name);
        const existing = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
        if (existing) {
          newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
        }
        product.slug = newSlug;
      }

      await product.save();

      await logActivity(user._id, "PRODUCT_UPDATED", `Updated product: ${product.name}`, {
        productId: product._id,
      });

      return product.populate({ path: "seller", select: "fullName sellerDetails.shopName" });
    }

    async function deleteProduct(id, user) {
      const product = await getProductById(id, true);

      const isOwner = product.seller._id.toString() === user._id.toString();
      const isAdmin = user.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        const error = new Error("You do not have permission to delete this product.");
        error.statusCode = 403;
        throw error;
      }

      product.isActive = false;
      await product.save();

      await logActivity(user._id, "PRODUCT_DELETED", `Soft deleted product: ${product.name}`, {
        productId: product._id,
      });

      return { message: "Product deactivated successfully." };
    }

    module.exports = {
      generateSlug,
      getAllCategories,
      getCategoryBySlug,
      getAllProducts,
      getProductById,
      getProductBySlug,
      getFeaturedProducts,
      getProductsByCategorySlug,
      createProduct,
      updateProduct,
      deleteProduct,
    };

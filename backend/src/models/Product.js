const mongoose = require("mongoose");

const SUPPORTED_CATEGORIES = [
  "Traditional Clothing",
  "Handicrafts",
  "Traditional Jewellery",
  "Traditional Food",
  "Home Decor",
  "Pottery and Terracotta",
  "Pooja Items",
  "Eco-Friendly Products",
];

const CATEGORY_METADATA = [
  {
    name: "Traditional Clothing",
    slug: "traditional-clothing",
    description: "Authentic handloom sarees, veshtis, and traditional ethnic wear from historic weaving centers of Tamil Nadu.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Handicrafts",
    slug: "handicrafts",
    description: "Finely sculpted stone idols, wood carvings, and heritage metal crafts honoring ancient Dravidian artisans.",
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Traditional Jewellery",
    slug: "traditional-jewellery",
    description: "Classical temple jewellery, coin necklaces, and antique brass ornaments crafted with historic motifs.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Traditional Food",
    slug: "traditional-food",
    description: "Authentic regional delicacies, palm jaggery, organic cold-pressed oils, and traditional filter coffee blends.",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    description: "Tanjore gold foil paintings, brass urlis, Athangudi handmade tiles, and traditional wall hangings.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Pottery and Terracotta",
    slug: "pottery-and-terracotta",
    description: "Natural clay cooking pots, handcrafted terracotta lanterns, and Aiyanar equestrian terracotta art.",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Pooja Items",
    slug: "pooja-items",
    description: "Solid brass Kuthu Vilakkus, camphor plates, temple bell sets, and sacred brass puja vessels.",
    image: "https://images.unsplash.com/photo-1609743522653-52354461eb27?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Eco-Friendly Products",
    slug: "eco-friendly-products",
    description: "Handcrafted palm leaf storage boxes, bamboo baskets, vetiver bath scrubbers, and coconut shell tableware.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, "Discount price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller reference is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    material: {
      type: String,
      trim: true,
      default: "",
    },
    origin: {
      type: String,
      trim: true,
      default: "Tamil Nadu",
    },
    artisanName: {
      type: String,
      trim: true,
      default: "",
    },
    isHandmade: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: "text", description: "text", origin: "text", material: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ seller: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

const Product = mongoose.model("Product", productSchema);

Product.SUPPORTED_CATEGORIES = SUPPORTED_CATEGORIES;
Product.CATEGORY_METADATA = CATEGORY_METADATA;

module.exports = Product;

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Recipient phone is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      default: "Tamil Nadu",
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for order"],
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order items cannot be empty"],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "An order must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Online Payment"],
      default: "Cash on Delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    orderStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: "PLACED", timestamp: new Date(), note: "Order placed successfully" }],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

const couponUsageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

couponUsageSchema.index({ code: 1, user: 1 });

const Order = mongoose.model("Order", orderSchema);
const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

Order.CouponUsage = CouponUsage;

module.exports = Order;

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const sellerDetailsSchema = new mongoose.Schema({
  shopName: { type: String, trim: true, default: "" },
  shopDescription: { type: String, trim: true, default: "" },
  businessAddress: { type: String, trim: true, default: "" },
  approvalStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  phone: { type: String, trim: true, default: "" },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ["CUSTOMER", "SELLER", "ADMIN"], default: "CUSTOMER" },
  profileImage: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "Tamil Nadu" },
  pincode: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  sellerDetails: { type: sellerDetailsSchema, default: null },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

module.exports = mongoose.model("User", userSchema);

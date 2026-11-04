require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function createAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;
  if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env first.");
  }
  if (ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");

  await mongoose.connect(MONGODB_URI);
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });
  if (existing && existing.role !== "ADMIN") throw new Error("That email already belongs to a non-admin account.");
  if (existing) return console.log("Admin account already exists.");

  await User.create({ fullName: ADMIN_NAME.trim(), email: ADMIN_EMAIL.trim(), password: ADMIN_PASSWORD, role: "ADMIN" });
  console.log("Admin account created. Its password is stored as a bcrypt hash.");
}

createAdmin().catch((error) => {
  console.error("Could not create admin:", error.message);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});

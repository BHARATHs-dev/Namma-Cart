const mongoose = require("mongoose");

async function connectDatabase() {
  const { MONGODB_URI: uri } = process.env;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to backend/.env.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

module.exports = connectDatabase;

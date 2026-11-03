const mongoose = require("mongoose");

let isConnected = false;

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to backend/.env.");
  }

  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    isConnected = conn.connections[0].readyState === 1;

    console.log(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB connection disconnected");
      isConnected = false;
    });

    // Ensure products have string category values
    try {
      const db = mongoose.connection.db;
      const productsWithOidCat = await db
        .collection("products")
        .find({ category: { $type: "objectId" } })
        .toArray();

      if (productsWithOidCat.length > 0) {
        const cats = await db.collection("categories").find({}).toArray();
        const catMap = {};
        for (const c of cats) {
          catMap[c._id.toString()] = c.name;
        }
        for (const p of productsWithOidCat) {
          const catName = catMap[p.category.toString()] || "Handicrafts";
          await db
            .collection("products")
            .updateOne({ _id: p._id }, { $set: { category: catName } });
        }
        console.log(`Synced ${productsWithOidCat.length} product category references to string format.`);
      }
    } catch (_migrationErr) {
      // Non-blocking
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error;
  }
}

function getDatabaseStatus() {
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const state = mongoose.connection.readyState;
  return {
    status: stateMap[state] || "unknown",
    readyState: state,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

module.exports = {
  connectDatabase,
  getDatabaseStatus,
};

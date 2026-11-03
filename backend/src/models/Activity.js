const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for activity log"],
    },
    activityType: {
      type: String,
      required: [true, "Activity type is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;


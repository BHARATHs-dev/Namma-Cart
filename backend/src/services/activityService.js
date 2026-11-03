const Activity = require("../models/Activity");

/**
 * Service to record user activities
 */
async function logActivity(userId, activityType, description, metadata = {}) {
  try {
    if (!userId) return null;
    return await Activity.create({
      user: userId,
      activityType,
      description,
      metadata,
    });
  } catch (error) {
    // Non-blocking error for activity logging
    console.error("Failed to log activity:", error.message);
    return null;
  }
}

async function getUserActivities(userId, limit = 20) {
  return Activity.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(Number(limit));
}

module.exports = {
  logActivity,
  getUserActivities,
};


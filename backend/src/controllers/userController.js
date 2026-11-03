const authService = require("../services/authService");
const { successResponse } = require("../middleware/validation");

async function getProfile(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user._id);
    return successResponse(res, 200, "User profile fetched successfully", { user });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateUserProfile(req.user._id, req.body);
    return successResponse(res, 200, "Profile updated successfully", { user });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    return successResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
}

async function getOrders(req, res, next) {
  try {
    const orders = await authService.getUserOrders(req.user._id);
    return successResponse(res, 200, "User orders fetched successfully", { orders });
  } catch (error) {
    next(error);
  }
}

async function getActivities(req, res, next) {
  try {
    const activities = await authService.getUserActivities(req.user._id, req.query.limit || 20);
    return successResponse(res, 200, "User activities fetched successfully", { activities });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getOrders,
  getActivities,
};

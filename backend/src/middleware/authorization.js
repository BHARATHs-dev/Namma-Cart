const { errorResponse } = require("./validation");

/**
 * Role-based authorization middleware
 * @param  {...string} roles Allowed roles ('CUSTOMER', 'SELLER', 'ADMIN')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Authentication required.");
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required role: [${roles.join(", ")}], but your role is ${req.user.role}.`
      );
    }

    next();
  };
}

/**
 * Verifies that a seller has an APPROVED status before creating/managing products
 */
function requireApprovedSeller(req, res, next) {
  if (!req.user) {
    return errorResponse(res, 401, "Authentication required.");
  }

  // Admins bypass seller approval
  if (req.user.role === "ADMIN") {
    return next();
  }

  if (req.user.role !== "SELLER") {
    return errorResponse(res, 403, "Access denied. Only registered sellers can perform this action.");
  }

  const approvalStatus = req.user.sellerDetails?.approvalStatus;
  if (approvalStatus !== "APPROVED") {
    return errorResponse(
      res,
      403,
      `Your seller account is currently '${approvalStatus || "PENDING"}'. You must be approved by an administrator before managing products.`
    );
  }

  next();
}

module.exports = {
  authorize,
  requireApprovedSeller,
};

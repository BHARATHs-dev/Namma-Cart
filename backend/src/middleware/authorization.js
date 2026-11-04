const { errorResponse } = require("./validation");

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return errorResponse(res, 401, "Please log in to continue.");
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, "You do not have permission to do this.");
    }
    next();
  };
}

module.exports = { authorize };

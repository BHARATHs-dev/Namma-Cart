const { validationResult } = require("express-validator");

/**
 * Standard uniform success response
 */
function successResponse(res, statusCode = 200, message = "Success", data = null, pagination = null) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (pagination !== null && pagination !== undefined) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Standard uniform error response
 */
function errorResponse(res, statusCode = 500, message = "Internal Server Error", errors = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  });
}

/**
 * Executes express-validator rules and formats errors if any occur
 */
function validateRequest(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return errorResponse(res, 400, "Validation failed", formattedErrors);
  };
}

module.exports = {
  validateRequest,
  successResponse,
  errorResponse,
};

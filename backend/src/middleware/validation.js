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

module.exports = {
  successResponse,
  errorResponse,
};

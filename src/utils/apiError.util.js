/**
 * Custom API Error class for handling API-specific errors
 */
class ApiError extends Error {
  /**
   * Create a new API Error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Array} [errors] - Additional error details
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "ApiError";
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message || "Bad request", errors);
  }

  static unauthorized(message, errors = []) {
    return new ApiError(401, message || "Unauthorized access", errors);
  }

  static forbidden(message, errors = []) {
    return new ApiError(403, message || "Forbidden access", errors);
  }

  static notFound(message, errors = []) {
    return new ApiError(404, message || "Resource not found", errors);
  }

  static conflict(message, errors = []) {
    return new ApiError(409, message || "Resource conflict", errors);
  }

  static validationError(message, errors = []) {
    return new ApiError(422, message || "Validation failed", errors);
  }

  static internal(message, errors = []) {
    return new ApiError(500, message || "Internal server error", errors);
  }

  static fromJoiError(joiError) {
    const errors = joiError.details.map((detail) => ({
      field: detail.path[0],
      message: detail.message,
    }));

    return ApiError.validationError("Validation failed", errors);
  }
}

module.exports = ApiError;

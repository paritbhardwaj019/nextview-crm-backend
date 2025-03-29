class ApiError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(message || "Bad request", 400, errors);
  }

  static unauthorized(message, errors = []) {
    return new ApiError(message || "Unauthorized access", 401, errors);
  }

  static forbidden(message, errors = []) {
    return new ApiError(message || "Forbidden access", 403, errors);
  }

  static notFound(message, errors = []) {
    return new ApiError(message || "Resource not found", 404, errors);
  }

  static conflict(message, errors = []) {
    return new ApiError(message || "Resource conflict", 409, errors);
  }

  static validationError(message, errors = []) {
    return new ApiError(message || "Validation failed", 422, errors);
  }

  static internal(message, errors = []) {
    return new ApiError(message || "Internal server error", 500, errors);
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

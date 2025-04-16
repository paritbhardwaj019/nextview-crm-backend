const ApiError = require("./apiError.util");

/**
 * Handle errors in a consistent way across the application
 * @param {Error} error - The error object
 * @param {Object} [res] - Express response object (optional)
 * @returns {Object} Error response object
 */
const handleError = (error, res) => {
  console.error("Error:", error);

  // If it's already an ApiError, use its status and message
  if (error instanceof ApiError) {
    if (res) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
      });
    }
    return {
      success: false,
      message: error.message,
      errors: error.errors,
    };
  }

  // For mongoose validation errors
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));

    if (res) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
    return {
      success: false,
      message: "Validation Error",
      errors,
    };
  }

  // For mongoose cast errors (invalid ID format)
  if (error.name === "CastError") {
    if (res) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }
    return {
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
    };
  }

  // For duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    if (res) {
      return res.status(400).json({
        success: false,
        message: `Duplicate value for ${field}`,
      });
    }
    return {
      success: false,
      message: `Duplicate value for ${field}`,
    };
  }

  // For JWT errors
  if (error.name === "JsonWebTokenError") {
    if (res) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    return {
      success: false,
      message: "Invalid token",
    };
  }

  // For JWT expiration
  if (error.name === "TokenExpiredError") {
    if (res) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return {
      success: false,
      message: "Token expired",
    };
  }

  // For any other errors
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  if (res) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
  return {
    success: false,
    message,
  };
};

module.exports = {
  handleError,
};

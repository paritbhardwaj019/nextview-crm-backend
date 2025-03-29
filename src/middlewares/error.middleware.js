const ApiError = require("../utils/apiError.util");
const config = require("../config/config");

const errorMiddleware = (err, req, res, next) => {
  console.error("Error:", err);

  let statusCode = 500;
  let message = "Internal server error";
  let errors = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate field value entered";
    const field = Object.keys(err.keyValue)[0];
    errors = [{ field, message: `${field} already exists` }];
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  const response = {
    status: "error",
    message,
    ...(errors.length > 0 && { errors }),
  };

  if (config.app.env === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;

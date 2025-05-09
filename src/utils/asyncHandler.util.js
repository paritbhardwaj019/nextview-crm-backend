const ApiError = require("./apiError.util");

const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof ApiError) {
        const statusCode =
          typeof error.statusCode === "number" ? error.statusCode : 500;
        res.status(statusCode).json({
          status: "error",
          message: error.message,
          errors: error.errors,
        });
      } else {
        console.log(error);
        res.status(500).json({
          status: "error",
          message: "Internal server error",
          ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        });
      }
    }
  };
};

module.exports = asyncHandler;

const ApiError = require("../utils/apiError.util");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      throw ApiError.badRequest("Validation failed", errorMessages);
    }

    next();
  };
};

module.exports = {
  validateRequest,
};

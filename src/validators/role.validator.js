const Joi = require("joi");

const roleSchema = Joi.object({
  name: Joi.string().required().min(2).max(50).messages({
    "string.empty": "Role name is required",
    "string.min": "Role name must be at least 2 characters long",
    "string.max": "Role name cannot exceed 50 characters",
    "any.required": "Role name is required",
  }),

  code: Joi.string()
    .required()
    .min(2)
    .max(30)
    .pattern(/^[A-Z0-9_]+$/)
    .messages({
      "string.empty": "Role code is required",
      "string.min": "Role code must be at least 2 characters long",
      "string.max": "Role code cannot exceed 30 characters",
      "string.pattern.base":
        "Role code can only contain uppercase letters, numbers, and underscores",
      "any.required": "Role code is required",
    }),

  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description cannot exceed 500 characters",
  }),

  permissions: Joi.array().items(Joi.string()),

  isDefault: Joi.boolean().default(false),
});

const rolePermissionsSchema = Joi.object({
  permissions: Joi.array().items(Joi.string()).required().messages({
    "array.base": "Permissions must be an array",
    "any.required": "Permissions are required",
  }),
  allowedTicketTypes: Joi.array()
    .items(
      Joi.string().valid(
        "SERVICE",
        "INSTALLATION",
        "CHARGEABLE",
        "IN_WARRANTY",
        "OUT_OF_WARRANTY",
        "COMPLAINT",
        "DISPATCH"
      )
    )
    .messages({
      "array.base": "Allowed ticket types must be an array",
      "any.only":
        "Invalid ticket type. Must be one of: INSTALLATION, REPAIR, MAINTENANCE, COMPLAINT, DISPATCH, SERVICE, CHARGEABLE",
    }),
});

module.exports = {
  roleSchema,
  rolePermissionsSchema,
};

const Joi = require("joi");
const { ROLES } = require("../config/roles");

/**
 * Schema for creating a new user
 */
const createUserSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  role: Joi.string()
    .valid(
      ROLES.SUPER_ADMIN,
      ROLES.SUPPORT_MANAGER,
      ROLES.ENGINEER,
      ROLES.DISPATCH_MANAGER,
      ROLES.INVENTORY_MANAGER
    )
    .required()
    .messages({
      "string.empty": "Role is required",
      "any.required": "Role is required",
      "any.only":
        "Role must be one of SUPER_ADMIN, SUPPORT_MANAGER, or ENGINEER",
    }),
  password: Joi.string().required().min(8).messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.min": "Password must be at least 8 characters long",
  }),
});

/**
 * Schema for updating an existing user
 */
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
  }),
  isActive: Joi.boolean().messages({
    "boolean.base": "isActive must be a boolean",
  }),
});

/**
 * Schema for updating notification preferences
 */
const updateNotificationPreferencesSchema = Joi.object({
  email: Joi.boolean().required().messages({
    "boolean.base": "Email must be a boolean",
    "any.required": "Email preference is required",
  }),
  whatsapp: Joi.boolean().required().messages({
    "boolean.base": "WhatsApp must be a boolean",
    "any.required": "WhatsApp preference is required",
  }),
  sms: Joi.boolean().required().messages({
    "boolean.base": "SMS must be a boolean",
    "any.required": "SMS preference is required",
  }),
});

/**
 * Schema for resetting user password
 */
const resetPasswordSchema = Joi.object({
  password: Joi.string().required().min(8).messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateNotificationPreferencesSchema,
  resetPasswordSchema,
};

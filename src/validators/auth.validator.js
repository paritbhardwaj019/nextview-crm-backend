const Joi = require("joi");

/**
 * Validation schema for user login
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password cannot be empty",
    "any.required": "Password is required",
  }),
  remember: Joi.boolean().default(false),
});

/**
 * Validation schema for seeding initial Super Admin
 */
const seedAdminSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
  name: Joi.string().required().min(2).max(50).messages({
    "string.empty": "Name cannot be empty",
    "any.required": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
  }),
  password: Joi.string().required().min(8).messages({
    "string.empty": "Password cannot be empty",
    "any.required": "Password is required",
    "string.min": "Password must be at least 8 characters long",
  }),
  secretKey: Joi.string().required().messages({
    "string.empty": "Secret key cannot be empty",
    "any.required": "Secret key is required",
  }),
});

/**
 * Validation schema for password reset request
 */
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
  }),
});

/**
 * Validation schema for changing password
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password cannot be empty",
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      "string.empty": "New password cannot be empty",
      "any.required": "New password is required",
      "string.min": "New password must be at least 8 characters long",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.empty": "Confirm password cannot be empty",
      "any.required": "Confirm password is required",
      "any.only": "Passwords do not match",
    }),
});

/**
 * Validation schema for resetting password with token
 */
const resetPasswordWithTokenSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Token cannot be empty",
    "any.required": "Token is required",
  }),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      "string.empty": "Password cannot be empty",
      "any.required": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

module.exports = {
  loginSchema,
  seedAdminSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resetPasswordWithTokenSchema,
};

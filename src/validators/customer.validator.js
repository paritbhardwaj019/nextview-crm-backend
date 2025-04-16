const Joi = require("joi");

/**
 * Validation schema for creating a new customer
 */
const customerSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  address: Joi.string().required().max(200).messages({
    "string.empty": "Address is required",
    "string.max": "Address cannot exceed 200 characters",
    "any.required": "Address is required",
  }),
  state: Joi.string().required().max(50).messages({
    "string.empty": "State is required",
    "string.max": "State cannot exceed 50 characters",
    "any.required": "State is required",
  }),
  city: Joi.string().required().max(50).messages({
    "string.empty": "City is required",
    "string.max": "City cannot exceed 50 characters",
    "any.required": "City is required",
  }),
  village: Joi.string().allow("").max(50).messages({
    "string.max": "Village cannot exceed 50 characters",
  }),
  pincode: Joi.string()
    .required()
    .pattern(/^\d{6}$/)
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be a 6-digit number",
      "any.required": "Pincode is required",
    }),
  mobile: Joi.string()
    .required()
    .pattern(/^\d{10}$/)
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Mobile number must be a 10-digit number",
      "any.required": "Mobile number is required",
    }),
  email: Joi.string().allow("").email().messages({
    "string.email": "Please provide a valid email address",
  }),
  isActive: Joi.boolean().default(true),
  source: Joi.string().valid("manual", "imported").default("manual"),
});

/**
 * Validation schema for updating an existing customer
 */
const customerUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
  }),
  address: Joi.string().max(200).messages({
    "string.max": "Address cannot exceed 200 characters",
  }),
  state: Joi.string().max(50).messages({
    "string.max": "State cannot exceed 50 characters",
  }),
  city: Joi.string().max(50).messages({
    "string.max": "City cannot exceed 50 characters",
  }),
  village: Joi.string().allow("").max(50).messages({
    "string.max": "Village cannot exceed 50 characters",
  }),
  pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .messages({
      "string.pattern.base": "Pincode must be a 6-digit number",
    }),
  mobile: Joi.string()
    .pattern(/^\d{10}$/)
    .messages({
      "string.pattern.base": "Mobile number must be a 10-digit number",
    }),
  email: Joi.string().allow("").email().messages({
    "string.email": "Please provide a valid email address",
  }),
  isActive: Joi.boolean(),
  source: Joi.string().valid("manual", "imported"),
});

module.exports = {
  customerSchema,
  customerUpdateSchema,
};

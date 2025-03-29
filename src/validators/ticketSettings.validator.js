const Joi = require("joi");
const { ROLES } = require("../config/roles");

/**
 * Schema for updating ticket settings
 */
const updateSettingsSchema = Joi.object({
  autoApproval: Joi.boolean().messages({
    "boolean.base": "Auto-approval must be a boolean",
  }),
  autoApprovalRoles: Joi.array()
    .items(
      Joi.string().valid(
        ROLES.SUPER_ADMIN,
        ROLES.SUPPORT_MANAGER,
        ROLES.ENGINEER
      )
    )
    .messages({
      "array.base": "Auto-approval roles must be an array",
      "any.only": `Role must be one of: ${Object.values(ROLES).join(", ")}`,
    }),
  defaultAssignToSupportManager: Joi.boolean().messages({
    "boolean.base": "Default assign to support manager must be a boolean",
  }),
  defaultDueDateDays: Joi.number().integer().min(1).max(90).messages({
    "number.base": "Default due date days must be a number",
    "number.integer": "Default due date days must be an integer",
    "number.min": "Default due date days must be at least 1",
    "number.max": "Default due date days cannot exceed 90",
  }),
  priorityDueDates: Joi.object({
    LOW: Joi.number().integer().min(1).max(90),
    MEDIUM: Joi.number().integer().min(1).max(90),
    HIGH: Joi.number().integer().min(1).max(90),
    CRITICAL: Joi.number().integer().min(1).max(90),
  }).messages({
    "object.base": "Priority due dates must be an object",
  }),
  notifyOnStatusChange: Joi.boolean().messages({
    "boolean.base": "Notify on status change must be a boolean",
  }),
  allowReopenClosedTickets: Joi.boolean().messages({
    "boolean.base": "Allow reopen closed tickets must be a boolean",
  }),
  reopenWindowDays: Joi.number().integer().min(1).max(365).messages({
    "number.base": "Reopen window days must be a number",
    "number.integer": "Reopen window days must be an integer",
    "number.min": "Reopen window days must be at least 1",
    "number.max": "Reopen window days cannot exceed 365",
  }),
});

/**
 * Schema for auto-approval settings
 */
const autoApprovalSchema = Joi.object({
  enabled: Joi.boolean().required().messages({
    "boolean.base": "Enabled must be a boolean",
    "any.required": "Enabled field is required",
  }),
  roles: Joi.array()
    .items(
      Joi.string().valid(
        ROLES.SUPER_ADMIN,
        ROLES.SUPPORT_MANAGER,
        ROLES.ENGINEER
      )
    )
    .messages({
      "array.base": "Roles must be an array",
      "any.only": `Role must be one of: ${Object.values(ROLES).join(", ")}`,
    }),
});

/**
 * Schema for due dates configuration
 */
const dueDatesConfigSchema = Joi.object({
  defaultDueDateDays: Joi.number().integer().min(1).max(90).messages({
    "number.base": "Default due date days must be a number",
    "number.integer": "Default due date days must be an integer",
    "number.min": "Default due date days must be at least 1",
    "number.max": "Default due date days cannot exceed 90",
  }),
  priorityDueDates: Joi.object({
    LOW: Joi.number().integer().min(1).max(90).messages({
      "number.base": "LOW priority due date days must be a number",
      "number.integer": "LOW priority due date days must be an integer",
      "number.min": "LOW priority due date days must be at least 1",
      "number.max": "LOW priority due date days cannot exceed 90",
    }),
    MEDIUM: Joi.number().integer().min(1).max(90).messages({
      "number.base": "MEDIUM priority due date days must be a number",
      "number.integer": "MEDIUM priority due date days must be an integer",
      "number.min": "MEDIUM priority due date days must be at least 1",
      "number.max": "MEDIUM priority due date days cannot exceed 90",
    }),
    HIGH: Joi.number().integer().min(1).max(90).messages({
      "number.base": "HIGH priority due date days must be a number",
      "number.integer": "HIGH priority due date days must be an integer",
      "number.min": "HIGH priority due date days must be at least 1",
      "number.max": "HIGH priority due date days cannot exceed 90",
    }),
    CRITICAL: Joi.number().integer().min(1).max(90).messages({
      "number.base": "CRITICAL priority due date days must be a number",
      "number.integer": "CRITICAL priority due date days must be an integer",
      "number.min": "CRITICAL priority due date days must be at least 1",
      "number.max": "CRITICAL priority due date days cannot exceed 90",
    }),
  }).messages({
    "object.base": "Priority due dates must be an object",
  }),
});

module.exports = {
  updateSettingsSchema,
  autoApprovalSchema,
  dueDatesConfigSchema,
};

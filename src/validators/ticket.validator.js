const Joi = require("joi");

/**
 * Schema for creating a new ticket
 */
const createTicketSchema = Joi.object({
  title: Joi.string().required().min(5).max(100).messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 5 characters long",
    "string.max": "Title cannot exceed 100 characters",
    "any.required": "Title is required",
  }),
  description: Joi.string().required().min(10).messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 10 characters long",
    "any.required": "Description is required",
  }),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "CRITICAL")
    .default("MEDIUM")
    .messages({
      "any.only": "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL",
    }),
  category: Joi.string()
    .valid("HARDWARE", "SOFTWARE", "NETWORK", "ACCOUNT", "OTHER")
    .default("OTHER")
    .messages({
      "any.only":
        "Category must be one of: HARDWARE, SOFTWARE, NETWORK, ACCOUNT, OTHER",
    }),
  serialNumber: Joi.string().messages({
    "string.empty": "Serial Number is required",
  }),
  dueDate: Joi.date().iso().min("now").allow(null).messages({
    "date.base": "Due date must be a valid date",
    "date.min": "Due date cannot be in the past",
  }),
  photos: Joi.array().items(
    Joi.object({
      url: Joi.string().required().uri().messages({
        "string.empty": "Photo URL is required",
        "string.uri": "Photo URL must be a valid URL",
      }),
      caption: Joi.string().max(200).allow("").messages({
        "string.max": "Caption cannot exceed 200 characters",
      }),
    })
  ),
  attachments: Joi.array().items(
    Joi.object({
      url: Joi.string().required().uri().messages({
        "string.empty": "Attachment URL is required",
        "string.uri": "Attachment URL must be a valid URL",
      }),
      filename: Joi.string().required().messages({
        "string.empty": "Filename is required",
      }),
      mimeType: Joi.string().messages({
        "string.empty": "MIME type cannot be empty",
      }),
      size: Joi.number().integer().positive().messages({
        "number.base": "Size must be a number",
        "number.integer": "Size must be an integer",
        "number.positive": "Size must be positive",
      }),
    })
  ),
}).unknown(true); // Allow unknown fields

/**
 * Schema for updating an existing ticket
 */
const updateTicketSchema = Joi.object({
  title: Joi.string().min(5).max(100).messages({
    "string.min": "Title must be at least 5 characters long",
    "string.max": "Title cannot exceed 100 characters",
  }),
  description: Joi.string().min(10).messages({
    "string.min": "Description must be at least 10 characters long",
  }),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "CRITICAL").messages({
    "any.only": "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL",
  }),
  category: Joi.string()
    .valid("HARDWARE", "SOFTWARE", "NETWORK", "ACCOUNT", "OTHER")
    .messages({
      "any.only":
        "Category must be one of: HARDWARE, SOFTWARE, NETWORK, ACCOUNT, OTHER",
    }),
  serialNumber: Joi.string().messages({
    "string.empty": "Serial Number cannot be empty",
  }),
  status: Joi.string()
    .valid(
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "PENDING_APPROVAL",
      "RESOLVED",
      "CLOSED",
      "REOPENED"
    )
    .messages({
      "any.only":
        "Status must be one of: OPEN, ASSIGNED, IN_PROGRESS, PENDING_APPROVAL, RESOLVED, CLOSED, REOPENED",
    }),
  dueDate: Joi.date().iso().allow(null).messages({
    "date.base": "Due date must be a valid date",
  }),
}).unknown(true); // Allow unknown fields

/**
 * Schema for assigning a ticket
 */
const assignTicketSchema = Joi.object({
  assignToUserId: Joi.string().required().messages({
    "string.empty": "User ID to assign the ticket to is required",
    "any.required": "User ID to assign the ticket to is required",
  }),
  notes: Joi.string().allow("", null),
}).unknown(true); // Allow unknown fields

/**
 * Schema for adding comments
 */
const commentSchema = Joi.object({
  comment: Joi.string().required().min(1).max(2000).messages({
    "string.empty": "Comment text is required",
    "string.min": "Comment must not be empty",
    "string.max": "Comment cannot exceed 2000 characters",
    "any.required": "Comment text is required",
  }),
  isInternal: Joi.boolean().default(false),
  attachments: Joi.array().items(
    Joi.object({
      url: Joi.string().required().uri().messages({
        "string.empty": "Attachment URL is required",
        "string.uri": "Attachment URL must be a valid URL",
      }),
      filename: Joi.string().required().messages({
        "string.empty": "Filename is required",
      }),
    })
  ),
}).unknown(true); // Allow unknown fields

/**
 * Schema for adding attachments
 */
const attachmentsSchema = Joi.object({
  attachments: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required().uri().messages({
          "string.empty": "Attachment URL is required",
          "string.uri": "Attachment URL must be a valid URL",
        }),
        filename: Joi.string().required().messages({
          "string.empty": "Filename is required",
        }),
        mimeType: Joi.string(),
        size: Joi.number().integer().positive(),
      }).unknown(true) // Allow unknown fields in each attachment object
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attachment is required",
      "any.required": "Attachments are required",
    }),
}).unknown(true); // Allow unknown fields

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  commentSchema,
  attachmentsSchema,
};

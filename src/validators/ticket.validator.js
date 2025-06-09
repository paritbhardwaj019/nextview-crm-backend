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
  description: Joi.string().min(10).allow(null, "").messages({
    "string.min": "Description must be at least 10 characters long if provided",
  }),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "CRITICAL")
    .default("MEDIUM")
    .messages({
      "any.only": "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL",
    }),
  type: Joi.string()
    .valid(
      "SERVICE",
      "INSTALLATION",
      "CHARGEABLE",
      "IN_WARRANTY",
      "OUT_OF_WARRANTY",
      "COMPLAINT",
      "DISPATCH"
    )
    .default("SERVICE")
    .messages({
      "any.only":
        "Type must be one of: SERVICE, INSTALLATION, CHARGEABLE, IN_WARRANTY, OUT_OF_WARRANTY, COMPLAINT, DISPATCH",
    }),
  category: Joi.string()
    .valid(
      "HARDWARE",
      "MOTHERBOARD",
      "REMOTE",
      "PANEL",
      "SOFTWARE",
      "TROUBLESHOOT",
      "SPEAKER",
      "SIGNAGE",
      "OTHER"
    )
    .default("OTHER")
    .messages({
      "any.only":
        "Category must be one of: HARDWARE, MOTHERBOARD, REMOTE, PANEL, SOFTWARE, TROUBLESHOOT, SPEAKER, SIGNAGE, OTHER",
    }),
  itemId: Joi.string().allow(null, ""),
  serialNumber: Joi.string().when("itemId", {
    is: Joi.exist().not(null, ""),
    then: Joi.string().required().messages({
      "string.empty": "Serial Number is required when an item is selected",
      "any.required": "Serial Number is required when an item is selected",
    }),
    otherwise: Joi.string().allow(null, ""),
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
  problems: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .messages({
      "string.pattern.base": "Each problem must be a valid ObjectId",
    })
    .default([]),
}).unknown(true); // Allow unknown fields

/**
 * Schema for updating an existing ticket
 */
const updateTicketSchema = Joi.object({
  title: Joi.string().min(5).max(100).messages({
    "string.min": "Title must be at least 5 characters long",
    "string.max": "Title cannot exceed 100 characters",
  }),
  description: Joi.string().min(10).allow(null, "").messages({
    "string.min": "Description must be at least 10 characters long if provided",
  }),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "CRITICAL").messages({
    "any.only": "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL",
  }),
  type: Joi.string()
    .valid(
      "SERVICE",
      "INSTALLATION",
      "CHARGEABLE",
      "IN_WARRANTY",
      "OUT_OF_WARRANTY",
      "COMPLAINT",
      "DISPATCH"
    )
    .messages({
      "any.only":
        "Type must be one of: SERVICE, INSTALLATION, CHARGEABLE, IN_WARRANTY, OUT_OF_WARRANTY, COMPLAINT, DISPATCH",
    }),
  category: Joi.string()
    .valid(
      "HARDWARE",
      "MOTHERBOARD",
      "REMOTE",
      "PANEL",
      "SOFTWARE",
      "TROUBLESHOOT",
      "SPEAKER",
      "SIGNAGE",
      "OTHER"
    )
    .messages({
      "any.only":
        "Category must be one of: HARDWARE, MOTHERBOARD, REMOTE, PANEL, SOFTWARE, TROUBLESHOOT, SPEAKER, SIGNAGE, OTHER",
    }),
  itemId: Joi.string().allow(null, ""),
  serialNumber: Joi.string().when("itemId", {
    is: Joi.exist().not(null, ""),
    then: Joi.string().required().messages({
      "string.empty": "Serial Number is required when an item is selected",
      "any.required": "Serial Number is required when an item is selected",
    }),
    otherwise: Joi.string().allow(null, ""),
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
  attachments: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().messages({
        "string.uri": "Attachment URL must be a valid URL",
      }),
      filename: Joi.string(),
      mimeType: Joi.string(),
      size: Joi.number().integer().positive(),
    })
  ),
  problems: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .messages({
      "string.pattern.base": "Each problem must be a valid ObjectId",
    }),
}).unknown(true); // Allow unknown fields

/**
 * Schema for assigning a ticket
 */
const assignTicketSchema = Joi.object({
  assignToUserId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "User ID to assign the ticket to is required",
      "string.pattern.base": "Invalid user ID format",
      "any.required": "User ID to assign the ticket to is required",
    }),
  notes: Joi.string().max(500).allow("", null).messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
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

/**
 * Function to format file uploads from Multer into the structure expected by the service
 * @param {Object} req - Express request object
 * @param {Array|File} files - Uploaded files from Multer
 * @param {String} type - Type of file ('photo', 'document')
 * @returns {Array} - Formatted file objects
 */
const formatFileUploads = (req, files, type = "attachment") => {
  if (!files) return [];

  // If files is an array (multiple files)
  if (Array.isArray(files)) {
    return files.map((file) => ({
      url: file.path,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    }));
  }

  // If files is a single file object
  return [
    {
      url: files.path,
      filename: files.originalname,
      mimeType: files.mimetype,
      size: files.size,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    },
  ];
};

/**
 * Middleware to process uploaded files and add them to the request body
 * @param {String} fieldName - Field name to add the formatted files to in the request body
 * @returns {Function} - Express middleware
 */
const processFileUploads = (fieldName = "attachments") => {
  return (req, res, next) => {
    if (!req.file && !req.files) return next();

    const files = req.file || req.files;
    const formattedFiles = formatFileUploads(req, files);

    if (!req.body[fieldName]) {
      req.body[fieldName] = formattedFiles;
    } else if (Array.isArray(req.body[fieldName])) {
      // If the field already exists as array, append to it
      req.body[fieldName] = [...req.body[fieldName], ...formattedFiles];
    } else {
      // If the field exists but is not an array, convert to array and append
      req.body[fieldName] = [req.body[fieldName], ...formattedFiles];
    }

    next();
  };
};

/**
 * Schema for inventory transaction
 */
const inventoryTransactionSchema = Joi.object({
  type: Joi.string().valid("INWARD", "OUTWARD").required().messages({
    "any.only": "Transaction type must be either INWARD or OUTWARD",
    "any.required": "Transaction type is required",
  }),
  condition: Joi.string()
    .valid("NEW", "REPARABLE", "REPAIRED")
    .required()
    .messages({
      "any.only": "Condition must be one of: NEW, REPARABLE, REPAIRED",
      "any.required": "Condition is required",
    }),
  quantity: Joi.number().integer().positive().required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.positive": "Quantity must be positive",
    "any.required": "Quantity is required",
  }),
  ticketId: Joi.string().when("type", {
    is: "OUTWARD",
    then: Joi.string().required().messages({
      "string.empty": "Ticket ID is required for outward transactions",
      "any.required": "Ticket ID is required for outward transactions",
    }),
    otherwise: Joi.string().allow(null, ""),
  }),
  notes: Joi.string().allow("", null),
  docketNumber: Joi.string().allow("", null),
}).unknown(true);

/**
 * Schema for deleting a ticket
 */
const deleteTicketSchema = Joi.object({
  reason: Joi.string().required().min(10).max(500).messages({
    "string.empty": "Reason for deletion is required",
    "string.min": "Reason must be at least 10 characters long",
    "string.max": "Reason cannot exceed 500 characters",
    "any.required": "Reason for deletion is required",
  }),
}).unknown(true);

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  commentSchema,
  attachmentsSchema,
  formatFileUploads,
  processFileUploads,
  inventoryTransactionSchema,
  deleteTicketSchema,
};

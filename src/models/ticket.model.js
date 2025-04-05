const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters long"],
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    category: {
      type: String,
      enum: ["HARDWARE", "SOFTWARE", "NETWORK", "ACCOUNT", "OTHER"],
      default: "OTHER",
    },
    status: {
      type: String,
      enum: [
        "OPEN",
        "ASSIGNED",
        "IN_PROGRESS",
        "PENDING_APPROVAL",
        "RESOLVED",
        "CLOSED",
        "REOPENED",
      ],
      default: "OPEN",
    },
    // Item details
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    itemMetadata: {
      type: Map,
      of: String,
      default: {},
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      validate: {
        validator: async function (value) {
          const Customer = mongoose.model("Customer");
          const customer = await Customer.findById(value);
          return customer && customer.isActive;
        },
        message: "Selected customer is invalid or inactive",
      },
    },
    // Original ticket fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: {
      type: Date,
    },
    // Track assignment history
    assignmentHistory: [
      {
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    closedAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    photos: [
      {
        url: {
          type: String,
          required: true,
        },
        caption: {
          type: String,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        mimeType: {
          type: String,
        },
        size: {
          type: Number,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        comment: {
          type: String,
          required: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isInternal: {
          type: Boolean,
          default: false,
        },
        attachments: [
          {
            url: {
              type: String,
              required: true,
            },
            filename: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Generate ticket IDs automatically
ticketSchema.pre("save", async function (next) {
  // Only generate a ticket ID if it doesn't exist yet
  if (!this.ticketId) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}${month}${day}`;

      // Find the latest ticket to generate a sequential number
      const latestTicket = await this.constructor
        .findOne({ ticketId: { $regex: `TKT${dateString}` } })
        .sort({ ticketId: -1 });

      let sequenceNumber = 1;
      if (latestTicket) {
        // Extract the numeric part at the end of the ticketId
        const match = latestTicket.ticketId.match(/TKT\d+(\d{4})/);
        if (match && match[1]) {
          sequenceNumber = parseInt(match[1]) + 1;
        }
      }

      this.ticketId = `TKT${dateString}${String(sequenceNumber).padStart(4, "0")}`;
    } catch (error) {
      return next(error);
    }
  }

  // Validate required attachments
  if (this.attachments && this.attachments.length > 0) {
    for (const attachment of this.attachments) {
      if (!attachment.url) {
        return next(new Error("Attachment URL is required"));
      }
      if (!attachment.filename) {
        return next(new Error("Attachment filename is required"));
      }
    }
  }

  // Validate required customer
  if (!this.customerId) {
    return next(new Error("Customer is required for all tickets"));
  }

  // Set the uploadedBy field for attachments if not set
  if (this.isNew || this.isModified("attachments")) {
    this.attachments.forEach((attachment) => {
      if (!attachment.uploadedBy) {
        attachment.uploadedBy = this.createdBy;
      }
      if (!attachment.uploadedAt) {
        attachment.uploadedAt = new Date();
      }
    });
  }

  // If the status is being changed to RESOLVED, set resolvedBy and resolvedAt
  if (
    this.isModified("status") &&
    this.status === "RESOLVED" &&
    !this.resolvedBy
  ) {
    this.resolvedBy = this.modifiedBy || this.createdBy;
    this.resolvedAt = new Date();
  }

  // If the status is being changed to CLOSED, set closedBy and closedAt
  if (this.isModified("status") && this.status === "CLOSED" && !this.closedBy) {
    this.closedBy = this.modifiedBy || this.createdBy;
    this.closedAt = new Date();
  }

  next();
});

// Post-save hook to update customer ticket count and other related data
ticketSchema.post("save", async function (doc, next) {
  try {
    // Update customer ticket count if this is a new ticket
    if (this.isNew && this.customerId) {
      const Customer = mongoose.model("Customer");
      const customer = await Customer.findById(this.customerId);
      if (customer) {
        // Update ticket count
        customer.ticketCount = (customer.ticketCount || 0) + 1;
        await customer.save();
      }
    }
    next();
  } catch (error) {
    console.error("Error in ticket post-save hook:", error);
    next();
  }
});

// Pre-remove hook for updating customer ticket count when a ticket is deleted
ticketSchema.pre("remove", async function (next) {
  try {
    // Decrement ticket count for the customer
    if (this.customerId) {
      const Customer = mongoose.model("Customer");
      await Customer.findByIdAndUpdate(this.customerId, {
        $inc: { ticketCount: -1 },
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for better performance
ticketSchema.index({ status: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ ticketId: 1 }, { unique: true });
ticketSchema.index({ itemId: 1 });
ticketSchema.index({ serialNumber: 1 });
ticketSchema.index({ customerId: 1 });

// Virtual for calculating age of ticket in days
ticketSchema.virtual("ageInDays").get(function () {
  return Math.ceil(
    (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24)
  );
});

// Virtual for calculating how long the ticket has been assigned
ticketSchema.virtual("timeInCurrentAssignment").get(function () {
  if (!this.assignedAt) return null;
  return Math.ceil(
    (new Date() - new Date(this.assignedAt)) / (1000 * 60 * 60 * 24)
  );
});

// Method to add an attachment to a ticket
ticketSchema.methods.addAttachment = async function (attachment, userId) {
  if (!attachment.url || !attachment.filename) {
    throw new Error("Attachment must have URL and filename");
  }

  const formattedAttachment = {
    ...attachment,
    uploadedBy: userId || this.createdBy,
    uploadedAt: new Date(),
  };

  this.attachments.push(formattedAttachment);
  return this.save();
};

// Method to remove an attachment
ticketSchema.methods.removeAttachment = async function (attachmentId) {
  const index = this.attachments.findIndex(
    (a) => a._id.toString() === attachmentId
  );
  if (index === -1) {
    throw new Error("Attachment not found");
  }

  this.attachments.splice(index, 1);
  return this.save();
};

// Method to extract metadata from item Excel data based on serial number
ticketSchema.methods.extractItemMetadata = async function () {
  if (!this.itemId || !this.serialNumber) return;

  const Item = mongoose.model("Item");
  const item = await Item.findById(this.itemId);

  if (!item || !item.uploadedFile || !item.uploadedFile.serialNumberColumn)
    return;

  const headers = item.uploadedFile.headers;
  const serialNumberIdx = headers.indexOf(item.uploadedFile.serialNumberColumn);

  if (serialNumberIdx === -1) return;

  const matchingRow = item.uploadedFile.data.find(
    (row) =>
      row[serialNumberIdx] &&
      row[serialNumberIdx].toString() === this.serialNumber
  );

  if (!matchingRow) return;

  const metadata = new Map();

  headers.forEach((header, idx) => {
    if (matchingRow[idx] !== undefined && matchingRow[idx] !== null) {
      metadata.set(header, matchingRow[idx].toString());
    }
  });

  this.itemMetadata = metadata;
  return metadata;
};

// Static method to get tickets by customer ID
ticketSchema.statics.getByCustomer = async function (customerId) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("itemId", "name category sku");
};

// Enhanced static method for finding tickets by customer with options
ticketSchema.statics.findByCustomer = async function (
  customerId,
  options = {}
) {
  const defaultOptions = {
    sort: { createdAt: -1 },
    populate: [
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
      { path: "itemId", select: "name category sku" },
    ],
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return this.find({ customerId })
    .sort(mergedOptions.sort)
    .populate(mergedOptions.populate);
};

// Static method to find tickets by search parameters
ticketSchema.statics.findBySearchParams = async function (params) {
  const { serialNumber, ticketId, customerId } = params;

  const query = {};

  if (serialNumber) {
    query.serialNumber = serialNumber;
  }

  if (ticketId) {
    query.ticketId = ticketId;
  }

  if (customerId) {
    query.customerId = customerId;
  }

  return this.find(query)
    .populate("customerId")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
};

// Get ticket counts by status for reporting
ticketSchema.statics.getStatusCounts = async function (filters = {}) {
  return this.aggregate([
    { $match: filters },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

// Get ticket counts by customer for reporting
ticketSchema.statics.getCustomerCounts = async function (limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: "$customerId",
        count: { $sum: 1 },
        openTickets: {
          $sum: {
            $cond: [
              {
                $in: [
                  "$status",
                  [
                    "OPEN",
                    "ASSIGNED",
                    "IN_PROGRESS",
                    "PENDING_APPROVAL",
                    "REOPENED",
                  ],
                ],
              },
              1,
              0,
            ],
          },
        },
        resolvedTickets: {
          $sum: {
            $cond: [{ $eq: ["$status", "RESOLVED"] }, 1, 0],
          },
        },
        closedTickets: {
          $sum: {
            $cond: [{ $eq: ["$status", "CLOSED"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },
    {
      $project: {
        _id: 1,
        count: 1,
        openTickets: 1,
        resolvedTickets: 1,
        closedTickets: 1,
        "customer.name": 1,
        "customer.mobile": 1,
      },
    },
  ]);
};

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(ticketSchema);

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
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
    // Additional metadata from Excel file
    itemMetadata: {
      type: Map,
      of: String,
      default: {},
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

ticketSchema.pre("save", async function (next) {
  if (!this.ticketId) {
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
  }
  next();
});

ticketSchema.index({ status: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ ticketId: 1 }, { unique: true });
ticketSchema.index({ itemId: 1 });
ticketSchema.index({ serialNumber: 1 });

ticketSchema.virtual("ageInDays").get(function () {
  return Math.ceil(
    (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24)
  );
});

ticketSchema.virtual("timeInCurrentAssignment").get(function () {
  if (!this.assignedAt) return null;
  return Math.ceil(
    (new Date() - new Date(this.assignedAt)) / (1000 * 60 * 60 * 24)
  );
});

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

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(ticketSchema);

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    serialNumber: {
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
    // Existing fields...
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
  if (!this.serialNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}${month}${day}`;

    const latestTicket = await this.constructor
      .findOne({ serialNumber: { $regex: `TKT-${dateString}-` } })
      .sort({ serialNumber: -1 });

    let sequenceNumber = 1;
    if (latestTicket) {
      const latestSequence = parseInt(latestTicket.serialNumber.split("-")[2]);
      sequenceNumber = latestSequence + 1;
    }

    this.serialNumber = `TKT-${dateString}-${String(sequenceNumber).padStart(4, "0")}`;
  }
  next();
});

ticketSchema.index({ status: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ serialNumber: 1 }, { unique: true });

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

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(ticketSchema);

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;

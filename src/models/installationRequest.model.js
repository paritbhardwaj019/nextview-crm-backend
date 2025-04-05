const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     InstallationRequest:
 *       type: object
 *       required:
 *         - requestId
 *         - customerId
 *         - productType
 *         - productModel
 *         - serialNumber
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the installation request
 *         requestId:
 *           type: string
 *           description: Unique identifier for the installation request (auto-generated)
 *         customerId:
 *           type: string
 *           description: ID of the customer who requested installation
 *         productType:
 *           type: string
 *           description: Type of product being installed
 *         productModel:
 *           type: string
 *           description: Model number of the product
 *         serialNumber:
 *           type: string
 *           description: Serial number of the product
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: Date of purchase
 *         purchaseLocation:
 *           type: string
 *           description: Where the product was purchased from
 *         preferredDate:
 *           type: string
 *           format: date
 *           description: Customer's preferred installation date
 *         preferredTimeSlot:
 *           type: string
 *           enum: [MORNING, AFTERNOON, EVENING]
 *           description: Preferred time slot for installation
 *         status:
 *           type: string
 *           enum: [PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: Current status of the installation request
 *         scheduledDate:
 *           type: string
 *           format: date
 *           description: Actual scheduled date for installation
 *         scheduledTimeSlot:
 *           type: string
 *           enum: [MORNING, AFTERNOON, EVENING]
 *           description: Scheduled time slot
 *         assignedTo:
 *           type: string
 *           description: User ID of technician assigned to this installation
 *         assignedBy:
 *           type: string
 *           description: User ID who assigned the technician
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           description: When the installation was assigned
 *         notes:
 *           type: string
 *           description: Additional notes or special instructions
 *         completedBy:
 *           type: string
 *           description: User ID who completed the installation
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the installation was completed
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               filename:
 *                 type: string
 *               uploadedBy:
 *                 type: string
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *           description: Photos or documents related to the installation
 *         createdBy:
 *           type: string
 *           description: User ID who created this installation request
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when request was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when request was last updated
 */
const installationRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    productType: {
      type: String,
      required: [true, "Product type is required"],
      trim: true,
    },
    productModel: {
      type: String,
      required: [true, "Product model is required"],
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, "Serial number is required"],
      trim: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchaseLocation: {
      type: String,
      trim: true,
    },
    preferredDate: {
      type: Date,
    },
    preferredTimeSlot: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "EVENING"],
    },
    status: {
      type: String,
      enum: ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTimeSlot: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "EVENING"],
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
    notes: {
      type: String,
      trim: true,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Generate installation request IDs automatically
installationRequestSchema.pre("save", async function (next) {
  // Only generate a request ID if it doesn't exist yet
  if (!this.requestId) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}${month}${day}`;

      // Find the latest installation request to generate a sequential number
      const latestRequest = await this.constructor
        .findOne({ requestId: { $regex: `INST${dateString}` } })
        .sort({ requestId: -1 });

      let sequenceNumber = 1;
      if (latestRequest) {
        // Extract the numeric part at the end of the requestId
        const match = latestRequest.requestId.match(/INST\d+(\d{4})/);
        if (match && match[1]) {
          sequenceNumber = parseInt(match[1]) + 1;
        }
      }

      this.requestId = `INST${dateString}${String(sequenceNumber).padStart(4, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

installationRequestSchema.post("save", function (doc, next) {
  next();
});

installationRequestSchema.index({ requestId: 1 }, { unique: true });
installationRequestSchema.index({ customerId: 1 });
installationRequestSchema.index({ serialNumber: 1 });
installationRequestSchema.index({ status: 1 });
installationRequestSchema.index({ assignedTo: 1 });
installationRequestSchema.index({ createdAt: -1 });

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(installationRequestSchema);

const InstallationRequest = mongoose.model(
  "InstallationRequest",
  installationRequestSchema
);

module.exports = InstallationRequest;

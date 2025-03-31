const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     TicketSettings:
 *       type: object
 *       properties:
 *         autoApproval:
 *           type: boolean
 *           description: Enable auto-approval of tickets when assigned
 *         autoApprovalRoles:
 *           type: array
 *           items:
 *             type: string
 *           description: Roles for which auto-approval is enabled
 *         defaultAssignToSupportManager:
 *           type: boolean
 *           description: Auto-assign new tickets to support managers
 *         defaultDueDateDays:
 *           type: number
 *           description: Default number of days to set due date from creation
 *         priorityDueDates:
 *           type: object
 *           properties:
 *             LOW:
 *               type: number
 *             MEDIUM:
 *               type: number
 *             HIGH:
 *               type: number
 *             CRITICAL:
 *               type: number
 *           description: Default due date days by priority
 *         notifyOnStatusChange:
 *           type: boolean
 *           description: Send notifications on ticket status changes
 *         allowReopenClosedTickets:
 *           type: boolean
 *           description: Allow reopening of closed tickets
 *         reopenWindowDays:
 *           type: number
 *           description: Number of days a closed ticket can be reopened
 *         updatedBy:
 *           type: string
 *           description: User ID who last updated the settings
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When settings were last updated
 */

// Default values for ticket settings
const DEFAULT_PRIORITY_DUE_DATES = {
  LOW: 10,
  MEDIUM: 7,
  HIGH: 3,
  CRITICAL: 1,
};

const ticketSettingsSchema = new mongoose.Schema(
  {
    autoApproval: {
      type: Boolean,
      default: false,
      description: "Enable auto-approval of tickets when assigned",
    },
    autoApprovalRoles: {
      type: [String],
      default: [],
      description: "Roles for which auto-approval is enabled",
    },
    defaultAssignToSupportManager: {
      type: Boolean,
      default: false,
      description: "Auto-assign new tickets to support managers",
    },
    defaultDueDateDays: {
      type: Number,
      default: 7,
      description: "Default number of days to set due date from creation",
    },
    priorityDueDates: {
      type: Object,
      default: () => ({ ...DEFAULT_PRIORITY_DUE_DATES }),
      description: "Default due date days by priority",
    },
    notifyOnStatusChange: {
      type: Boolean,
      default: true,
      description: "Send notifications on ticket status changes",
    },
    allowReopenClosedTickets: {
      type: Boolean,
      default: true,
      description: "Allow reopening of closed tickets",
    },
    reopenWindowDays: {
      type: Number,
      default: 30,
      description: "Number of days a closed ticket can be reopened",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Pre-save middleware to ensure priorityDueDates contains all required fields
ticketSettingsSchema.pre("save", function (next) {
  if (!this.priorityDueDates) {
    this.priorityDueDates = { ...DEFAULT_PRIORITY_DUE_DATES };
  } else {
    // Ensure all priorities exist with default values if missing
    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    for (const priority of priorities) {
      if (this.priorityDueDates[priority] === undefined) {
        this.priorityDueDates[priority] = DEFAULT_PRIORITY_DUE_DATES[priority];
      }
    }
  }
  next();
});

ticketSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const TicketSettings = mongoose.model("TicketSettings", ticketSettingsSchema);

module.exports = TicketSettings;

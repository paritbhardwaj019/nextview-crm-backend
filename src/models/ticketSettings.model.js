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
      default: {
        LOW: 10,
        MEDIUM: 7,
        HIGH: 3,
        CRITICAL: 1,
      },
      // The description should be in JSDoc or as a comment, not in the schema
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

ticketSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const TicketSettings = mongoose.model("TicketSettings", ticketSettingsSchema);

module.exports = TicketSettings;

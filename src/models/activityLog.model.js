const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivityLog:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user performing the activity
 *         action:
 *           type: string
 *           description: Type of activity performed
 *         details:
 *           type: string
 *           description: Additional details about the activity
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the activity occurred
 *         ipAddress:
 *           type: string
 *           description: IP address from which activity was performed
 */
const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
  },
});

activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ action: 1 });

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(activityLogSchema);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = ActivityLog;

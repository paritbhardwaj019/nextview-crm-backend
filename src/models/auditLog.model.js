const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         entityId:
 *           type: string
 *           description: ID of the entity being modified
 *         entityType:
 *           type: string
 *           description: Type of entity (User, Ticket, etc.)
 *         action:
 *           type: string
 *           description: Action performed (CREATE, UPDATE, DELETE)
 *         previousState:
 *           type: object
 *           description: Previous state of the entity
 *         newState:
 *           type: object
 *           description: New state of the entity after changes
 *         performedBy:
 *           type: string
 *           description: ID of user who performed the action
 *         performedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when action was performed
 *         ipAddress:
 *           type: string
 *           description: IP address from which action was performed
 */
const auditLogSchema = new mongoose.Schema({
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed,
  },
  newState: {
    type: mongoose.Schema.Types.Mixed,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  performedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
  },
});

auditLogSchema.index({ entityId: 1, entityType: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ performedAt: -1 });

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(auditLogSchema);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;

const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationPreference:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user these preferences belong to
 *         email:
 *           type: boolean
 *           description: Whether to send email notifications
 *         whatsapp:
 *           type: boolean
 *           description: Whether to send WhatsApp notifications
 *         sms:
 *           type: boolean
 *           description: Whether to send SMS notifications
 *         updatedBy:
 *           type: string
 *           description: ID of user who last updated these preferences
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When preferences were last updated
 */
const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  email: {
    type: Boolean,
    default: true,
  },
  whatsapp: {
    type: Boolean,
    default: false,
  },
  sms: {
    type: Boolean,
    default: false,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

notificationPreferenceSchema.index({ userId: 1 });

const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
);

module.exports = NotificationPreference;

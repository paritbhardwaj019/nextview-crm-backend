const express = require("express");
const TicketSettingsController = require("../controllers/ticketSettings.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validateReq.middleware");
const { ROLES, PERMISSIONS } = require("../config/roles");
const {
  updateSettingsSchema,
  autoApprovalSchema,
  dueDatesConfigSchema,
} = require("../validators/ticketSettings.validator");
const auditMiddleware = require("../middlewares/audit.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/settings/tickets:
 *   get:
 *     summary: Get ticket system settings
 *     description: Retrieve all settings for the ticket system.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_SETTINGS),
  TicketSettingsController.getSettings
);

/**
 * @swagger
 * /api/settings/tickets:
 *   put:
 *     summary: Update ticket system settings
 *     description: Update settings for the ticket system. Super Admins have full access, Support Managers have limited access.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoApproval:
 *                 type: boolean
 *               autoApprovalRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               defaultAssignToSupportManager:
 *                 type: boolean
 *               defaultDueDateDays:
 *                 type: number
 *               priorityDueDates:
 *                 type: object
 *                 properties:
 *                   LOW:
 *                     type: number
 *                   MEDIUM:
 *                     type: number
 *                   HIGH:
 *                     type: number
 *                   CRITICAL:
 *                     type: number
 *               notifyOnStatusChange:
 *                 type: boolean
 *               allowReopenClosedTickets:
 *                 type: boolean
 *               reopenWindowDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  auditMiddleware("TicketSettings"),
  validateRequest(updateSettingsSchema),
  TicketSettingsController.updateSettings
);

/**
 * @swagger
 * /api/settings/tickets/reset:
 *   post:
 *     summary: Reset settings to defaults
 *     description: Reset all ticket system settings to their default values. Super Admin only.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/reset",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.SUPER_ADMIN),
  auditMiddleware("TicketSettings"),
  TicketSettingsController.resetToDefaults
);

/**
 * @swagger
 * /api/settings/tickets/auto-approval:
 *   patch:
 *     summary: Toggle auto-approval setting
 *     description: Enable or disable auto-approval of tickets and specify roles. Super Admin only.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [SUPER_ADMIN, SUPPORT_MANAGER, ENGINEER]
 *     responses:
 *       200:
 *         description: Auto-approval setting updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
  "/auto-approval",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.SUPER_ADMIN),
  auditMiddleware("TicketSettings"),
  validateRequest(autoApprovalSchema),
  TicketSettingsController.toggleAutoApproval
);

/**
 * @swagger
 * /api/settings/tickets/due-dates:
 *   get:
 *     summary: Get due dates configuration
 *     description: Retrieve configuration for default due dates.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Due dates configuration retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/due-dates",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_SETTINGS),
  TicketSettingsController.getDueDatesConfig
);

/**
 * @swagger
 * /api/settings/tickets/due-dates:
 *   put:
 *     summary: Update due dates configuration
 *     description: Update configuration for default due dates. Super Admin and Support Manager.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultDueDateDays:
 *                 type: number
 *               priorityDueDates:
 *                 type: object
 *                 properties:
 *                   LOW:
 *                     type: number
 *                   MEDIUM:
 *                     type: number
 *                   HIGH:
 *                     type: number
 *                   CRITICAL:
 *                     type: number
 *     responses:
 *       200:
 *         description: Due dates configuration updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/due-dates",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  auditMiddleware("TicketSettings"),
  // validateRequest(dueDatesConfigSchema),
  TicketSettingsController.updateDueDatesConfig
);

module.exports = router;

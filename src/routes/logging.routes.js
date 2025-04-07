const express = require("express");
const LoggingController = require("../controllers/logging.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { ROLES, PERMISSIONS } = require("../config/roles");

const router = express.Router();

/**
 * @swagger
 * /api/logs/activity:
 *   get:
 *     summary: Get activity logs
 *     description: Retrieve activity logs with pagination and filtering. Admin only.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: A list of activity logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  "/activity",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ACTIVITY_LOGS),
  LoggingController.getActivityLogs
);

/**
 * @swagger
 * /api/logs/audit:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve audit logs with pagination and filtering. Admin only.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Filter by entity ID
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: performedBy
 *         schema:
 *           type: string
 *         description: Filter by user who performed the action
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: A list of audit logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  "/audit",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  LoggingController.getAuditLogs
);

/**
 * @swagger
 * /api/logs/actions:
 *   get:
 *     summary: Get available log action types
 *     description: Retrieve a list of all available action types for logs
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of action types
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  "/actions",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ACTIVITY_LOGS),
  LoggingController.getLogActions
);

/**
 * @swagger
 * /api/logs/entity-types:
 *   get:
 *     summary: Get available entity types
 *     description: Retrieve a list of all available entity types for audit logs
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of entity types
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  "/entity-types",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  LoggingController.getEntityTypes
);

module.exports = router;

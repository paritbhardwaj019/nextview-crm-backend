const express = require("express");
const UserController = require("../controllers/user.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validateReq.middleware");
const { ROLES, PERMISSIONS } = require("../config/roles");
const {
  createUserSchema,
  updateUserSchema,
  updateNotificationPreferencesSchema,
} = require("../validators/user.validator");
const auditMiddleware = require("../middlewares/audit.middleware");

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users. Accessible by SUPER_ADMIN and SUPPORT_MANAGER.
 *     tags: [Users]
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
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, SUPPORT_MANAGER, ENGINEER]
 *         description: Filter users by role
 *     responses:
 *       200:
 *         description: A list of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.ASSIGN_TICKET
  ),
  UserController.getAllUsers
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user by ID. Accessible by SUPER_ADMIN, SUPPORT_MANAGER, and ENGINEER (self only).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_USER),
  UserController.getUserById
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user. SUPER_ADMIN can create any role, SUPPORT_MANAGER can only create ENGINEER.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, SUPPORT_MANAGER, ENGINEER]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_USER),
  auditMiddleware("User"),
  validateRequest(createUserSchema),
  UserController.createUser
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user details. SUPER_ADMIN can update any user, SUPPORT_MANAGER can only update ENGINEER.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_USER),
  auditMiddleware("User"),
  validateRequest(updateUserSchema),
  UserController.updateUser
);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate user
 *     description: Deactivate a user account. Only accessible by SUPER_ADMIN and SUPPORT_MANAGER.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/deactivate",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_USER),
  auditMiddleware("User"),
  UserController.deactivateUser
);

/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Activate user
 *     description: Activate a user account. Only accessible by SUPER_ADMIN and SUPPORT_MANAGER.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/activate",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_USER),
  auditMiddleware("User"),
  UserController.activateUser
);

/**
 * @swagger
 * /users/{id}/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset a user's password. Accessible by SUPER_ADMIN and SUPPORT_MANAGER.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post(
  "/:id/reset-password",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_USER),
  UserController.resetUserPassword
);

/**
 * @swagger
 * /users/{id}/notification-preferences:
 *   get:
 *     summary: Get user notification preferences
 *     description: Get notification preferences for a user. Users can view their own preferences, admins can view any.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Notification preferences
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get(
  "/:id/notification-preferences",
  AuthMiddleware.authenticate,
  UserController.getNotificationPreferences
);

/**
 * @swagger
 * /users/{id}/notification-preferences:
 *   put:
 *     summary: Update notification preferences
 *     description: Update notification preferences for a user. Users can update their own preferences, admins can update any.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               whatsapp:
 *                 type: boolean
 *               sms:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put(
  "/:id/notification-preferences",
  AuthMiddleware.authenticate,
  auditMiddleware("NotificationPreference"),
  validateRequest(updateNotificationPreferencesSchema),
  UserController.updateNotificationPreferences
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user account. SUPER_ADMIN can delete any user, SUPPORT_MANAGER can only delete ENGINEER.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.DELETE_USER),
  auditMiddleware("User"),
  UserController.deleteUser
);

module.exports = router;

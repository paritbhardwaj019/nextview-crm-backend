const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validateReq.middleware");
const {
  loginSchema,
  seedAdminSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resetPasswordWithTokenSchema,
} = require("../validators/auth.validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *     SeedAdmin:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - password
 *         - secretKey
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email for the Super Admin
 *         name:
 *           type: string
 *           description: Full name of the Super Admin
 *         password:
 *           type: string
 *           format: password
 *           description: Initial password for the Super Admin
 *         secretKey:
 *           type: string
 *           description: Secret key to authorize the seeding operation
 *     ResetPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user requesting password reset
 *     ChangePassword:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: Current password of the user
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password to set
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         total:
 *           type: integer
 *           description: Total number of items
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *         hasNextPage:
 *           type: boolean
 *           description: Whether there is a next page
 *         hasPrevPage:
 *           type: boolean
 *           description: Whether there is a previous page
 *         nextPage:
 *           type: integer
 *           nullable: true
 *           description: Next page number if available
 *         prevPage:
 *           type: integer
 *           nullable: true
 *           description: Previous page number if available
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and return a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: User ID
 *                         email:
 *                           type: string
 *                           description: User email
 *                         name:
 *                           type: string
 *                           description: User name
 *                         role:
 *                           type: string
 *                           enum: [SUPER_ADMIN, SUPPORT_MANAGER, ENGINEER]
 *                           description: User role
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
router.post("/login", validateRequest(loginSchema), AuthController.login);

/**
 * @swagger
 * /auth/seed-admin:
 *   post:
 *     summary: Create initial Super Admin
 *     description: Initialize the system with the first Super Admin user (only works if no Super Admin exists)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeedAdmin'
 *     responses:
 *       201:
 *         description: Super Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Super Admin created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [SUPER_ADMIN]
 *       400:
 *         description: Validation error or Super Admin already exists
 *       403:
 *         description: Invalid secret key
 */
router.post(
  "/seed-admin",
  validateRequest(seedAdminSchema),
  AuthController.seedSuperAdmin
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset link to the user's email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user requesting password reset
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.post(
  "/forgot-password",
  validateRequest(resetPasswordSchema),
  AuthController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Reset user password using the token from email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token received via email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  validateRequest(resetPasswordWithTokenSchema),
  AuthController.resetPassword
);

/**
 * @swagger
 * /auth/verify-reset-token/{token}:
 *   get:
 *     summary: Verify reset token
 *     description: Verify if the password reset token is valid
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token to verify
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify-reset-token/:token", AuthController.verifyResetToken);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change own password
 *     description: Allow authenticated user to change their password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 */
router.post(
  "/change-password",
  AuthMiddleware.authenticate,
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify token and get user info
 *     description: Verify the JWT token and return user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Token verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [SUPER_ADMIN, SUPPORT_MANAGER, ENGINEER]
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.get("/verify", AuthMiddleware.authenticate, AuthController.verifyToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Log out the current user (updates last login time)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.post("/logout", AuthMiddleware.authenticate, AuthController.logout);

module.exports = router;

// src/routes/role.routes.js
const express = require("express");
const RoleController = require("../controllers/role.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { PERMISSIONS } = require("../config/permissions");
const { validateRequest } = require("../middlewares/validateReq.middleware");
const {
  roleSchema,
  rolePermissionsSchema,
} = require("../validators/role.validator");
const auditMiddleware = require("../middlewares/audit.middleware");

const router = express.Router();

// Authenticate all role routes
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve roles with pagination and filtering
 *     tags: [Roles]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default roles
 *     responses:
 *       200:
 *         description: List of roles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", RoleController.getAllRoles);

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve all available permissions with their groups and display names
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All permissions with metadata
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/permissions", RoleController.getAllPermissions);

/**
 * @swagger
 * /api/roles/dropdown:
 *   get:
 *     summary: Get roles for dropdown
 *     description: Get simplified list of roles for dropdown selection
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles for dropdown
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/dropdown", RoleController.getRolesForDropdown);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve details of a specific role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.get("/:id", RoleController.getRoleById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_ROLE),
  auditMiddleware("Role"),
  validateRequest(roleSchema),
  RoleController.createRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role
 *     description: Update role details
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.put(
  "/:id",
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_ROLE),
  auditMiddleware("Role"),
  validateRequest(roleSchema),
  RoleController.updateRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     description: Delete a role (cannot delete default roles)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Default roles cannot be deleted
 *       404:
 *         description: Role not found
 *       409:
 *         description: Conflict - Role is assigned to users
 */
router.delete(
  "/:id",
  AuthMiddleware.requirePermission(PERMISSIONS.DELETE_ROLE),
  auditMiddleware("Role"),
  RoleController.deleteRole
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     summary: Get role permissions
 *     description: Get permissions for a specific role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.get("/:id/permissions", RoleController.getRolePermissions);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     summary: Update role permissions
 *     description: Update permissions for a specific role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Role permissions updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.put(
  "/:id/permissions",
  auditMiddleware("Role"),
  validateRequest(rolePermissionsSchema),
  RoleController.updateRolePermissions
);

module.exports = router;

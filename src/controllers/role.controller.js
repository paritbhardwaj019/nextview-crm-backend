const RoleService = require("../services/role.service");
const { ActivityLogService } = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");

class RoleController {
  /**
   * Get all roles with pagination and filtering
   * @route GET /api/roles
   * @access Private (Super Admin, View Roles permission)
   */
  static getAllRoles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, isDefault } = req.query;

    const query = {};

    if (search) {
      query.search = search;
    }

    if (isDefault !== undefined) {
      query.isDefault = isDefault === "true";
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { name: 1 },
      populate: [
        { path: "createdBy", select: "name email" },
        { path: "updatedBy", select: "name email" },
      ],
    };

    const roles = await RoleService.getAllRoles(query, options);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ROLES_VIEWED",
      details: `Retrieved list of roles`,
      ipAddress: req.ip,
    });

    return ApiResponse.withPagination(
      res,
      "Roles retrieved successfully",
      roles.results,
      roles.pagination
    );
  });

  /**
   * Get role by ID
   * @route GET /api/roles/:id
   * @access Private (Super Admin, View Roles permission)
   */
  static getRoleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const role = await RoleService.getRoleById(id);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ROLE_VIEWED",
      details: `Viewed role: ${role.name} (${role.code})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Role retrieved successfully", role);
  });

  /**
   * Create a new role
   * @route POST /api/roles
   * @access Private (Super Admin, Create Role permission)
   */
  static createRole = asyncHandler(async (req, res) => {
    const roleData = req.body;
    const userId = req.user.id;

    const role = await RoleService.createRole(roleData, userId);

    await ActivityLogService.logActivity({
      userId,
      action: "ROLE_CREATED",
      details: `Created new role: ${role.name} (${role.code})`,
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, "Role created successfully", role);
  });

  /**
   * Update role
   * @route PUT /api/roles/:id
   * @access Private (Super Admin, Update Role permission)
   */
  static updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const role = await RoleService.updateRole(id, updateData, userId);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ROLE_UPDATED",
      details: `Updated role: ${role.name} (${role.code})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Role updated successfully", role);
  });

  /**
   * Delete role
   * @route DELETE /api/roles/:id
   * @access Private (Super Admin, Delete Role permission)
   */
  static deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const role = await RoleService.getRoleById(id);
    const roleName = role.name;
    const roleCode = role.code;

    await RoleService.deleteRole(id);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ROLE_DELETED",
      details: `Deleted role: ${roleName} (${roleCode})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Role deleted successfully");
  });

  /**
   * Get all available permissions
   * @route GET /api/roles/permissions
   * @access Private (Super Admin, View Roles permission)
   */
  static getAllPermissions = asyncHandler(async (req, res) => {
    const permissionsData = await RoleService.getAllPermissions();

    return ApiResponse.success(
      res,
      "Permissions retrieved successfully",
      permissionsData
    );
  });

  /**
   * Get roles for dropdown selection
   * @route GET /api/roles/dropdown
   * @access Private (Super Admin, View Roles permission)
   */
  static getRolesForDropdown = asyncHandler(async (req, res) => {
    const roles = await RoleService.getRolesForDropdown();

    return ApiResponse.success(res, "Roles retrieved successfully", roles);
  });

  /**
   * Get permissions for a role
   * @route GET /api/roles/:id/permissions
   * @access Private (Super Admin, View Roles permission)
   */
  static getRolePermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;

    console.log("id", id);

    const permissions = await RoleService.getRolePermissions(id);

    return ApiResponse.success(
      res,
      "Role permissions retrieved successfully",
      permissions
    );
  });

  /**
   * Update permissions for a role
   * @route PUT /api/roles/:id/permissions
   * @access Private (Super Admin, Update Role permission)
   */
  static updateRolePermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissions, allowedTicketTypes } = req.body;
    const userId = req.user.id;

    if (!permissions || !Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions must be an array");
    }

    if (allowedTicketTypes && !Array.isArray(allowedTicketTypes)) {
      throw ApiError.badRequest("Allowed ticket types must be an array");
    }

    const role = await RoleService.updateRolePermissions(
      id,
      permissions,
      allowedTicketTypes,
      userId
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ROLE_PERMISSIONS_UPDATED",
      details: `Updated permissions and allowed ticket types for role: ${role.name} (${role.code})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Role permissions updated successfully",
      role
    );
  });

  /**
   * Initialize default system roles
   * @route POST /api/roles/initialize
   * @access Private (Super Admin only)
   */
  static initializeRoles = asyncHandler(async (req, res) => {
    const result = await RoleService.initializeRoles();

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ROLES_INITIALIZED",
      details: "Default system roles initialized",
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Default roles initialized successfully",
      result
    );
  });
}

module.exports = RoleController;

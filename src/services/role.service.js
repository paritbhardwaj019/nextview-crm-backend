const Role = require("../models/role.model");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError.util");
const { PERMISSIONS, ROLE_PERMISSIONS } = require("../config/permissions");

class RoleService {
  /**
   * Initialize default roles in the system
   * This should be called during system startup
   */
  static async initializeRoles() {
    try {
      await Role.createDefaultRoles();
      return {
        success: true,
        message: "Default roles initialized successfully",
      };
    } catch (error) {
      console.error("Error initializing roles:", error);
      throw error;
    }
  }

  /**
   * Get all roles with pagination and filtering
   */
  static async getAllRoles(query, options) {
    const queryObject = { ...query };

    // Handle search term
    if (query.search) {
      queryObject.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { code: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
      delete queryObject.search;
    }

    return await Role.paginate(queryObject, options);
  }

  /**
   * Get role by ID
   */
  static async getRoleById(id) {
    const role = await Role.findById(id);

    if (!role) {
      throw ApiError.notFound("Role not found");
    }

    return role;
  }

  /**
   * Get role by code
   */
  static async getRoleByCode(code) {
    const role = await Role.findOne({ code: code.toUpperCase() });

    if (!role) {
      throw ApiError.notFound("Role not found");
    }

    return role;
  }

  /**
   * Create a new role
   */
  static async createRole(roleData, userId) {
    const { name, code, permissions } = roleData;

    // Validate code format
    if (!code.match(/^[A-Z0-9_]+$/)) {
      throw ApiError.badRequest(
        "Role code must be uppercase letters, numbers, and underscores only"
      );
    }

    // Check if role with same code already exists
    const existingRole = await Role.findOne({ code: code.toUpperCase() });
    if (existingRole) {
      throw ApiError.conflict(`Role with code ${code} already exists`);
    }

    // Validate permissions exist
    if (permissions && permissions.length > 0) {
      const allPermissions = Object.values(PERMISSIONS);
      const invalidPermissions = permissions.filter(
        (p) => !allPermissions.includes(p)
      );

      if (invalidPermissions.length > 0) {
        throw ApiError.badRequest(
          `Invalid permissions: ${invalidPermissions.join(", ")}`
        );
      }
    }

    // Create new role
    const role = await Role.create({
      ...roleData,
      code: code.toUpperCase(),
      createdBy: userId,
      updatedBy: userId,
    });

    return role;
  }

  /**
   * Update an existing role
   */
  static async updateRole(id, updateData, userId) {
    const role = await this.getRoleById(id);

    // Prevent modification of default roles' code
    if (role.isDefault && updateData.code && updateData.code !== role.code) {
      throw ApiError.forbidden("Cannot change the code of a default role");
    }

    // Validate permissions exist if being updated
    if (updateData.permissions && updateData.permissions.length > 0) {
      const allPermissions = Object.values(PERMISSIONS);
      const invalidPermissions = updateData.permissions.filter(
        (p) => !allPermissions.includes(p)
      );

      if (invalidPermissions.length > 0) {
        throw ApiError.badRequest(
          `Invalid permissions: ${invalidPermissions.join(", ")}`
        );
      }
    }

    // Format code to uppercase if provided
    if (updateData.code) {
      // Validate code format
      if (!updateData.code.match(/^[A-Z0-9_]+$/)) {
        throw ApiError.badRequest(
          "Role code must be uppercase letters, numbers, and underscores only"
        );
      }

      updateData.code = updateData.code.toUpperCase();

      // Check if new code conflicts with existing role
      if (updateData.code !== role.code) {
        const existingRole = await Role.findOne({ code: updateData.code });
        if (existingRole) {
          throw ApiError.conflict(
            `Role with code ${updateData.code} already exists`
          );
        }
      }
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      role[key] = updateData[key];
    });

    role.updatedBy = userId;
    await role.save();

    return role;
  }

  /**
   * Delete a role
   */
  static async deleteRole(id) {
    const role = await this.getRoleById(id);

    // Check if it's a default role
    if (role.isDefault) {
      throw ApiError.forbidden("Cannot delete a default system role");
    }

    // Check if role is in use by any users
    const usersWithRole = await User.countDocuments({ role: role.code });
    if (usersWithRole > 0) {
      throw ApiError.conflict(
        `Cannot delete role as it is assigned to ${usersWithRole} user(s)`
      );
    }

    await role.deleteOne();
    return { success: true };
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions() {
    const {
      PERMISSIONS,
      PERMISSION_GROUPS,
      PERMISSION_NAMES,
    } = require("../config/permissions");

    return {
      permissions: PERMISSIONS,
      groups: PERMISSION_GROUPS,
      names: PERMISSION_NAMES,
    };
  }

  /**
   * Get roles for dropdown selection
   */
  static async getRolesForDropdown() {
    const roles = await Role.find()
      .select("_id name code description")
      .sort({ name: 1 });
    return roles;
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermissions(id) {
    const rolePermissions = await this.getRoleById(id);
    return rolePermissions.permissions;
  }

  /**
   * Update permissions for a role
   */
  static async updateRolePermissions(
    roleId,
    permissions,
    allowedTicketTypes,
    userId
  ) {
    const role = await this.getRoleById(roleId);

    // Validate permissions exist
    const allPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = permissions.filter(
      (p) => !allPermissions.includes(p)
    );

    if (invalidPermissions.length > 0) {
      throw ApiError.badRequest(
        `Invalid permissions: ${invalidPermissions.join(", ")}`
      );
    }

    // Validate ticket types if provided
    if (allowedTicketTypes) {
      const validTicketTypes = [
        "INSTALLATION",
        "REPAIR",
        "MAINTENANCE",
        "COMPLAINT",
        "DISPATCH",
      ];
      const invalidTicketTypes = allowedTicketTypes.filter(
        (type) => !validTicketTypes.includes(type)
      );

      if (invalidTicketTypes.length > 0) {
        throw ApiError.badRequest(
          `Invalid ticket types: ${invalidTicketTypes.join(", ")}`
        );
      }
    }

    role.permissions = permissions;
    if (allowedTicketTypes) {
      role.allowedTicketTypes = allowedTicketTypes;
    }
    role.updatedBy = userId;
    await role.save();

    return role;
  }
}

module.exports = RoleService;

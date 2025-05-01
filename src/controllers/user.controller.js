const UserService = require("../services/user.service");
const { ActivityLogService } = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const { ROLES } = require("../config/roles");
const { sendEmail } = require("../services/notification.service");

class UserController {
  /**
   * Get all users with pagination and filtering
   * Access: SUPER_ADMIN, SUPPORT_MANAGER
   */
  static getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    const userRole = req.user.role;

    const query = {};

    if (role) {
      if (userRole === ROLES.SUPPORT_MANAGER && role !== ROLES.ENGINEER) {
        throw ApiError.forbidden("Support Managers can only view engineers");
      }
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: "-password",
      populate: {
        path: "createdBy",
        select: "name email",
      },
    };

    const users = await UserService.getAllUsers(query, options, userRole);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "USERS_VIEWED",
      details: `Retrieved list of users`,
      ipAddress: req.ip,
    });

    return ApiResponse.withPagination(
      res,
      "Users retrieved successfully",
      users.results,
      users.pagination
    );
  });

  /**
   * Get user by ID
   * Access: SUPER_ADMIN, SUPPORT_MANAGER, self
   */
  static getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const user = await UserService.getUserById(id, userId, userRole);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "USER_VIEWED",
      details: `Viewed user: ${user.name} (${user.email})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "User retrieved successfully", user);
  });

  /**
   * Create a new user
   * Access: SUPER_ADMIN can create any role, SUPPORT_MANAGER can only create ENGINEER
   */
  static createUser = asyncHandler(async (req, res) => {
    const { email, name, role, password } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    const result = await UserService.createUser(
      { email, name, role, password },
      userId,
      userRole
    );

    await ActivityLogService.logActivity({
      userId,
      action: "USER_CREATED",
      details: `Created new user ${result.user.name} (${result.user.email}) with role ${result.user.role}`,
      ipAddress: req.ip,
    });

    await sendEmail({
      to: result.user.email,
      subject: "Welcome to Support Ticket Management System",
      text: `Hello ${result.user.name},\n\nYour account has been created successfully.\n\nEmail: ${result.user.email}\nPassword: ${result.password}\n\nPlease change your password after logging in.\n\nRegards,\nSupport Team`,
    });

    return ApiResponse.created(res, "User created successfully", {
      _id: result.user._id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      isActive: result.user.isActive,
      createdAt: result.user.createdAt,
    });
  });

  /**
   * Update user
   * Access: SUPER_ADMIN can update any user, SUPPORT_MANAGER can only update ENGINEER
   */
  static updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    const user = await UserService.updateUser(id, updateData, userId, userRole);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "USER_UPDATED",
      details: `Updated user ${user.name} (${user.email})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "User updated successfully", {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      updatedAt: user.updatedAt,
    });
  });

  /**
   * Deactivate user
   * Access: SUPER_ADMIN, SUPPORT_MANAGER (for ENGINEER only)
   */
  static deactivateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const user = await UserService.changeUserActiveStatus(
      id,
      false,
      userId,
      userRole
    );

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "USER_DEACTIVATED",
      details: `Deactivated user ${user.name} (${user.email})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "User deactivated successfully", {
      _id: user._id,
      email: user.email,
      name: user.name,
      isActive: false,
    });
  });

  /**
   * Activate user
   * Access: SUPER_ADMIN, SUPPORT_MANAGER (for ENGINEER only)
   */
  static activateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const user = await UserService.changeUserActiveStatus(
      id,
      true,
      userId,
      userRole
    );

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "USER_ACTIVATED",
      details: `Activated user ${user.name} (${user.email})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "User activated successfully", {
      _id: user._id,
      email: user.email,
      name: user.name,
      isActive: true,
    });
  });

  /**
   * Reset user password
   * Access: SUPER_ADMIN, SUPPORT_MANAGER (for ENGINEER only)
   */
  static resetUserPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;

    const data = { password: req.body.password };

    const result = await UserService.resetUserPassword(id, userRole, data);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "PASSWORD_RESET",
      details: `Reset password for user ${result.user.name} (${result.user.email})`,
      ipAddress: req.ip,
    });

    await sendEmail({
      to: result.user.email,
      subject: "Your Password Has Been Reset",
      text: `Hello ${result.user.name},\n\nYour password has been reset by an administrator.\n\ Password: ${req.body.password}\n\nPlease change your password after logging in.\n\nRegards,\nSupport Team`,
    });

    return ApiResponse.success(
      res,
      "Password reset successfully. A temporary password has been sent to the user's email."
    );
  });

  /**
   * Get notification preferences
   * Access: SUPER_ADMIN, SUPPORT_MANAGER, self
   */
  static getNotificationPreferences = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const preferences = await UserService.getNotificationPreferences(
      id,
      userId,
      userRole
    );

    return ApiResponse.success(
      res,
      "Notification preferences retrieved successfully",
      preferences
    );
  });

  /**
   * Update notification preferences
   * Access: SUPER_ADMIN, SUPPORT_MANAGER, self
   */
  static updateNotificationPreferences = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const preferences = await UserService.updateNotificationPreferences(
      id,
      req.body,
      userId,
      userRole
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "NOTIFICATION_PREFERENCES_UPDATED",
      details: `Updated notification preferences for user ID: ${id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Notification preferences updated successfully",
      preferences
    );
  });

  /**
   * Delete user
   * Access: SUPER_ADMIN, SUPPORT_MANAGER (for ENGINEER only)
   */
  static deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const user = await UserService.deleteUser(id, userId, userRole);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "USER_DELETED",
      details: `Deleted user ${user.name} (${user.email})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "User deleted successfully", {
      _id: user._id,
      email: user.email,
      name: user.name,
    });
  });
}

module.exports = UserController;

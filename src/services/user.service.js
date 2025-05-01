const User = require("../models/user.model");
const NotificationPreference = require("../models/notificationPreference.model");
const ApiError = require("../utils/apiError.util");
const { ROLES, isRoleAuthorized } = require("../config/roles");

class UserService {
  /**
   * Get all users with pagination and filtering
   * @param {Object} query - Query parameters for filtering users
   * @param {Object} options - Pagination and sorting options
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - Paginated users data
   */
  static async getAllUsers(query, options, requestingUserRole) {
    const queryObject = { ...query };

    if (requestingUserRole === ROLES.SUPPORT_MANAGER) {
      queryObject.role = ROLES.ENGINEER;
    }

    return await User.paginate(queryObject, options);
  }

  /**
   * Get user by ID
   * @param {String} id - User ID
   * @param {String} requestingUserId - ID of the user making the request
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - User data
   */
  static async getUserById(id, requestingUserId, requestingUserRole) {
    const user = await User.findById(id).select("-password").populate({
      path: "createdBy",
      select: "name email",
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (
      requestingUserRole !== ROLES.SUPER_ADMIN &&
      requestingUserRole !== ROLES.SUPPORT_MANAGER &&
      requestingUserId !== id
    ) {
      throw ApiError.forbidden("Insufficient permissions to view this user");
    }

    if (
      requestingUserRole === ROLES.SUPPORT_MANAGER &&
      user.role !== ROLES.ENGINEER &&
      requestingUserId !== id
    ) {
      throw ApiError.forbidden(
        "Support Managers can only view engineers or themselves"
      );
    }

    return user;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data (email, name, role, password)
   * @param {String} createdBy - ID of the user creating the new user
   * @param {String} creatorRole - Role of the user creating the new user
   * @returns {Promise<Object>} - Created user data
   */
  static async createUser(userData, createdBy, creatorRole) {
    const { email, name, role, password } = userData;

    if (creatorRole === ROLES.SUPPORT_MANAGER && role !== ROLES.ENGINEER) {
      throw ApiError.forbidden(
        "Support Managers can only create Engineer accounts"
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict("Email already in use");
    }

    if (!password || password.length < 8) {
      throw ApiError.badRequest("Password must be at least 8 characters long");
    }

    const user = await User.create({
      email,
      name,
      role,
      password,
      createdBy,
    });

    await NotificationPreference.create({
      userId: user._id,
      email: true,
      whatsapp: false,
      sms: false,
      updatedBy: createdBy,
    });

    return {
      user,
      password,
    };
  }

  /**
   * Update user data
   * @param {String} id - User ID
   * @param {Object} updateData - Data to update
   * @param {String} requestingUserId - ID of the user making the request
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - Updated user data
   */
  static async updateUser(
    id,
    updateData,
    requestingUserId,
    requestingUserRole
  ) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (
      requestingUserRole === ROLES.SUPPORT_MANAGER &&
      user.role !== ROLES.ENGINEER
    ) {
      throw ApiError.forbidden(
        "Support Managers can only update Engineer accounts"
      );
    }

    if (
      !isRoleAuthorized(requestingUserRole, user.role) &&
      id !== requestingUserId
    ) {
      throw ApiError.forbidden(
        "You do not have permission to update this user"
      );
    }

    Object.keys(updateData).forEach((key) => {
      user[key] = updateData[key];
    });

    await user.save();

    return user;
  }

  /**
   * Change user's active status
   * @param {String} id - User ID
   * @param {Boolean} isActive - New active status
   * @param {String} requestingUserId - ID of the user making the request
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - Updated user data
   */
  static async changeUserActiveStatus(
    id,
    isActive,
    requestingUserId,
    requestingUserRole
  ) {
    if (!isActive && id === requestingUserId) {
      throw ApiError.badRequest("Cannot deactivate your own account");
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (
      requestingUserRole === ROLES.SUPPORT_MANAGER &&
      user.role !== ROLES.ENGINEER
    ) {
      throw ApiError.forbidden(
        "Support Managers can only modify Engineer account status"
      );
    }

    if (!isRoleAuthorized(requestingUserRole, user.role)) {
      throw ApiError.forbidden(
        "You do not have permission to modify this user"
      );
    }

    user.isActive = isActive;
    await user.save();

    return user;
  }

  /**
   * Reset user password
   * @param {String} id - User ID
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - User data and temporary password
   */
  static async resetUserPassword(id, requestingUserRole, data) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (
      requestingUserRole === ROLES.SUPPORT_MANAGER &&
      user.role !== ROLES.ENGINEER
    ) {
      throw ApiError.forbidden(
        "Support Managers can only reset passwords for Engineer accounts"
      );
    }

    user.password = data.password;
    await user.save();

    return {
      user,
      tempPassword: data.password,
    };
  }

  /**
   * Get notification preferences for a user
   * @param {String} userId - User ID
   * @param {String} requestingUserId - ID of the user making the request
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - Notification preferences
   */
  static async getNotificationPreferences(
    userId,
    requestingUserId,
    requestingUserRole
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Role-based access control - users can view their own preferences
    if (
      requestingUserRole !== ROLES.SUPER_ADMIN &&
      requestingUserRole !== ROLES.SUPPORT_MANAGER &&
      requestingUserId !== userId
    ) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Support managers can only view engineers and themselves
    if (
      requestingUserRole === ROLES.SUPPORT_MANAGER &&
      user.role !== ROLES.ENGINEER &&
      requestingUserId !== userId
    ) {
      throw ApiError.forbidden(
        "Support Managers can only view preferences for Engineers or themselves"
      );
    }

    // Get preferences
    let preferences = await NotificationPreference.findOne({ userId }).populate(
      "updatedBy",
      "name email"
    );

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId,
        email: true,
        whatsapp: false,
        sms: false,
        updatedBy: requestingUserId,
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences for a user
   * @param {String} userId - User ID
   * @param {Object} preferences - New notification preferences
   * @param {String} requestingUserId - ID of the user making the request
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - Updated notification preferences
   */
  static async updateNotificationPreferences(
    userId,
    preferences,
    requestingUserId,
    requestingUserRole
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Role-based access control - users can update their own preferences
    if (
      requestingUserRole !== ROLES.SUPER_ADMIN &&
      requestingUserRole !== ROLES.SUPPORT_MANAGER &&
      requestingUserId !== userId
    ) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Support managers can only update engineers and themselves
    if (
      requestingUserRole === ROLES.SUPPORT_MANAGER &&
      user.role !== ROLES.ENGINEER &&
      requestingUserId !== userId
    ) {
      throw ApiError.forbidden(
        "Support Managers can only update preferences for Engineers or themselves"
      );
    }

    // Update preferences
    const update = {
      ...preferences,
      updatedBy: requestingUserId,
      updatedAt: new Date(),
    };

    return await NotificationPreference.findOneAndUpdate({ userId }, update, {
      new: true,
      upsert: true,
    });
  }

  /**
   * Delete a user
   * @param {String} id - User ID to delete
   * @param {String} requestingUserId - ID of the user making the request
   * @param {String} requestingUserRole - Role of the user making the request
   * @returns {Promise<Object>} - Deleted user data
   */
  static async deleteUser(id, requestingUserId, requestingUserRole) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (id === requestingUserId) {
      throw ApiError.badRequest("Cannot delete your own account");
    }

    if (user.isDefault) {
      throw ApiError.forbidden("Cannot delete default users");
    }

    if (
      requestingUserRole === ROLES.SUPPORT_MANAGER &&
      user.role !== ROLES.ENGINEER
    ) {
      throw ApiError.forbidden(
        "Support Managers can only delete Engineer accounts"
      );
    }

    await user.deleteOne();
    return user;
  }
}

module.exports = UserService;

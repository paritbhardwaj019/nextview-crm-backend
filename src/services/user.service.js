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
  static async getAllUsers(query, options) {
    const queryObject = { ...query };

    // Handle search across multiple fields
    if (queryObject.search) {
      queryObject.$or = [
        { name: { $regex: queryObject.search, $options: "i" } },
        { email: { $regex: queryObject.search, $options: "i" } },
        { mobileNumber: { $regex: queryObject.search, $options: "i" } },
        { location: { $regex: queryObject.search, $options: "i" } },
      ];
      delete queryObject.search;
    }

    // Handle location filter
    if (queryObject.location) {
      queryObject.location = { $regex: queryObject.location, $options: "i" };
    }

    return await User.paginate(queryObject, options);
  }

  /**
   * Get user by ID
   * @param {String} id - User ID
   * @returns {Promise<Object>} - User data
   */
  static async getUserById(id) {
    const user = await User.findById(id).select("-password").populate({
      path: "createdBy",
      select: "name email",
    });

    if (!user) {
      throw ApiError.notFound("User not found");
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
    const {
      email,
      name,
      role,
      password,
      mobileNumber,
      address,
      location,
      remark,
    } = userData;

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
      mobileNumber,
      address,
      location,
      remark,
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

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "email",
      "role",
      "mobileNumber",
      "address",
      "location",
      "remark",
    ];
    const filteredUpdateData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    Object.assign(user, filteredUpdateData);
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

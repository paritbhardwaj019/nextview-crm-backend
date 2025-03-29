const TicketSettings = require("../models/ticketSettings.model");
const ApiError = require("../utils/apiError.util");
const { ROLES } = require("../config/roles");

class TicketSettingsService {
  /**
   * Get ticket system settings
   * @returns {Promise<Object>} - Settings data
   */
  static async getSettings() {
    return await TicketSettings.getSingleton();
  }

  /**
   * Update ticket system settings
   * @param {Object} updateData - Settings to update
   * @param {String} userId - ID of the user making the update
   * @param {String} userRole - Role of the user making the update
   * @returns {Promise<Object>} - Updated settings
   */
  static async updateSettings(updateData, userId, userRole) {
    if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.SUPPORT_MANAGER) {
      throw ApiError.forbidden("You do not have permission to update settings");
    }

    if (userRole === ROLES.SUPPORT_MANAGER) {
      const allowedFields = [
        "defaultDueDateDays",
        "priorityDueDates",
        "notifyOnStatusChange",
      ];

      const restrictedField = Object.keys(updateData).find(
        (field) => !allowedFields.includes(field)
      );

      if (restrictedField) {
        throw ApiError.forbidden(
          `Support Managers cannot modify the ${restrictedField} setting`
        );
      }
    }

    const settings = await TicketSettings.getSingleton();

    Object.keys(updateData).forEach((key) => {
      settings[key] = updateData[key];
    });

    settings.updatedBy = userId;

    await settings.save();

    return settings;
  }

  /**
   * Reset settings to defaults
   * @param {String} userId - ID of the user requesting the reset
   * @param {String} userRole - Role of the user requesting the reset
   * @returns {Promise<Object>} - Reset settings
   */
  static async resetToDefaults(userId, userRole) {
    if (userRole !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden(
        "Only Super Admins can reset settings to defaults"
      );
    }

    const settings = await TicketSettings.getSingleton();

    settings.autoApproval = false;
    settings.autoApprovalRoles = [];
    settings.defaultAssignToSupportManager = false;
    settings.defaultDueDateDays = 7;
    settings.priorityDueDates = {
      LOW: 10,
      MEDIUM: 7,
      HIGH: 3,
      CRITICAL: 1,
    };
    settings.notifyOnStatusChange = true;
    settings.allowReopenClosedTickets = true;
    settings.reopenWindowDays = 30;
    settings.updatedBy = userId;

    await settings.save();

    return settings;
  }

  /**
   * Toggle auto-approval setting
   * @param {Boolean} enabled - Whether to enable auto-approval
   * @param {Array} roles - Roles for which auto-approval is enabled
   * @param {String} userId - ID of the user making the change
   * @param {String} userRole - Role of the user making the change
   * @returns {Promise<Object>} - Updated settings
   */
  static async toggleAutoApproval(enabled, roles, userId, userRole) {
    // Only super admins can change auto-approval settings
    if (userRole !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden(
        "Only Super Admins can modify auto-approval settings"
      );
    }

    const settings = await TicketSettings.getSingleton();

    settings.autoApproval = enabled;

    if (roles && Array.isArray(roles)) {
      settings.autoApprovalRoles = roles;
    }

    settings.updatedBy = userId;

    await settings.save();

    return settings;
  }

  /**
   * Get due dates configuration
   * @returns {Promise<Object>} - Due dates configuration
   */
  static async getDueDatesConfig() {
    const settings = await TicketSettings.getSingleton();

    return {
      defaultDueDateDays: settings.defaultDueDateDays,
      priorityDueDates: settings.priorityDueDates,
    };
  }

  /**
   * Update due dates configuration
   * @param {Object} dueDatesConfig - Due dates configuration
   * @param {String} userId - ID of the user making the update
   * @returns {Promise<Object>} - Updated settings
   */
  static async updateDueDatesConfig(dueDatesConfig, userId) {
    const settings = await TicketSettings.getSingleton();

    if (dueDatesConfig.defaultDueDateDays !== undefined) {
      settings.defaultDueDateDays = dueDatesConfig.defaultDueDateDays;
    }

    if (dueDatesConfig.priorityDueDates) {
      const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

      for (const priority of priorities) {
        if (dueDatesConfig.priorityDueDates[priority] !== undefined) {
          settings.priorityDueDates[priority] =
            dueDatesConfig.priorityDueDates[priority];
        }
      }
    }

    settings.updatedBy = userId;

    await settings.save();

    return settings;
  }
}

module.exports = TicketSettingsService;

const TicketSettings = require("../models/ticketSettings.model");
const ApiError = require("../utils/apiError.util");
const { ROLES } = require("../config/roles");

const DEFAULT_SETTINGS = {
  autoApproval: false,
  autoApprovalRoles: [],
  defaultAssignToSupportManager: false,
  defaultDueDateDays: 7,
  priorityDueDates: {
    LOW: 10,
    MEDIUM: 7,
    HIGH: 3,
    CRITICAL: 1,
  },
  notifyOnStatusChange: true,
  allowReopenClosedTickets: true,
  reopenWindowDays: 30,
};

class TicketSettingsService {
  /**
   * Get ticket system settings
   * @returns {Promise<Object>} - Settings data
   */
  static async getSettings() {
    let settings = await TicketSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await TicketSettings.create(DEFAULT_SETTINGS);
    }

    // Ensure priorityDueDates has all required keys
    if (
      !settings.priorityDueDates ||
      typeof settings.priorityDueDates !== "object"
    ) {
      settings.priorityDueDates = { ...DEFAULT_SETTINGS.priorityDueDates };
      await settings.save();
    } else {
      // Ensure all priorities exist
      const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      let needsUpdate = false;

      for (const priority of priorities) {
        if (settings.priorityDueDates[priority] === undefined) {
          settings.priorityDueDates[priority] =
            DEFAULT_SETTINGS.priorityDueDates[priority];
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await settings.save();
      }
    }

    return settings;
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

    const settings = await this.getSettings();

    // Handle special case for priorityDueDates to ensure all keys remain
    if (updateData.priorityDueDates) {
      // Create a new object with existing values as a base
      const updatedPriorityDueDates = { ...settings.priorityDueDates };

      // Update only the keys provided in updateData
      for (const [key, value] of Object.entries(updateData.priorityDueDates)) {
        updatedPriorityDueDates[key] = value;
      }

      // Replace updateData.priorityDueDates with the complete object
      updateData.priorityDueDates = updatedPriorityDueDates;
    }

    // Apply all updates
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

    const settings = await this.getSettings();

    // Update with default values
    settings.autoApproval = DEFAULT_SETTINGS.autoApproval;
    settings.autoApprovalRoles = DEFAULT_SETTINGS.autoApprovalRoles;
    settings.defaultAssignToSupportManager =
      DEFAULT_SETTINGS.defaultAssignToSupportManager;
    settings.defaultDueDateDays = DEFAULT_SETTINGS.defaultDueDateDays;
    settings.priorityDueDates = { ...DEFAULT_SETTINGS.priorityDueDates };
    settings.notifyOnStatusChange = DEFAULT_SETTINGS.notifyOnStatusChange;
    settings.allowReopenClosedTickets =
      DEFAULT_SETTINGS.allowReopenClosedTickets;
    settings.reopenWindowDays = DEFAULT_SETTINGS.reopenWindowDays;
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

    const settings = await this.getSettings();

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
    const settings = await this.getSettings();

    return {
      defaultDueDateDays:
        settings.defaultDueDateDays || DEFAULT_SETTINGS.defaultDueDateDays,
      priorityDueDates: settings.priorityDueDates || {
        ...DEFAULT_SETTINGS.priorityDueDates,
      },
    };
  }

  /**
   * Update due dates configuration
   * @param {Object} dueDatesConfig - Due dates configuration
   * @param {String} userId - ID of the user making the update
   * @returns {Promise<Object>} - Updated settings
   */
  static async updateDueDatesConfig(dueDatesConfig, userId) {
    const settings = await this.getSettings();

    if (dueDatesConfig.defaultDueDateDays !== undefined) {
      settings.defaultDueDateDays = dueDatesConfig.defaultDueDateDays;
    }

    if (dueDatesConfig.priorityDueDates) {
      // Create a new object with existing values
      const updatedPriorityDueDates = { ...settings.priorityDueDates };

      // Update only the provided priority values
      const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      for (const priority of priorities) {
        if (dueDatesConfig.priorityDueDates[priority] !== undefined) {
          updatedPriorityDueDates[priority] =
            dueDatesConfig.priorityDueDates[priority];
        }
      }

      // Replace with the complete updated object
      settings.priorityDueDates = updatedPriorityDueDates;
    }

    settings.updatedBy = userId;
    await settings.save();

    return settings;
  }
}

module.exports = TicketSettingsService;

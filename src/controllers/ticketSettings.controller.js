const TicketSettingsService = require("../services/ticketSettings.service");
const { ActivityLogService } = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const asyncHandler = require("../utils/asyncHandler.util");

class TicketSettingsController {
  /**
   * Get ticket system settings
   * @route GET /api/settings/tickets
   * @access Private
   */
  static getSettings = asyncHandler(async (req, res) => {
    const settings = await TicketSettingsService.getSettings();

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_SETTINGS_VIEWED",
      details: "Viewed ticket system settings",
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Settings retrieved successfully",
      settings
    );
  });

  /**
   * Update ticket system settings
   * @route PUT /api/settings/tickets
   * @access Private (Super Admin, Support Manager with restrictions)
   */
  static updateSettings = asyncHandler(async (req, res) => {
    const updateData = req.body;

    const settings = await TicketSettingsService.updateSettings(
      updateData,
      req.user.id,
      req.user.role
    );

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_SETTINGS_UPDATED",
      details: `Updated ticket system settings: ${Object.keys(updateData).join(", ")}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Settings updated successfully", settings);
  });

  /**
   * Reset settings to defaults
   * @route POST /api/settings/tickets/reset
   * @access Private (Super Admin only)
   */
  static resetToDefaults = asyncHandler(async (req, res) => {
    const settings = await TicketSettingsService.resetToDefaults(
      req.user.id,
      req.user.role
    );

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_SETTINGS_RESET",
      details: "Reset ticket system settings to defaults",
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Settings reset to defaults successfully",
      settings
    );
  });

  /**
   * Toggle auto-approval setting
   * @route PATCH /api/settings/tickets/auto-approval
   * @access Private (Super Admin only)
   */
  static toggleAutoApproval = asyncHandler(async (req, res) => {
    const { enabled, roles } = req.body;

    const settings = await TicketSettingsService.toggleAutoApproval(
      enabled,
      roles,
      req.user.id,
      req.user.role
    );

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "AUTO_APPROVAL_TOGGLED",
      details: `${enabled ? "Enabled" : "Disabled"} auto-approval for roles: ${roles?.join(", ") || "none"}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      `Auto-approval ${enabled ? "enabled" : "disabled"} successfully`,
      settings
    );
  });

  /**
   * Get due dates configuration
   * @route GET /api/settings/tickets/due-dates
   * @access Private
   */
  static getDueDatesConfig = asyncHandler(async (req, res) => {
    const dueDatesConfig = await TicketSettingsService.getDueDatesConfig();

    return ApiResponse.success(
      res,
      "Due dates configuration retrieved successfully",
      dueDatesConfig
    );
  });

  /**
   * Update due dates configuration
   * @route PUT /api/settings/tickets/due-dates
   * @access Private (Super Admin, Support Manager)
   */
  static updateDueDatesConfig = asyncHandler(async (req, res) => {
    const dueDatesConfig = req.body;

    const settings = await TicketSettingsService.updateDueDatesConfig(
      dueDatesConfig,
      req.user.id
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "DUE_DATES_UPDATED",
      details: "Updated ticket due dates configuration",
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Due dates configuration updated successfully",
      settings
    );
  });
}

module.exports = TicketSettingsController;

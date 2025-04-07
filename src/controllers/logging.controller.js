const {
  ActivityLogService,
  AuditLogService,
} = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const AuditLog = require("../models/auditLog.model");
const ActivityLog = require("../models/activityLog.model");

class LoggingController {
  /**
   * Get activity logs with pagination and filtering
   * @route GET /api/logs/activity
   * @access Private (Admin)
   */
  static getActivityLogs = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      userId,
      action,
      startDate,
      endDate,
    } = req.query;

    // Prepare options for service call
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    // Add filters if provided
    if (userId) options.userId = userId;
    if (action) options.action = action;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) {
      // Set end date to end of day
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      options.endDate = endDateObj;
    }

    const result = await ActivityLogService.getActivityLogs(options);

    return ApiResponse.withPagination(
      res,
      "Activity logs retrieved successfully",
      result.logs,
      result.pagination
    );
  });

  /**
   * Get audit logs with pagination and filtering
   * @route GET /api/logs/audit
   * @access Private (Admin)
   */
  static getAuditLogs = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      entityId,
      entityType,
      action,
      performedBy,
      startDate,
      endDate,
    } = req.query;

    // Prepare options for service call
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    // Add filters if provided
    if (entityId) options.entityId = entityId;
    if (entityType) options.entityType = entityType;
    if (action) options.action = action;
    if (performedBy) options.performedBy = performedBy;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) {
      // Set end date to end of day
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      options.endDate = endDateObj;
    }

    const result = await AuditLogService.getAuditLogs(options);

    return ApiResponse.withPagination(
      res,
      "Audit logs retrieved successfully",
      result.logs,
      result.pagination
    );
  });

  /**
   * Get unique log action types
   * @route GET /api/logs/actions
   * @access Private (Admin)
   */
  static getLogActions = asyncHandler(async (req, res) => {
    // Get distinct action values from activity logs
    const activityActions = await ActivityLog.distinct("action");
    // Get distinct action values from audit logs
    const auditActions = await AuditLog.distinct("action");

    // Combine and deduplicate
    const allActions = [
      ...new Set([...activityActions, ...auditActions]),
    ].sort();

    return ApiResponse.success(
      res,
      "Log actions retrieved successfully",
      allActions
    );
  });

  /**
   * Get unique entity types from audit logs
   * @route GET /api/logs/entity-types
   * @access Private (Admin)
   */
  static getEntityTypes = asyncHandler(async (req, res) => {
    // Get distinct entity types from audit logs
    const entityTypes = await AuditLog.distinct("entityType");

    return ApiResponse.success(
      res,
      "Entity types retrieved successfully",
      entityTypes.sort()
    );
  });
}

module.exports = LoggingController;

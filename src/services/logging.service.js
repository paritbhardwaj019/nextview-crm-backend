const AuditLog = require("../models/auditLog.model");
const ActivityLog = require("../models/activityLog.model");

class AuditLogService {
  static async createAuditLog(params) {
    const {
      entityId,
      entityType,
      action,
      previousState,
      newState,
      performedBy,
      ipAddress,
    } = params;

    return await AuditLog.create({
      entityId,
      entityType,
      action,
      previousState,
      newState,
      performedBy,
      performedAt: new Date(),
      ipAddress,
    });
  }

  static async getAuditLogs(options = {}) {
    const {
      entityId,
      entityType,
      action,
      performedBy,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = options;

    const query = {};

    if (entityId) query.entityId = entityId;
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;

    if (startDate || endDate) {
      query.performedAt = {};
      if (startDate) query.performedAt.$gte = new Date(startDate);
      if (endDate) query.performedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("performedBy", "name email");

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

class ActivityLogService {
  static async logActivity(params) {
    const { userId, action, details, ipAddress } = params;

    return await ActivityLog.create({
      userId,
      action,
      details,
      timestamp: new Date(),
      ipAddress,
    });
  }

  static async getActivityLogs(options = {}) {
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = options;

    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email");

    const total = await ActivityLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = {
  AuditLogService,
  ActivityLogService,
};

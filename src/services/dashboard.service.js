// src/services/dashboard.service.js
const User = require("../models/user.model");
const Ticket = require("../models/ticket.model");
const Item = require("../models/item.model");
const Customer = require("../models/customer.model");
const InstallationRequest = require("../models/installationRequest.model");
const ActivityLog = require("../models/activityLog.model");

class DashboardService {
  /**
   * Get dashboard summary statistics
   * @returns {Promise<Object>} Dashboard summary data
   */
  static async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalTickets,
        openTickets,
        totalInstallations,
        pendingInstallations,
        itemsCount,
        lowStockItems,
        customerCount,
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Ticket.countDocuments(),
        Ticket.countDocuments({
          status: {
            $in: [
              "OPEN",
              "ASSIGNED",
              "IN_PROGRESS",
              "REOPENED",
              "PENDING_APPROVAL",
            ],
          },
        }),
        InstallationRequest.countDocuments(),
        InstallationRequest.countDocuments({
          status: { $in: ["PENDING", "SCHEDULED"] },
        }),
        Item.countDocuments(),
        Item.countDocuments({ quantity: { $lte: 10 } }),
        Customer.countDocuments({ isActive: true }),
      ]);

      // Calculate percentage changes (you would need to compare with previous period data)
      // For this example, we'll use mock percentage changes
      const stats = {
        users: {
          total: totalUsers,
          change: 5.3, // percentage change
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          change: -12.5,
        },
        installations: {
          total: totalInstallations,
          pending: pendingInstallations,
          change: 15.2,
        },
        inventory: {
          total: itemsCount,
          lowStock: lowStockItems,
        },
        customers: {
          total: customerCount,
        },
        satisfaction: {
          // If you have customer feedback system, calculate from there
          rate: 92, // percentage
          change: 2.5,
        },
      };

      return stats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Get recent activity logs
   * @param {Number} limit - Number of activities to return
   * @returns {Promise<Array>} Recent activities
   */
  static async getRecentActivities(limit = 10) {
    try {
      const activities = await ActivityLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("userId", "name email role")
        .lean();

      // Transform activity data to a friendlier format
      return activities.map((activity) => {
        const activityType = this.getActivityType(activity.action);

        return {
          id: activity._id,
          type: activityType,
          action: this.formatActivityAction(activity.action),
          name: this.getActivityName(activity),
          time: this.getRelativeTime(activity.timestamp),
          status: this.getActivityStatus(activity.action),
          user: activity.userId
            ? {
                id: activity.userId._id,
                name: activity.userId.name,
                email: activity.userId.email,
                role: activity.userId.role,
              }
            : null,
        };
      });
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      throw error;
    }
  }

  /**
   * Get chart data for dashboard
   * @param {String} period - 'daily', 'weekly', or 'monthly'
   * @returns {Promise<Array>} Chart data
   */
  static async getChartData(period = "monthly") {
    try {
      const now = new Date();
      let startDate;
      let dateFormat;
      let groupBy;

      // Set up date range based on period
      switch (period) {
        case "daily":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7); // Last 7 days
          dateFormat = "%Y-%m-%d";
          groupBy = {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          };
          break;
        case "weekly":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 60); // Last ~8 weeks
          dateFormat = "%Y-W%U";
          groupBy = {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" },
          };
          break;
        case "monthly":
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 7); // Last 7 months
          dateFormat = "%Y-%m";
          groupBy = {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          };
          break;
      }

      // Get ticket counts
      const ticketData = await Ticket.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 },
        },
      ]);

      // Get user registration counts
      const userData = await User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 },
        },
      ]);

      // Get installation request counts
      const installationData = await InstallationRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 },
        },
      ]);

      // Format the data for the chart
      const formattedData = this.formatChartData(
        period,
        ticketData,
        userData,
        installationData,
        startDate,
        now
      );

      return formattedData;
    } catch (error) {
      console.error("Error fetching chart data:", error);
      throw error;
    }
  }

  /**
   * Get ticket statistics by status
   * @returns {Promise<Object>} Ticket stats by status
   */
  static async getTicketStats() {
    try {
      const stats = await Ticket.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      return stats.reduce((result, stat) => {
        result[stat._id.toLowerCase()] = stat.count;
        return result;
      }, {});
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      throw error;
    }
  }

  /**
   * Get top customers with most tickets
   * @param {Number} limit - Number of customers to return
   * @returns {Promise<Array>} Top customers
   */
  static async getTopCustomers(limit = 5) {
    try {
      return await Customer.aggregate([
        {
          $lookup: {
            from: "tickets",
            localField: "_id",
            foreignField: "customerId",
            as: "tickets",
          },
        },
        { $addFields: { ticketCount: { $size: "$tickets" } } },
        { $sort: { ticketCount: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            mobile: 1,
            email: 1,
            ticketCount: 1,
            openTickets: {
              $size: {
                $filter: {
                  input: "$tickets",
                  as: "ticket",
                  cond: {
                    $in: [
                      "$$ticket.status",
                      [
                        "OPEN",
                        "ASSIGNED",
                        "IN_PROGRESS",
                        "REOPENED",
                        "PENDING_APPROVAL",
                      ],
                    ],
                  },
                },
              },
            },
          },
        },
      ]);
    } catch (error) {
      console.error("Error fetching top customers:", error);
      throw error;
    }
  }

  /**
   * Get items with low stock
   * @param {Number} limit - Number of items to return
   * @returns {Promise<Array>} Low stock items
   */
  static async getLowStockItems(limit = 5) {
    try {
      return await Item.find({ quantity: { $lte: 10 } })
        .sort({ quantity: 1 })
        .limit(limit)
        .select("name category quantity status")
        .lean();
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      throw error;
    }
  }

  /**
   * Get pending installation requests
   * @param {Number} limit - Number of installations to return
   * @returns {Promise<Array>} Pending installations
   */
  static async getPendingInstallations(limit = 5) {
    try {
      return await InstallationRequest.find({
        status: { $in: ["PENDING", "SCHEDULED"] },
      })
        .sort({ preferredDate: 1 })
        .limit(limit)
        .populate("customerId", "name mobile")
        .lean();
    } catch (error) {
      console.error("Error fetching pending installations:", error);
      throw error;
    }
  }

  /**
   * Helper method to determine activity type
   * @param {String} action - Activity action
   * @returns {String} Activity type category
   */
  static getActivityType(action) {
    if (action.includes("USER")) return "user";
    if (action.includes("TICKET")) return "ticket";
    if (action.includes("INSTALLATION")) return "installation";
    if (action.includes("ITEM") || action.includes("INVENTORY"))
      return "inventory";
    return "other";
  }

  /**
   * Helper method to format activity action
   * @param {String} action - Activity action
   * @returns {String} Formatted action text
   */
  static formatActivityAction(action) {
    // Convert from snake case to human readable text
    const formattedAction = action.replace(/_/g, " ").toLowerCase();

    // Initial capitalization
    return formattedAction.charAt(0).toUpperCase() + formattedAction.slice(1);
  }

  /**
   * Helper method to get activity name
   * @param {Object} activity - Activity object
   * @returns {String} Activity name/description
   */
  static getActivityName(activity) {
    // Extract relevant name from activity details
    const details = activity.details || "";

    // Try to extract the name from details
    const nameMatch = details.match(/['"]([^'"]+)['"]/);
    if (nameMatch) return nameMatch[1];

    return details.length > 30 ? details.substring(0, 30) + "..." : details;
  }

  /**
   * Helper method to get relative time
   * @param {Date} timestamp - Activity timestamp
   * @returns {String} Relative time string
   */
  static getRelativeTime(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  /**
   * Helper method to get activity status
   * @param {String} action - Activity action
   * @returns {String} Activity status
   */
  static getActivityStatus(action) {
    if (
      action.includes("CREATED") ||
      action.includes("NEW") ||
      action.includes("REGISTERED")
    )
      return "new";
    if (action.includes("OPEN")) return "open";
    if (action.includes("PENDING") || action.includes("SCHEDULED"))
      return "pending";
    if (
      action.includes("RESOLVED") ||
      action.includes("COMPLETED") ||
      action.includes("CLOSED")
    )
      return "resolved";
    return "default";
  }

  /**
   * Helper method to format chart data
   * @param {String} period - Time period
   * @param {Array} ticketData - Ticket count data
   * @param {Array} userData - User count data
   * @param {Array} installationData - Installation count data
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Formatted chart data
   */
  static formatChartData(
    period,
    ticketData,
    userData,
    installationData,
    startDate,
    endDate
  ) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const result = [];

    // Generate time periods between start and end dates
    const periods = this.generateTimePeriods(period, startDate, endDate);

    // Fill in data for each period
    periods.forEach((periodInfo) => {
      const { year, month, day, week, name } = periodInfo;

      // Find corresponding data points
      const ticketPoint = ticketData.find((d) => {
        if (period === "daily")
          return (
            d._id.year === year && d._id.month === month && d._id.day === day
          );
        if (period === "weekly")
          return d._id.year === year && d._id.week === week;
        return d._id.year === year && d._id.month === month;
      });

      const userPoint = userData.find((d) => {
        if (period === "daily")
          return (
            d._id.year === year && d._id.month === month && d._id.day === day
          );
        if (period === "weekly")
          return d._id.year === year && d._id.week === week;
        return d._id.year === year && d._id.month === month;
      });

      const installationPoint = installationData.find((d) => {
        if (period === "daily")
          return (
            d._id.year === year && d._id.month === month && d._id.day === day
          );
        if (period === "weekly")
          return d._id.year === year && d._id.week === week;
        return d._id.year === year && d._id.month === month;
      });

      // Add data point to result
      result.push({
        name,
        tickets: ticketPoint ? ticketPoint.count : 0,
        users: userPoint ? userPoint.count : 0,
        installations: installationPoint ? installationPoint.count : 0,
      });
    });

    return result;
  }

  /**
   * Helper method to generate time periods
   * @param {String} period - Time period
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of time periods
   */
  static generateTimePeriods(period, startDate, endDate) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const result = [];

    if (period === "daily") {
      // Generate daily periods
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const name = `${month}/${day}`;

        result.push({ year, month, day, name });
      }
    } else if (period === "weekly") {
      // Generate weekly periods
      // This is simplified - a more accurate implementation would account for ISO weeks
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 7)
      ) {
        const year = d.getFullYear();
        const week = Math.ceil(d.getDate() / 7);
        const name = `W${week}`;

        result.push({ year, week, name });
      }
    } else {
      // Generate monthly periods
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setMonth(d.getMonth() + 1)
      ) {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const name = months[d.getMonth()];

        result.push({ year, month, name });
      }
    }

    return result;
  }
}

module.exports = DashboardService;

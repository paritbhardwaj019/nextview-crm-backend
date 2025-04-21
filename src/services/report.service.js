const Ticket = require("../models/ticket.model");
const User = require("../models/user.model");
const Customer = require("../models/customer.model");
const { sendEmail } = require("./notification.service");
const fs = require("fs");
const path = require("path");
const csvWriter = require("csv-writer");
const config = require("../config/config");
const mongoose = require("mongoose");

/**
 * Service for generating and sending reports
 */
class ReportService {
  /**
   * Get ticket counts by type (status)
   * @returns {Promise<Array>} Array of ticket counts by status
   */
  static async getTicketCountsByType() {
    try {
      console.log("Getting ticket counts by type...");

      // Use a longer timeout for this operation
      const result = await Ticket.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).exec();

      return result;
    } catch (error) {
      console.error("Error getting ticket counts by type:", error);
      throw error;
    }
  }

  /**
   * Get ticket counts by priority
   * @returns {Promise<Array>} Array of ticket counts by priority
   */
  static async getTicketCountsByPriority() {
    try {
      const result = await Ticket.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).exec();

      return result;
    } catch (error) {
      console.error("Error getting ticket counts by priority:", error);
      throw error;
    }
  }

  /**
   * Get ticket counts by category
   * @returns {Promise<Array>} Array of ticket counts by category
   */
  static async getTicketCountsByCategory() {
    try {
      const result = await Ticket.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).exec();

      return result;
    } catch (error) {
      console.error("Error getting ticket counts by category:", error);
      throw error;
    }
  }

  /**
   * Get tickets created in the last 24 hours
   * @returns {Promise<Array>} Array of recent tickets
   */
  static async getRecentTickets() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tickets = await Ticket.find({
        createdAt: { $gte: yesterday },
      })
        .populate("customerId", "name")
        .populate("createdBy", "name")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 })
        .exec();

      return tickets;
    } catch (error) {
      console.error("Error getting recent tickets:", error);
      throw error;
    }
  }

  /**
   * Get tickets created in the last 7 days
   * @returns {Promise<Array>} Array of weekly tickets
   */
  static async getWeeklyTickets() {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const tickets = await Ticket.find({
        createdAt: { $gte: lastWeek },
      })
        .populate("customerId", "name")
        .populate("createdBy", "name")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 })
        .exec();

      return tickets;
    } catch (error) {
      console.error("Error getting weekly tickets:", error);
      throw error;
    }
  }

  /**
   * Get engineer performance metrics for the last 7 days
   * @returns {Promise<Array>} Array of engineer performance data
   */
  static async getEngineerPerformance() {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Get all engineers
      const engineers = await User.find({
        role: "ENGINEER",
        isActive: true,
      }).exec();

      // For each engineer, calculate performance metrics
      const performance = [];

      for (const engineer of engineers) {
        // Get tickets assigned to this engineer in the last 7 days
        const assignedTickets = await Ticket.find({
          assignedTo: engineer._id,
          assignedAt: { $gte: lastWeek },
        }).exec();

        // Get tickets resolved by this engineer in the last 7 days
        const resolvedTickets = await Ticket.find({
          resolvedBy: engineer._id,
          resolvedAt: { $gte: lastWeek },
        }).exec();

        // Calculate average resolution time for resolved tickets
        let totalResolutionTime = 0;
        let ticketsWithResolutionTime = 0;

        for (const ticket of resolvedTickets) {
          if (ticket.assignedAt && ticket.resolvedAt) {
            const resolutionTime = ticket.resolvedAt - ticket.assignedAt;
            totalResolutionTime += resolutionTime;
            ticketsWithResolutionTime++;
          }
        }

        const avgResolutionTime =
          ticketsWithResolutionTime > 0
            ? totalResolutionTime / ticketsWithResolutionTime / (1000 * 60 * 60) // Convert to hours
            : 0;

        performance.push({
          engineer: engineer.name,
          assignedTickets: assignedTickets.length,
          resolvedTickets: resolvedTickets.length,
          avgResolutionTimeHours: avgResolutionTime.toFixed(2),
        });
      }

      return performance;
    } catch (error) {
      console.error("Error getting engineer performance:", error);
      throw error;
    }
  }

  /**
   * Generate CSV file with report data
   * @param {String} reportType - Type of report (daily or weekly)
   * @param {Object} data - Report data
   * @returns {Promise<String>} - Path to the generated CSV file
   */
  static async generateCSVReport(reportType, data) {
    try {
      const reportsDir = path.join(__dirname, "../../reports");

      // Create reports directory if it doesn't exist
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const date = new Date().toISOString().split("T")[0];
      const filePath = path.join(
        reportsDir,
        `${reportType}_report_${date}.csv`
      );

      // Create CSV writer
      const writer = csvWriter.createObjectCsvWriter({
        path: filePath,
        header: [
          { id: "category", title: "Category" },
          { id: "value", title: "Value" },
        ],
      });

      // Format data for CSV
      const records = [];

      // Add ticket counts by status
      if (data.ticketCountsByType) {
        records.push({ category: "TICKET COUNTS BY STATUS", value: "" });
        for (const item of data.ticketCountsByType) {
          records.push({
            category: item._id || "Unknown",
            value: item.count,
          });
        }
        records.push({ category: "", value: "" });
      }

      // Add ticket counts by priority
      if (data.ticketCountsByPriority) {
        records.push({ category: "TICKET COUNTS BY PRIORITY", value: "" });
        for (const item of data.ticketCountsByPriority) {
          records.push({
            category: item._id || "Unknown",
            value: item.count,
          });
        }
        records.push({ category: "", value: "" });
      }

      // Add ticket counts by category
      if (data.ticketCountsByCategory) {
        records.push({ category: "TICKET COUNTS BY CATEGORY", value: "" });
        for (const item of data.ticketCountsByCategory) {
          records.push({
            category: item._id || "Unknown",
            value: item.count,
          });
        }
        records.push({ category: "", value: "" });
      }

      // Add engineer performance data
      if (data.engineerPerformance) {
        records.push({ category: "ENGINEER PERFORMANCE", value: "" });
        for (const engineer of data.engineerPerformance) {
          records.push({
            category: `${engineer.engineer} - Assigned Tickets`,
            value: engineer.assignedTickets,
          });
          records.push({
            category: `${engineer.engineer} - Resolved Tickets`,
            value: engineer.resolvedTickets,
          });
          records.push({
            category: `${engineer.engineer} - Avg Resolution Time (hours)`,
            value: engineer.avgResolutionTimeHours,
          });
          records.push({ category: "", value: "" });
        }
      }

      // Write data to CSV
      await writer.writeRecords(records);

      return filePath;
    } catch (error) {
      console.error(`Error generating ${reportType} CSV report:`, error);
      throw error;
    }
  }

  /**
   * Generate and send daily report email with attachments
   */
  static async generateDailyReport() {
    console.log("Generating daily report...");
    try {
      // Ensure the database is properly connected first
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(config.db.uri, config.db.options);
        console.log("MongoDB connected for report generation");
      }

      // Get report data
      const ticketCountsByType = await this.getTicketCountsByType();
      const ticketCountsByPriority = await this.getTicketCountsByPriority();
      const ticketCountsByCategory = await this.getTicketCountsByCategory();
      const recentTickets = await this.getRecentTickets();

      // Generate CSV report
      const reportData = {
        ticketCountsByType,
        ticketCountsByPriority,
        ticketCountsByCategory,
        recentTickets,
      };

      const csvFilePath = await this.generateCSVReport("daily", reportData);

      // Find super admin and support manager emails
      const admins = await User.find({
        role: { $in: ["SUPER_ADMIN", "SUPPORT_MANAGER"] },
        isActive: true,
      })
        .select("email name")
        .exec();

      const adminEmails = admins.map((admin) => admin.email);

      if (adminEmails.length === 0) {
        console.log("No admin emails found for sending report");
        return;
      }

      // Build email content
      const totalTickets = recentTickets.length;
      const date = new Date().toISOString().split("T")[0];

      const statusSummary = ticketCountsByType
        .map((item) => `${item._id || "Unknown"}: ${item.count}`)
        .join(", ");

      const emailText = `
        Daily Support Ticket Report - ${date}
        
        Summary:
        - Total tickets created in the last 24 hours: ${totalTickets}
        - Ticket Status Summary: ${statusSummary}
        
      `;

      // Send email with attachment
      await sendEmail({
        to: adminEmails,
        subject: `Daily Support Ticket Report - ${date}`,
        text: emailText,
        attachments: [
          {
            filename: path.basename(csvFilePath),
            path: csvFilePath,
          },
        ],
      });

      console.log("Daily report sent successfully");
    } catch (error) {
      console.error("Error generating daily report:", error);
      throw error;
    } finally {
      // Don't close the connection if we didn't open it
    }
  }

  /**
   * Generate and send weekly report email with attachments
   */
  static async generateWeeklyReport() {
    console.log("Generating weekly report...");
    try {
      // Ensure the database is properly connected first
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(config.db.uri, config.db.options);
        console.log("MongoDB connected for report generation");
      }

      // Get report data
      const ticketCountsByType = await this.getTicketCountsByType();
      const ticketCountsByPriority = await this.getTicketCountsByPriority();
      const ticketCountsByCategory = await this.getTicketCountsByCategory();
      const weeklyTickets = await this.getWeeklyTickets();
      const engineerPerformance = await this.getEngineerPerformance();

      // Generate CSV report
      const reportData = {
        ticketCountsByType,
        ticketCountsByPriority,
        ticketCountsByCategory,
        weeklyTickets,
        engineerPerformance,
      };

      const csvFilePath = await this.generateCSVReport("weekly", reportData);

      // Find super admin and support manager emails
      const admins = await User.find({
        role: { $in: ["SUPER_ADMIN", "SUPPORT_MANAGER"] },
        isActive: true,
      })
        .select("email name")
        .exec();

      const adminEmails = admins.map((admin) => admin.email);

      if (adminEmails.length === 0) {
        console.log("No admin emails found for sending report");
        return;
      }

      // Build email content
      const totalTickets = weeklyTickets.length;
      const date = new Date().toISOString().split("T")[0];

      const statusSummary = ticketCountsByType
        .map((item) => `${item._id || "Unknown"}: ${item.count}`)
        .join(", ");

      // Performance highlights
      let performanceHighlights = "";
      if (engineerPerformance.length > 0) {
        performanceHighlights = "Engineer Performance Highlights:\n";

        // Find engineer with most resolved tickets
        const topResolver = [...engineerPerformance].sort(
          (a, b) => b.resolvedTickets - a.resolvedTickets
        )[0];

        // Find engineer with fastest resolution time
        const fastestResolver = [...engineerPerformance]
          .filter((e) => e.avgResolutionTimeHours > 0)
          .sort(
            (a, b) =>
              parseFloat(a.avgResolutionTimeHours) -
              parseFloat(b.avgResolutionTimeHours)
          )[0];

        if (topResolver) {
          performanceHighlights += `- Most tickets resolved: ${topResolver.engineer} (${topResolver.resolvedTickets} tickets)\n`;
        }

        if (fastestResolver) {
          performanceHighlights += `- Fastest resolution time: ${fastestResolver.engineer} (${fastestResolver.avgResolutionTimeHours} hours on average)\n`;
        }
      }

      const emailText = `
        Weekly Support Ticket Report - ${date}
        
        Summary:
        - Total tickets created in the last 7 days: ${totalTickets}
        - Ticket Status Summary: ${statusSummary}
        
        ${performanceHighlights}
        
      `;

      await sendEmail({
        to: adminEmails,
        subject: `Weekly Support Ticket Report - ${date}`,
        text: emailText,
      });

      console.log("Weekly report sent successfully");
    } catch (error) {
      console.error("Error generating weekly report:", error);
      throw error;
    } finally {
    }
  }
}

module.exports = ReportService;

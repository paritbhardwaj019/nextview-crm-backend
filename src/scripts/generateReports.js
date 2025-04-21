require("dotenv").config();
const reportService = require("../services/report.service");

/**
 * Script to manually generate reports for testing
 * Usage: node src/scripts/generateReports.js [daily|weekly|both]
 */
const generateReports = async () => {
  try {
    const reportType = process.argv[2] || "both";

    console.log(`Generating ${reportType} report(s)...`);

    if (reportType === "daily" || reportType === "both") {
      console.log("Generating daily report...");
      await reportService.generateDailyReport();
      console.log("Daily report generated successfully");
    }

    if (reportType === "weekly" || reportType === "both") {
      console.log("Generating weekly report...");
      await reportService.generateWeeklyReport();
      console.log("Weekly report generated successfully");
    }

    console.log("All reports generated successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error generating reports:", error);
    process.exit(1);
  }
};

// Run the script
generateReports();

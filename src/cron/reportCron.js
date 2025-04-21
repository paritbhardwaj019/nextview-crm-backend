const cron = require("node-cron");
const reportService = require("../services/report.service");

/**
 * Initialize all cron jobs for reports
 */
const initReportCronJobs = () => {
  console.log("Initializing report cron jobs...");

  // Daily report - Every day at 8:00 PM
  cron.schedule("0 20 * * *", async () => {
    console.log("Running daily report cron job...");
    try {
      await reportService.generateDailyReport();
    } catch (error) {
      console.error("Error in daily report cron job:", error);
    }
  });

  // Weekly report - Every Saturday at 8:00 PM
  cron.schedule("0 20 * * 6", async () => {
    console.log("Running weekly report cron job...");
    try {
      await reportService.generateWeeklyReport();
    } catch (error) {
      console.error("Error in weekly report cron job:", error);
    }
  });

  console.log("Report cron jobs initialized successfully");
};

module.exports = {
  initReportCronJobs,
};

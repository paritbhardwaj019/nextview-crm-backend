// src/controllers/dashboard.controller.js
const DashboardService = require("../services/dashboard.service");
const ApiResponse = require("../utils/apiResponse.util");
const asyncHandler = require("../utils/asyncHandler.util");

class DashboardController {
  /**
   * Get dashboard summary statistics
   * @route GET /api/dashboard/stats
   * @access Private
   */
  static getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await DashboardService.getDashboardStats();
    return ApiResponse.success(
      res,
      "Dashboard statistics retrieved successfully",
      stats
    );
  });

  /**
   * Get recent activities
   * @route GET /api/dashboard/activities
   * @access Private
   */
  static getRecentActivities = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const activities = await DashboardService.getRecentActivities(
      parseInt(limit, 10)
    );
    return ApiResponse.success(
      res,
      "Recent activities retrieved successfully",
      activities
    );
  });

  /**
   * Get chart data for dashboard
   * @route GET /api/dashboard/chart-data
   * @access Private
   */
  static getChartData = asyncHandler(async (req, res) => {
    const { period = "monthly" } = req.query;
    const chartData = await DashboardService.getChartData(period);
    return ApiResponse.success(
      res,
      "Chart data retrieved successfully",
      chartData
    );
  });

  /**
   * Get ticket statistics by status
   * @route GET /api/dashboard/ticket-stats
   * @access Private
   */
  static getTicketStats = asyncHandler(async (req, res) => {
    const stats = await DashboardService.getTicketStats();
    return ApiResponse.success(
      res,
      "Ticket statistics retrieved successfully",
      stats
    );
  });

  /**
   * Get top customers with most tickets
   * @route GET /api/dashboard/top-customers
   * @access Private
   */
  static getTopCustomers = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    const customers = await DashboardService.getTopCustomers(
      parseInt(limit, 10)
    );
    return ApiResponse.success(
      res,
      "Top customers retrieved successfully",
      customers
    );
  });

  /**
   * Get items with low stock
   * @route GET /api/dashboard/low-stock
   * @access Private
   */
  static getLowStockItems = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    const items = await DashboardService.getLowStockItems(parseInt(limit, 10));
    return ApiResponse.success(
      res,
      "Low stock items retrieved successfully",
      items
    );
  });

  /**
   * Get pending installation requests
   * @route GET /api/dashboard/pending-installations
   * @access Private
   */
  static getPendingInstallations = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    const installations = await DashboardService.getPendingInstallations(
      parseInt(limit, 10)
    );
    return ApiResponse.success(
      res,
      "Pending installations retrieved successfully",
      installations
    );
  });
}

module.exports = DashboardController;

const express = require("express");
const DashboardController = require("../controllers/dashboard.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { PERMISSIONS } = require("../config/roles");

const router = express.Router();

// All dashboard routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard summary statistics
 *     description: Retrieve key metrics for the dashboard.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", DashboardController.getDashboardStats);

/**
 * @swagger
 * /api/dashboard/activities:
 *   get:
 *     summary: Get recent activities
 *     description: Retrieve recent system activities.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent activities
 *       401:
 *         description: Unauthorized
 */
router.get("/activities", DashboardController.getRecentActivities);

/**
 * @swagger
 * /api/dashboard/chart-data:
 *   get:
 *     summary: Get chart data
 *     description: Retrieve time-series data for dashboard charts.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Time period for chart data
 *     responses:
 *       200:
 *         description: Chart data
 *       401:
 *         description: Unauthorized
 */
router.get("/chart-data", DashboardController.getChartData);

/**
 * @swagger
 * /api/dashboard/ticket-stats:
 *   get:
 *     summary: Get ticket statistics
 *     description: Retrieve ticket counts by status.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket statistics
 *       401:
 *         description: Unauthorized
 */
router.get("/ticket-stats", DashboardController.getTicketStats);

/**
 * @swagger
 * /api/dashboard/top-customers:
 *   get:
 *     summary: Get top customers
 *     description: Retrieve customers with the most tickets.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of customers to return
 *     responses:
 *       200:
 *         description: Top customers
 *       401:
 *         description: Unauthorized
 */
router.get("/top-customers", DashboardController.getTopCustomers);

/**
 * @swagger
 * /api/dashboard/low-stock:
 *   get:
 *     summary: Get low stock items
 *     description: Retrieve inventory items with low stock.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: Low stock items
 *       401:
 *         description: Unauthorized
 */
router.get("/low-stock", DashboardController.getLowStockItems);

/**
 * @swagger
 * /api/dashboard/pending-installations:
 *   get:
 *     summary: Get pending installations
 *     description: Retrieve pending installation requests.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of installations to return
 *     responses:
 *       200:
 *         description: Pending installations
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/pending-installations",
  DashboardController.getPendingInstallations
);

module.exports = router;

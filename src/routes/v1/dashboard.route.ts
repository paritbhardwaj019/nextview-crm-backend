import dashboardController from "../../controllers/dashboard.controller";
import express from "express";
import { checkJWT } from "../../middlewares/checkJWT";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";
import { checkPermission } from "../../middlewares/checkPermission";

const router = express.Router();

/**
 * @route GET /dashboard/stats
 * @desc Get dashboard statistics
 * @access Protected
 */
router.get(
  "/stats",
  checkJWT,
  checkPermission(RESOURCES.DASHBOARD, ACTIONS.VIEW),
  dashboardController.getDashboardStatsHandler
);

/**
 * @route GET /dashboard/inventory-overview
 * @desc Get inventory overview data
 * @access Protected
 */
router.get(
  "/inventory-overview",
  checkJWT,
  checkPermission(RESOURCES.DASHBOARD, ACTIONS.VIEW),
  dashboardController.getInventoryOverviewHandler
);

/**
 * @route GET /dashboard/inventory-stats
 * @desc Get inventory statistics
 * @access Protected
 */
router.get(
  "/inventory-stats",
  checkJWT,
  checkPermission(RESOURCES.DASHBOARD, ACTIONS.VIEW),
  dashboardController.getInventoryStatsHandler
);

/**
 * @route GET /dashboard/recent-tickets
 * @desc Get recent tickets with optional limit
 * @access Protected
 */
router.get(
  "/recent-tickets",
  checkJWT,
  checkPermission(RESOURCES.DASHBOARD, ACTIONS.VIEW),
  dashboardController.getRecentTicketsHandler
);

/**
 * @route GET /dashboard/maintenance-schedule
 * @desc Get maintenance schedule data
 * @access Protected
 */
router.get(
  "/maintenance-schedule",
  checkJWT,
  checkPermission(RESOURCES.DASHBOARD, ACTIONS.VIEW),
  dashboardController.getMaintenanceScheduleHandler
);

/**
 * @route GET /dashboard/export
 * @desc Export dashboard data
 * @access Protected
 */
router.get(
  "/export",
  checkJWT,
  checkPermission(RESOURCES.DASHBOARD, ACTIONS.VIEW),
  dashboardController.exportDashboardDataHandler
);

export default router;

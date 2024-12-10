import { Request, Response, NextFunction } from "express";
import dashboardService from "../services/dashboard.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class DashboardController {
  /**
   * Handle retrieving dashboard statistics.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getDashboardStatsHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await dashboardService.getDashboardStats();
      res.status(httpStatus.OK).json(stats);
    }
  );

  /**
   * Handle retrieving inventory overview data.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getInventoryOverviewHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const overview = await dashboardService.getInventoryOverview();
      res.status(httpStatus.OK).json(overview);
    }
  );

  /**
   * Handle retrieving inventory statistics.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getInventoryStatsHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await dashboardService.getInventoryStats();
      res.status(httpStatus.OK).json(stats);
    }
  );

  /**
   * Handle retrieving recent tickets.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getRecentTicketsHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const tickets = await dashboardService.getRecentTickets(limit);
      res.status(httpStatus.OK).json(tickets);
    }
  );

  /**
   * Handle retrieving maintenance schedule.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getMaintenanceScheduleHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const schedule = await dashboardService.getMaintenanceSchedule();
      res.status(httpStatus.OK).json(schedule);
    }
  );

  /**
   * Handle exporting dashboard data in PDF format.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  exportDashboardDataHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const [stats, overview, inventoryStats] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getInventoryOverview(),
        dashboardService.getInventoryStats(),
      ]);

      res.status(httpStatus.OK).json({
        stats,
        overview,
        inventoryStats,
      });
    }
  );
}

export default new DashboardController();

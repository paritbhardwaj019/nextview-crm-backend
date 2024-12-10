import { Request, Response, NextFunction } from "express";
import NotificationService from "../services/notification.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class NotificationController {
  /**
   * Handle querying notifications with pagination, sorting, and searching.
   */
  queryNotificationsHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const filter = req.query as any;
      const notifications = await NotificationService.queryNotifications(
        filter,
        req?.user?.id
      );
      res.status(httpStatus.OK).json(notifications);
    }
  );

  /**
   * Handle marking a notification as read.
   */
  markAsReadHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req?.user?.id;
      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id, userId);
      res.status(httpStatus.OK).json(notification);
    }
  );

  /**
   * Handle marking all notifications as read.
   */
  markAllAsReadHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req?.user?.id;
      await NotificationService.markAllAsRead(userId);
      res.status(httpStatus.NO_CONTENT).send();
    }
  );

  /**
   * Handle deleting a notification.
   */
  deleteNotificationHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req?.user?.id;
      const { id } = req.params;
      await NotificationService.deleteNotification(id, userId);
      res.status(httpStatus.NO_CONTENT).send();
    }
  );

  /**
   * Handle getting unread notification count.
   */
  getUnreadCountHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req?.user?.id;
      const count = await NotificationService.getUnreadCount(userId);
      res.status(httpStatus.OK).json({ count });
    }
  );
}

export default new NotificationController();

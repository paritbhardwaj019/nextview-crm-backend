import express from "express";
import { checkPermission } from "../../middlewares/checkPermission";
import { ACTIONS } from "../../config/actions";
import { RESOURCES } from "../../config/resources";
import { checkJWT } from "../../middlewares/checkJWT";
import notificationController from "../../controllers/notification.controller";

const router = express.Router();

/**
 * @route GET /notifications
 * @desc Get user's notifications with pagination and filtering
 */
router.get(
  "/",
  checkJWT,
  checkPermission(RESOURCES.NOTIFICATIONS, ACTIONS.VIEW),
  notificationController.queryNotificationsHandler
);

/**
 * @route PATCH /notifications/:id/read
 * @desc Mark a notification as read
 */
router.patch(
  "/:id/read",
  checkJWT,
  checkPermission(RESOURCES.NOTIFICATIONS, ACTIONS.EDIT),
  notificationController.markAsReadHandler
);

/**
 * @route PATCH /notifications/read-all
 * @desc Mark all notifications as read
 */
router.patch(
  "/read-all",
  checkJWT,
  checkPermission(RESOURCES.NOTIFICATIONS, ACTIONS.EDIT),
  notificationController.markAllAsReadHandler
);

/**
 * @route DELETE /notifications/:id
 * @desc Delete a notification
 */
router.delete(
  "/:id",
  checkJWT,
  checkPermission(RESOURCES.NOTIFICATIONS, ACTIONS.DELETE),
  notificationController.deleteNotificationHandler
);

/**
 * @route GET /notifications/unread-count
 * @desc Get count of unread notifications
 */
router.get(
  "/unread-count",
  checkJWT,
  checkPermission(RESOURCES.NOTIFICATIONS, ACTIONS.VIEW),
  notificationController.getUnreadCountHandler
);

export default router;

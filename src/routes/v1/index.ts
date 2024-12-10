import express from "express";
import roleRoutes from "./role.route";
import authRoutes from "./auth.route";
import courierTrackingRoutes from "./courierTracking.route";
import installationRequestRoutes from "./installationRequest.route";
import inventoryItemRoutes from "./inventoryItem.route";
import inventoryTypeRoutes from "./inventoryType.route";
import permissionRoutes from "./permission.route";
import userRoutes from "./user.route";
import inventoryMovementRoutes from "./inventoryMovement.route";
import ticketRoutes from "./ticket.route";
import customerRoutes from "./customer.route";
import dashboardRoutes from "./dashboard.route";
import notificationRoutes from "./notification.route";

const router = express.Router();

router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/courier-trackings", courierTrackingRoutes);
// router.use("/installation-requests", installationRequestRoutes);
router.use("/inventory-items", inventoryItemRoutes);
router.use("/inventory-types", inventoryTypeRoutes);
router.use("/inventory-movements", inventoryMovementRoutes);
router.use("/tickets", ticketRoutes);
router.use("/customers", customerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);

export default router;

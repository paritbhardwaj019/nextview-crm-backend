import express from "express";
import roleRoutes from "./role.route";
import authRoutes from "./auth.route";
import courierTrackingRoutes from "./courierTracking.route";
import installationRequestRoutes from "./installationRequest.route";
import inventoryItemRoutes from "./inventoryItem.route";
import inventoryTypeRoutes from "./inventoryType.route";

const router = express.Router();

/**
 * @route /roles
 * @desc Routes for role-related operations
 * @access Protected
 */
router.use("/roles", roleRoutes);

/**
 * @route /auth
 * @desc Routes for authentication operations
 * @access Public
 */
router.use("/auth", authRoutes);

router.use("/courier-trackings", courierTrackingRoutes);
router.use("/installation-requests", installationRequestRoutes);
router.use("/inventory-items", inventoryItemRoutes);
router.use("/inventory-types", inventoryTypeRoutes);

export default router;

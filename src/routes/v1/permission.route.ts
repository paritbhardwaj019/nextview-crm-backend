import express from "express";
import permissionController from "../../controllers/permission.controller";
import { checkJWT } from "../../middlewares/checkJWT";
import { checkPermission } from "../../middlewares/checkPermission";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";

const router = express.Router();

/**
 * @route GET /permissions
 * @desc Retrieve all permissions
 * @access Public (or Protected, depending on your authentication setup)
 */
router.get(
  "/",
  checkJWT,
  checkPermission(RESOURCES.ROLES, ACTIONS.VIEW),
  permissionController.getAllPermissions
);

export default router;

import roleController from "../../controllers/role.controller";
import express from "express";
import { checkJWT } from "../../middlewares/checkJWT";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";
import { checkPermission } from "../../middlewares/checkPermission";

const router = express.Router();

/**
 * @route GET /roles
 * @desc Query roles with pagination, sorting, and searching
 * @route POST /roles
 * @desc Create a new role
 */
router
  .route("/")
  .get(
    checkJWT,
    checkPermission(RESOURCES.ROLES, ACTIONS.VIEW),
    roleController.queryRolesHandler
  )
  .post(
    checkJWT,
    checkPermission(RESOURCES.ROLES, ACTIONS.CREATE),
    roleController.createRoleHandler
  );

/**
 * @route PUT /roles/:id
 * @desc Update an existing role by ID
 * @route GET /roles/:id
 * @desc Get a specific role by ID
 * @route DELETE /roles/:id
 * @desc Delete a role by ID
 */
router
  .route("/:id")
  .put(
    checkJWT,
    checkPermission(RESOURCES.ROLES, ACTIONS.EDIT),
    roleController.updateRoleHandler
  )
  .get(
    checkJWT,
    checkPermission(RESOURCES.ROLES, ACTIONS.VIEW),
    roleController.getRoleByIdHandler
  )
  .delete(
    checkJWT,
    checkPermission(RESOURCES.ROLES, ACTIONS.DELETE),
    roleController.deleteRoleHandler
  );

export default router;

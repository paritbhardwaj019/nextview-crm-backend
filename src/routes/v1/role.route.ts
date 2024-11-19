import roleController from "../../controllers/role.controller";
import express from "express";

const router = express.Router();

/**
 * @route GET /roles
 * @desc Query roles with pagination, sorting, and searching
 * @route POST /roles
 * @desc Create a new role
 */
router
  .route("/")
  .get(roleController.queryRolesHandler)
  .post(roleController.createRoleHandler);

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
  .put(roleController.updateRoleHandler)
  .get(roleController.getRoleByIdHandler)
  .delete(roleController.deleteRoleHandler);

export default router;

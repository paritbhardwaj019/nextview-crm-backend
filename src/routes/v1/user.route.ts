import express from "express";
import userController from "../../controllers/user.controller";
import { checkJWT } from "../../middlewares/checkJWT";
import { checkPermission } from "../../middlewares/checkPermission";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";

const router = express.Router();

/**
 * @route GET /users/options
 * @desc Get user options for dropdowns or selections
 * @access Protected
 */
router.get(
  "/options",
  checkJWT,
  checkPermission(RESOURCES.USERS, ACTIONS.VIEW),
  userController.getUsersOptionsHandler
);

/**
 * @route GET /users
 * @desc Query users with pagination, sorting, and searching
 * @access Protected
 * @route DELETE /users
 * @desc Delete multiple users
 * @access Protected
 */
router
  .route("/")
  .post(
    checkJWT,
    checkPermission(RESOURCES.USERS, ACTIONS.CREATE),
    userController.addUser
  )
  .get(
    checkJWT,
    checkPermission(RESOURCES.USERS, ACTIONS.VIEW),
    userController.queryUsersHandler
  )
  .delete(userController.deleteMultipleUsersHandler);

/**
 * @route GET /users/:id
 * @desc Get a user by ID
 * @access Protected
 * @route PUT /users/:id
 * @desc Update a user by ID
 * @access Protected
 * @route DELETE /users/:id
 * @desc Delete a user by ID
 * @access Protected
 */
router
  .route("/:id")
  .get(
    checkJWT,
    checkPermission(RESOURCES.USERS, ACTIONS.VIEW),
    userController.getUserByIdHandler
  )
  .put(
    checkJWT,
    checkPermission(RESOURCES.USERS, ACTIONS.EDIT),
    userController.updateUserHandler
  )
  .delete(
    checkJWT,
    checkPermission(RESOURCES.USERS, ACTIONS.DELETE),
    userController.deleteUserByIdHandler
  );

export default router;

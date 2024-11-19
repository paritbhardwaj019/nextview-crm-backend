import express from "express";
import userController from "../../controllers/user.controller";

const router = express.Router();

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
  .get(userController.queryUsersHandler)
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
  .get(userController.getUserByIdHandler)
  .put(userController.updateUserHandler)
  .delete(userController.deleteUserByIdHandler);

export default router;

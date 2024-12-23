import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service";
import { UpdateUserDTO } from "../types";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class UserController {
  /**
   * Handle querying users with pagination, sorting, and searching.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  queryUsersHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const filter = req.query as any;
      const users = await userService.queryUsers(filter);
      res.status(httpStatus.OK).json(users);
    }
  );

  /**
   * Handle updating an existing user by ID.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  updateUserHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.id;
      const data: UpdateUserDTO = req.body;
      const user = await userService.updateUser(id, data);
      res.status(httpStatus.OK).json(user);
    }
  );

  /**
   * Handle retrieving a user by ID.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getUserByIdHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.id;
      const user = await userService.getUserById(id);
      res.status(httpStatus.OK).json(user);
    }
  );

  /**
   * Handle deleting a user by ID.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  deleteUserByIdHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.id;
      await userService.deleteUserById(id);
      res.status(httpStatus.NO_CONTENT).send();
    }
  );

  /**
   * Handle deleting multiple users.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  deleteMultipleUsersHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const ids: string[] = req.body.ids;
      await userService.deleteMultipleUsers(ids);
      res.status(httpStatus.NO_CONTENT).send();
    }
  );

  /**
   * Handle retrieving user options for dropdowns or selections.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getUsersOptionsHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const options = await userService.getUserOptions();
      res.status(httpStatus.OK).json(options);
    }
  );

  addUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await userService.addUserHandler(req.body);
      res.status(httpStatus.CREATED).json(result);
    }
  );
}

export default new UserController();

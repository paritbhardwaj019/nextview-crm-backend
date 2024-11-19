import { Request, Response, NextFunction } from "express";
import UserService from "../services/user.service";
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
      const users = await UserService.queryUsers(filter);
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
      const user = await UserService.updateUser(id, data);
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
      const user = await UserService.getUserById(id);
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
      await UserService.deleteUserById(id);
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
      await UserService.deleteMultipleUsers(ids);
      res.status(httpStatus.NO_CONTENT).send();
    }
  );
}

export default new UserController();

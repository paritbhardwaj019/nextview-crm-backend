import { Request, Response, NextFunction } from "express";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";
import permissionService from "../services/permission.service";

class PermissionController {
  /**
   * Handle request to get all permissions
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getAllPermissions = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const permissions = await permissionService.getAllPermissions();
      res.status(httpStatus.OK).send(permissions);
    }
  );
}

export default new PermissionController();

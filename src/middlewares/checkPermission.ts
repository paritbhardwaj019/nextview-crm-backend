import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { ResourceType } from "../config/resources";
import { ActionType } from "../config/actions";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";

export const checkPermission = (resource: ResourceType, action: ActionType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
      }

      const user = await User.findById(req.user.id).populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.FORBIDDEN, "User not found");
      }

      const userRole = user.role as any;
      const hasPermission = userRole.permissions.some(
        (permission: any) =>
          permission.resource === resource && permission.action === action
      );

      if (!hasPermission) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Forbidden: Insufficient permissions"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

import { NextFunction, Request, Response } from "express";
import { Role } from "../models/role.model";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";

export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const role = await Role.findById(user?.role).populate("permissions");

      if (!role) throw new ApiError(httpStatus.NOT_FOUND, "Role not found");

      const hasPermission = role.permissions.some(
        (el) => el.resource === resource && el.action === action
      );

      if (!hasPermission)
        throw new ApiError(httpStatus.FORBIDDEN, "Insufficient permissions");

      next();
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Couldn't check permissions"
      );
    }
  };
};

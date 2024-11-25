import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { IUser } from "../types";

interface JWTPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const checkJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "User not found"));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Invalid token"));
    }
    next(error);
  }
};

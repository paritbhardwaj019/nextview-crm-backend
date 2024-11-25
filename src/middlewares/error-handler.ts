import { Request, Response, NextFunction } from "express";
import { AppError, ApiError } from "../types";
import logger from "../config/logger";

const errorHandler = (
  err: Error | AppError | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let status = "error";
  let message = "Internal Server Error";
  let stack: string | undefined;

  logger.error(err);

  if ("statusCode" in err) {
    statusCode = err.statusCode;
  }

  if ("status" in err) {
    status = err.status;
  }

  if (err instanceof Error) {
    message = err.message;
    stack = err.stack;
  }

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    status = "fail";
    message = err.message;
  }

  const response: {
    status: string;
    message: string;
    stack?: string;
  } = {
    status,
    message,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;

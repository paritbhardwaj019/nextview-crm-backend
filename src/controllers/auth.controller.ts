import { Request, Response, NextFunction } from "express";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";
import authService from "../services/auth.service";

class AuthController {
  /**
   * Handle user login, providing JWT on successful authentication
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */

  loginHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;
      const result = await authService.loginHandler(email, password);
      res.status(httpStatus.OK).json(result);
    }
  );
}

export default new AuthController();

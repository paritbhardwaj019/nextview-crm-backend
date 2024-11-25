import { User } from "../models/user.model";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import jwt from "jsonwebtoken";
import config from "../config/config";

class AuthService {
  /**
   * Authenticate user by email and password, updating last login date on success
   * @param email - User's email
   * @param password - User's password
   * @returns Authenticated user data and token
   */

  async loginHandler(email: string, password: string) {
    const user = await User.findOne({ email }).populate({
      path: "role",
      select: "name",
    });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password");
    }

    user.lastLogin = new Date();
    user.status = "ACTIVE";

    await user.save();

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        lastLogin: user.lastLogin,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Private method to generate JWT token
   * @param id - The ID of the user for whom the token is generated
   * @returns The generated JWT token
   */

  private generateToken(id: string): string {
    return jwt.sign({ id }, config.jwtSecret, {
      expiresIn: "3d",
    });
  }
}

export default new AuthService();

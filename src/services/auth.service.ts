import { User } from "../models/user.model";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import jwt from "jsonwebtoken";
import config from "../config/config";
import emailService from "./email.service";
import crypto from "crypto";

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

  /**
   * Handle forgot password request
   * @param email - User's email address
   */
  async forgotPasswordHandler(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    await emailService.sendEmail(
      email,
      "Password Reset Request",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>You requested a password reset. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
        </div>
      `
    );

    return { message: "Reset password email sent" };
  }

  /**
   * Reset password with token
   * @param token - Reset password token
   * @param newPassword - New password
   */

  async resetPasswordHandler(token: string, newPassword: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid or expired reset token"
      );
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: "Password reset successful" };
  }
}

export default new AuthService();

const AuthService = require("../services/auth.service");
const ActivityLogService =
  require("../services/logging.service").ActivityLogService;
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const User = require("../models/user.model");

class AuthController {
  /**
   * Login user
   * @route POST /api/auth/login
   * @access Public
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    await ActivityLogService.logActivity({
      userId: result.user.id,
      action: "USER_LOGIN",
      details: "User logged in successfully",
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Login successful", result);
  });

  /**
   * Create initial Super Admin
   * @route POST /api/auth/seed-admin
   * @access Public
   */
  static seedSuperAdmin = asyncHandler(async (req, res) => {
    const { email, name, password, secretKey } = req.body;

    if (secretKey !== process.env.SEED_SECRET_KEY) {
      throw ApiError.forbidden("Invalid secret key");
    }

    const user = await AuthService.seedSuperAdmin(email, name, password);

    await ActivityLogService.logActivity({
      userId: user.id,
      action: "SUPER_ADMIN_CREATED",
      details: "Initial Super Admin account created",
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, "Super Admin created successfully", {
      user,
    });
  });

  /**
   * Request password reset
   * @route POST /api/auth/forgot-password
   * @access Public
   */
  static forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    await AuthService.resetPassword(email);

    return ApiResponse.success(res, "Password reset email sent successfully");
  });

  /**
   * Reset password with token
   * @route POST /api/auth/reset-password
   * @access Public
   */
  static resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    await AuthService.setNewPassword(token, password);

    return ApiResponse.success(res, "Password has been reset successfully");
  });

  /**
   * Verify reset token
   * @route GET /api/auth/verify-reset-token/:token
   * @access Public
   */
  static verifyResetToken = asyncHandler(async (req, res) => {
    const { token } = req.params;

    await AuthService.verifyResetToken(token);

    return ApiResponse.success(res, "Reset token is valid");
  });

  /**
   * Change user password
   * @route POST /api/auth/change-password
   * @access Private
   */
  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    await AuthService.changePassword(userId, currentPassword, newPassword);

    await ActivityLogService.logActivity({
      userId: userId,
      action: "PASSWORD_CHANGED",
      details: "User changed their password",
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Password changed successfully");
  });

  /**
   * Verify token and get user info
   * @route GET /api/auth/verify
   * @access Private
   */
  static verifyToken = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return ApiResponse.success(res, "Token verified successfully", {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  /**
   * Logout user
   * @route POST /api/auth/logout
   * @access Private
   */
  static logout = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });

    await ActivityLogService.logActivity({
      userId,
      action: "USER_LOGOUT",
      details: "User logged out",
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Logout successful");
  });
}

module.exports = AuthController;

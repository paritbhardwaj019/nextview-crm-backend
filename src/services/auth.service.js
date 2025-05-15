const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const { sendEmail } = require("./notification.service");
const ApiError = require("../utils/apiError.util");
const config = require("../config/config");
const { ROLES, isRoleAuthorized } = require("../config/roles");
const Role = require("../models/role.model");

class AuthService {
  static async login(email, password) {
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const role = await Role.findOne({ code: user.role });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    return {
      token: this.generateToken(user),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: role ?? user.role,
      },
    };
  }

  static generateToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  static async seedSuperAdmin(email, name, password) {
    const existingAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });

    if (existingAdmin) {
      throw ApiError.conflict("Super Admin already exists");
    }

    const user = await User.create({
      email,
      name,
      password,
      role: ROLES.SUPER_ADMIN,
    });

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      const user = await User.findOne({
        _id: decoded.id,
        isActive: true,
      });

      if (!user) {
        throw ApiError.unauthorized("User not found or inactive");
      }

      return {
        id: user._id,
        role: user.role,
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Token expired");
      }
      throw ApiError.unauthorized("Invalid token");
    }
  }

  static async resetPassword(email) {
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const resetUrl = `${config.app.frontendUrl}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: `You are receiving this because you (or someone else) has requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${resetUrl}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    });

    return true;
  }

  static async verifyResetToken(token) {
    console.log("TOKEN @auth.service.js", token);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest(
        "Password reset token is invalid or has expired"
      );
    }

    return user;
  }

  static async setNewPassword(token, newPassword) {
    const user = await this.verifyResetToken(token);

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return true;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw ApiError.badRequest("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return true;
  }

  static async checkRolePermission(userId, requiredRole) {
    const user = await User.findById(userId);

    if (!user) {
      return false;
    }

    return isRoleAuthorized(user.role, requiredRole);
  }
}

module.exports = AuthService;

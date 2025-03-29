const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const { sendEmail } = require("./notification.service");
const ApiError = require("../utils/apiError.util");
const config = require("../config/config");
const { ROLES, isRoleAuthorized } = require("../config/roles");

class AuthService {
  static async login(email, password) {
    console.log("EMAIL", email);
    console.log("PASSWORD", password);

    const user = await User.findOne({ email, isActive: true });

    console.log("USER", user);

    if (!user) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    return {
      token: this.generateToken(user),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
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

    const tempPassword = crypto.randomBytes(8).toString("hex");

    user.password = tempPassword;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      text: `Your temporary password is: ${tempPassword}. Please change it after logging in.`,
    });

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

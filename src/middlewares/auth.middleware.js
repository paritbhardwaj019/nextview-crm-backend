const AuthService = require("../services/auth.service");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const { hasPermission } = require("../config/roles");
const User = require("../models/user.model");

class AuthMiddleware {
  static authenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Authentication required");
    }

    const token = authHeader.split(" ")[1];

    const user = await AuthService.verifyToken(token);

    req.user = user;

    next();
  });

  static authorize(role) {
    return asyncHandler(async (req, res, next) => {
      const hasRole = await AuthService.checkRolePermission(req.user.id, role);

      if (!hasRole) {
        throw ApiError.forbidden("Insufficient permissions");
      }

      next();
    });
  }

  static requirePermission(permission) {
    return asyncHandler(async (req, res, next) => {
      const user = await User.findById(req.user.id);

      if (!user) {
        throw ApiError.unauthorized("User not found");
      }

      if (!hasPermission(user.role, permission)) {
        throw ApiError.forbidden("Insufficient permissions");
      }

      next();
    });
  }
}

module.exports = AuthMiddleware;

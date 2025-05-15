const AuthService = require("../services/auth.service");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const { hasPermission } = require("../config/permissions");
const Role = require("../models/role.model");
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

  static requirePermission(...permissions) {
    return asyncHandler(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id);

        if (!user) {
          throw ApiError.unauthorized("User not found");
        }

        if (user.role === "SUPER_ADMIN") {
          return next();
        }

        const userRole = await Role.findOne({ code: user.role });

        if (!userRole) {
          throw ApiError.forbidden(`Role not found: ${user.role}`);
        }

        const hasAnyPermission = permissions.some((permission) =>
          hasPermission(userRole.permissions, permission)
        );

        if (!hasAnyPermission) {
          throw ApiError.forbidden(
            `Insufficient permissions: One of [${permissions.join(", ")}] is required`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  }
}

module.exports = AuthMiddleware;

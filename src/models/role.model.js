const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - permissions
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the role
 *         name:
 *           type: string
 *           description: Display name of the role
 *         code:
 *           type: string
 *           description: Unique code identifier for the role
 *         description:
 *           type: string
 *           description: Description of the role and its responsibilities
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: List of permission codes assigned to this role
 *         isDefault:
 *           type: boolean
 *           description: Whether this is a system default role that cannot be deleted
 *         createdBy:
 *           type: string
 *           description: User ID who created this role
 *         updatedBy:
 *           type: string
 *           description: User ID who last updated this role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when role was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when role was last updated
 */
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Role code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

roleSchema.index({ code: 1 }, { unique: true });
roleSchema.index({ isDefault: 1 });

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(roleSchema);

roleSchema.statics.createDefaultRoles = async function () {
  const defaultRoles = [
    {
      name: "Super Admin",
      code: "SUPER_ADMIN",
      description: "Full system access with all permissions",
      permissions: [], // Will be populated with all permissions
      isDefault: true,
    },
    {
      name: "Support Manager",
      code: "SUPPORT_MANAGER",
      description: "Manages support tickets and engineers",
      permissions: [], // Will be populated based on ROLE_PERMISSIONS
      isDefault: true,
    },
    {
      name: "Engineer",
      code: "ENGINEER",
      description: "Handles technical support and installations",
      permissions: [], // Will be populated based on ROLE_PERMISSIONS
      isDefault: true,
    },
    {
      name: "Inventory Manager",
      code: "INVENTORY_MANAGER",
      description: "Manages inventory and stock levels",
      permissions: [], // Will be populated based on ROLE_PERMISSIONS
      isDefault: true,
    },
    {
      name: "Dispatch Manager",
      code: "DISPATCH_MANAGER",
      description: "Manages shipping and deliveries",
      permissions: [], // Will be populated based on ROLE_PERMISSIONS
      isDefault: true,
    },
  ];

  const permissionModule = require("../config/permissions");
  const allPermissions = Object.values(permissionModule.PERMISSIONS);

  const rolePermissions = permissionModule.ROLE_PERMISSIONS;

  for (const role of defaultRoles) {
    if (role.code === "SUPER_ADMIN") {
      role.permissions = allPermissions;
    } else {
      role.permissions = rolePermissions[role.code] || [];
    }

    await this.findOneAndUpdate(
      { code: role.code },
      { $setOnInsert: role },
      { upsert: true, new: true }
    );
  }

  console.log("Default roles created successfully");
};

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;

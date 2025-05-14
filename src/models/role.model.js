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
 *         allowedTicketTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: List of allowed ticket types for this role
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
    allowedTicketTypes: {
      type: [String],
      default: [],
      enum: [
        "SERVICE",
        "INSTALLATION",
        "CHARGEABLE",
        "IN_WARRANTY",
        "OUT_OF_WARRANTY",
        "REPAIR",
        "MAINTENANCE",
        "COMPLAINT",
        "DISPATCH",
      ],
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
      permissions: [],
      allowedTicketTypes: [
        "SERVICE",
        "INSTALLATION",
        "CHARGEABLE",
        "IN_WARRANTY",
        "OUT_OF_WARRANTY",
        "COMPLAINT",
        "DISPATCH",
      ],
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

    const existingRole = await this.findOne({ code: role.code });

    if (existingRole) {
      let needsUpdate = false;

      // For Super Admin, ensure it has all permissions
      if (role.code === "SUPER_ADMIN") {
        const missingPermissions = allPermissions.filter(
          (permission) => !existingRole.permissions.includes(permission)
        );
        if (missingPermissions.length > 0) {
          console.log(
            `Adding new permissions to Super Admin:`,
            missingPermissions
          );
          existingRole.permissions = [
            ...new Set([...existingRole.permissions, ...missingPermissions]),
          ];
          needsUpdate = true;
        }
      } else {
        // For other roles, check for new permissions from ROLE_PERMISSIONS
        const newPermissions = role.permissions.filter(
          (permission) => !existingRole.permissions.includes(permission)
        );
        if (newPermissions.length > 0) {
          console.log(
            `Adding new permissions to ${role.name}:`,
            newPermissions
          );
          existingRole.permissions = [
            ...new Set([...existingRole.permissions, ...newPermissions]),
          ];
          needsUpdate = true;
        }
      }

      // Check for allowedTicketTypes updates
      if (
        JSON.stringify(existingRole.allowedTicketTypes) !==
        JSON.stringify(role.allowedTicketTypes)
      ) {
        console.log(`Updating allowedTicketTypes for ${role.name}`);
        existingRole.allowedTicketTypes = role.allowedTicketTypes;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await existingRole.save();
      }
    } else {
      await this.create(role);
    }
  }

  console.log("Default roles created/updated successfully");
};

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;

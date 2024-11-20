import inquirer from "inquirer";
import mongoose from "mongoose";
import { IRole, IPermission, IUser } from "../types";
import { User } from "../models/user.model";
import logger from "../config/logger";
import colors from "colors";
import { Role } from "../models/role.model";
import config from "../config/config";
import { ACTIONS, ActionType } from "../config/actions";
import { ResourceType, RESOURCES } from "../config/resources";
import { Permission } from "../models/permission.model";

const generatePermissions = () => {
  const permissions: { resource: string; action: string }[] = [];

  Object.values(RESOURCES).forEach((resource) => {
    Object.values(ACTIONS).forEach((action) => {
      permissions.push({
        resource: resource,
        action: action,
      });
    });
  });

  return permissions;
};

const seedPermissions = async () => {
  try {
    const permissions = generatePermissions();
    await Permission.deleteMany({});
    const createdPermissions = await Permission.insertMany(permissions);

    const permissionIds = createdPermissions.map((perm) => perm._id);

    logger.info(colors.yellow(`Generated ${permissions.length} permissions`));
    return permissionIds;
  } catch (error) {
    throw error;
  }
};

const createAdminRole = async (
  permissionIds: mongoose.Types.ObjectId[]
): Promise<IRole> => {
  try {
    const adminRole = await Role.create({
      name: "Admin",
      description: "Super Administrator with all permissions",
      permissions: permissionIds,
    });

    logger.info(colors.green("Admin role created successfully"));
    return adminRole;
  } catch (error) {
    console.log(error);
    logger.error(colors.red("Error creating admin role:"));
    throw error;
  }
};

const createAdminUser = async (roleId: string, data: any): Promise<IUser> => {
  try {
    const user = new User({
      name: data.name,
      email: data.email,
      role: roleId,
      status: "ACTIVE",
      password: data.password,
    });

    await user.save();

    logger.info(colors.green("Admin user created successfully"));
    return user;
  } catch (error) {
    console.log(error);
    logger.error(colors.red("Error creating admin user:"));
    throw error;
  }
};

const main = async () => {
  try {
    const data = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Enter Admin Email -",
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            return "Please enter a valid email address.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "name",
        message: "Enter Admin Name -",
        validate: (input) => {
          if (input.trim() === "") {
            return "Name cannot be empty.";
          }
          return true;
        },
      },
      {
        type: "password",
        name: "password",
        message: "Enter Admin Password -",
        validate: (input) => {
          if (input.length < 8) {
            return "Password must be at least 8 characters long.";
          }
          return true;
        },
      },
    ]);

    const { email, name, password } = data;

    await mongoose.connect(config.mongoose.url);
    logger.info(colors.cyan("Connected to MongoDB"));

    const permissions = await seedPermissions();
    const adminRole = await createAdminRole(permissions);

    if (adminRole.id) {
      await createAdminUser(adminRole?.id, {
        name,
        email,
        password,
      });

      logger.info(colors.green("\nSeeding completed successfully!"));
      await mongoose.disconnect();
      logger.info(colors.yellow("\nDisconnected from MongoDB"));
    }
  } catch (error) {
    process.exit(1);
  }
};

main();

#!/usr/bin/env node

/**
 * Script to seed the database with an initial Super Admin user
 * Run with: npm run seed:superadmin
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const inquirer = require("inquirer").default;
const { ROLES } = require("../config/roles");
const config = require("../config/config");

mongoose
  .connect(config.db.uri)
  .then(() => {
    console.log("Connected to MongoDB");
    seedSuperAdmin();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/**
 * Load User model dynamically to avoid circular dependency issues
 */
const loadUserModel = () => {
  try {
    return require("../models/user.model");
  } catch (error) {
    console.error("Error loading User model:", error);
    process.exit(1);
  }
};

/**
 * Check if a Super Admin already exists
 */
const checkSuperAdminExists = async () => {
  const User = loadUserModel();
  const superAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });
  return !!superAdmin;
};

/**
 * Seed the database with a Super Admin user
 */
const seedSuperAdmin = async () => {
  try {
    const superAdminExists = await checkSuperAdminExists();

    if (superAdminExists) {
      console.log(
        "\x1b[33mWarning: A Super Admin already exists in the database.\x1b[0m"
      );

      const { createAnother } = await inquirer.prompt([
        {
          type: "confirm",
          name: "createAnother",
          message: "Do you want to create another Super Admin?",
          default: false,
        },
      ]);

      if (!createAnother) {
        console.log("\x1b[34mOperation cancelled. Exiting...\x1b[0m");
        mongoose.disconnect();
        return;
      }
    }

    await promptAndCreateSuperAdmin();
  } catch (error) {
    console.error("\x1b[31mError seeding Super Admin:\x1b[0m", error);
    mongoose.disconnect();
    process.exit(1);
  }
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) || "Please enter a valid email address";
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  // Check for password complexity - at least one uppercase, one lowercase, one number, one special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
  }

  return true;
};

/**
 * Prompt for Super Admin details and create user
 */
const promptAndCreateSuperAdmin = async () => {
  try {
    // Store password separately to use for validation
    let adminPassword = "";

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Enter Super Admin email:",
        validate: validateEmail,
      },
      {
        type: "input",
        name: "name",
        message: "Enter Super Admin name:",
        validate: (name) =>
          name.length >= 2 || "Name must be at least 2 characters long",
      },
      {
        type: "password",
        name: "password",
        message: "Enter Super Admin password:",
        mask: "*",
        validate: validatePassword,
        // Store the password in our variable when it's entered
        filter: (input) => {
          adminPassword = input;
          return input;
        },
      },
      {
        type: "password",
        name: "confirmPassword",
        message: "Confirm password:",
        mask: "*",
        validate: (input) =>
          input === adminPassword || "Passwords do not match",
      },
    ]);

    const User = loadUserModel();
    const hashedPassword = await bcrypt.hash(answers.password, 10);

    const superAdmin = new User({
      email: answers.email,
      name: answers.name,
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      lastLogin: null,
    });

    await superAdmin.save();

    console.log("\x1b[32m\nSuper Admin created successfully:\x1b[0m");
    console.log({
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
    });

    mongoose.disconnect();
  } catch (error) {
    console.error("\x1b[31mError creating Super Admin:\x1b[0m", error);
    mongoose.disconnect();
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  mongoose.disconnect();
  process.exit(0);
});

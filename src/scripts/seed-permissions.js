const mongoose = require("mongoose");
const { PERMISSIONS } = require("../config/permissions");
const Role = require("../models/role.model");
require("dotenv").config();

async function seedPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Get all roles
    const roles = await Role.find({});

    // For each role, check and add any missing permissions
    for (const role of roles) {
      const currentPermissions = role.permissions || [];
      const allPermissions = Object.values(PERMISSIONS);

      // Find missing permissions
      const missingPermissions = allPermissions.filter(
        (permission) => !currentPermissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        console.log(
          `Adding ${missingPermissions.length} missing permissions to role: ${role.name}`
        );
        role.permissions = [
          ...new Set([...currentPermissions, ...missingPermissions]),
        ];
        await role.save();
      }
    }

    console.log("Permission seeding completed successfully");
  } catch (error) {
    console.error("Error seeding permissions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seed function
seedPermissions();

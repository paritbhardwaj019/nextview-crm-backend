const mongoose = require("mongoose");
const Role = require("../models/role.model");
require("dotenv").config();

const DISPATCH_PERMISSIONS = [
  "create_dispatch",
  "update_dispatch",
  "view_dispatch",
  "manage_shipments",
  "track_delivery",
];

async function removeDispatchPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Find the super admin role
    const superAdmin = await Role.findOne({ code: "SUPER_ADMIN" });

    if (!superAdmin) {
      console.log("Super Admin role not found");
      return;
    }

    // Remove dispatch permissions
    const updatedPermissions = superAdmin.permissions.filter(
      (permission) => !DISPATCH_PERMISSIONS.includes(permission)
    );

    // Update the role
    superAdmin.permissions = updatedPermissions;
    await superAdmin.save();

    console.log(
      "Successfully removed dispatch permissions from Super Admin role"
    );
  } catch (error) {
    console.error("Error removing dispatch permissions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the function
removeDispatchPermissions();

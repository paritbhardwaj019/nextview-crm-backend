const app = require("./src/app");
const config = require("./src/config/config");
const mongoose = require("mongoose");
const TicketSettings = require("./src/models/ticketSettings.model");
const Role = require("./src/models/role.model");

const PORT = config.app.port;

// Default values for ticket settings
const DEFAULT_SETTINGS = {
  autoApproval: false,
  autoApprovalRoles: [],
  defaultAssignToSupportManager: false,
  defaultDueDateDays: 7,
  priorityDueDates: {
    LOW: 10,
    MEDIUM: 7,
    HIGH: 3,
    CRITICAL: 1,
  },
  notifyOnStatusChange: true,
  allowReopenClosedTickets: true,
  reopenWindowDays: 30,
};

// Seed function for ticket settings
const seedTicketSettings = async () => {
  try {
    console.log("Checking ticket settings...");
    let existingSettings = await TicketSettings.findOne();

    if (!existingSettings) {
      console.log("No ticket settings found. Creating default settings...");

      // Create default ticket settings
      existingSettings = await TicketSettings.create(DEFAULT_SETTINGS);
      console.log("Default ticket settings created successfully!");
    } else {
      console.log(
        "Ticket settings found. Verifying all required fields are present..."
      );

      let needsUpdate = false;

      // Check if priorityDueDates exists and has all required values
      if (
        !existingSettings.priorityDueDates ||
        typeof existingSettings.priorityDueDates !== "object"
      ) {
        existingSettings.priorityDueDates = {
          ...DEFAULT_SETTINGS.priorityDueDates,
        };
        needsUpdate = true;
      } else {
        const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        for (const priority of priorities) {
          if (existingSettings.priorityDueDates[priority] === undefined) {
            existingSettings.priorityDueDates[priority] =
              DEFAULT_SETTINGS.priorityDueDates[priority];
            needsUpdate = true;
          }
        }
      }

      // Check other essential fields
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (key !== "priorityDueDates" && existingSettings[key] === undefined) {
          existingSettings[key] = value;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        console.log("Updating ticket settings with missing default values...");
        await existingSettings.save();
        console.log("Ticket settings updated successfully!");
      } else {
        console.log("Ticket settings are complete. No updates needed.");
      }
    }
  } catch (error) {
    console.error("Error seeding ticket settings:", error);
  }
};

const seedDefaultRoles = async () => {
  try {
    console.log("Initializing default roles...");

    const existingRolesCount = await Role.countDocuments();

    if (existingRolesCount === 0) {
      console.log("No roles found. Creating default roles...");
      await Role.createDefaultRoles();
      console.log("Default roles created successfully!");
    } else {
      console.log(
        `Found ${existingRolesCount} existing roles. Skipping default role creation.`
      );
    }
  } catch (error) {
    console.error("Error seeding default roles:", error);
  }
};

mongoose
  .connect(config.db.uri, config.db.options)
  .then(async () => {
    console.log("Connected to MongoDB");

    await seedTicketSettings();
    await seedDefaultRoles();

    // Start server after seeding
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${config.app.env} mode on port ${PORT}`);
    });

    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! Shutting down...");
      console.error(err.name, err.message);
      console.error(err.stack);

      server.close(() => {
        process.exit(1);
      });
    });

    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION! Shutting down...");
      console.error(err.name, err.message);
      console.error(err.stack);

      process.exit(1);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully");

      server.close(() => {
        console.log("Process terminated");
      });
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

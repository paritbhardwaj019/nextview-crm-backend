const app = require("./src/app");
const config = require("./src/config/config");

const PORT = config.app.port;

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

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const config = require("./config/config");
const swaggerDocs = require("./config/swagger");
const errorMiddleware = require("./middlewares/error.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const ticketRoutes = require("./routes/ticket.routes");
const ticketSettingsRoutes = require("./routes/ticketSettings.routes");
const itemRoutes = require("./routes/item.routes");
const problemRoutes = require("./routes/problem.routes");
const roleRoutes = require("./routes/role.routes");
const customerRoutes = require("./routes/customer.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const loggingRoutes = require("./routes/logging.routes");
// const installationRoutes = require("./routes/installationRoutes");
// const itemRoutes = require("./routes/itemRoutes");
// const settingsRoutes = require("./routes/settingsRoutes");
// const logRoutes = require("./routes/logRoutes");

const app = express();

mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.app.env === "development" ? "dev" : "combined"));

app.use(`${config.app.apiPrefix}/auth`, authRoutes);
app.use(`${config.app.apiPrefix}/users`, userRoutes);
app.use(`${config.app.apiPrefix}/tickets`, ticketRoutes);
app.use(`${config.app.apiPrefix}/settings/tickets`, ticketSettingsRoutes);
app.use(`${config.app.apiPrefix}/items`, itemRoutes);
app.use(`${config.app.apiPrefix}/problems`, problemRoutes);
app.use(`${config.app.apiPrefix}/roles`, roleRoutes);
app.use(`${config.app.apiPrefix}/customers`, customerRoutes);
app.use(`${config.app.apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${config.app.apiPrefix}/logs`, loggingRoutes);
// app.use(`${apiPrefix}/installation-requests`, installationRoutes);
// app.use(`${apiPrefix}/items`, itemRoutes);
// app.use(`${apiPrefix}/settings`, settingsRoutes);
// app.use(`${apiPrefix}/logs`, logRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    environment: config.app.env,
    timestamp: new Date(),
  });
});

app.use(errorMiddleware);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

module.exports = app;

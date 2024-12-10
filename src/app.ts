import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cron from "node-cron";
import routes from "./routes/v1";
import errorHandler from "./middlewares/error-handler";
import ApiError from "./utils/ApiError";
import inventoryItemService from "./services/inventoryItem.service";
import logger from "./config/logger";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(hpp());

const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again in 15 minutes!",
});

app.use("/api", limiter);
app.use("/api/v1", routes);
app.use(errorHandler);

cron.schedule("0 0 * * *", async () => {
  try {
    logger.info("Starting scheduled maintenance check");
    await inventoryItemService.scheduledMaintenanceCheck();
    logger.info("Completed scheduled maintenance check");
  } catch (error) {
    logger.error("Error in scheduled maintenance check:", error);
  }
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

app.use(errorHandler);

const initializeScheduledTasks = () => {
  inventoryItemService
    .scheduledMaintenanceCheck()
    .then(() => logger.info("Initial maintenance check completed"))
    .catch((error) =>
      logger.error("Error in initial maintenance check:", error)
    );
};

initializeScheduledTasks();

export default app;

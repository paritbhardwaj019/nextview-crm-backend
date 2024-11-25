import app from "./app";
import http from "http";
import config from "./config/config";
import logger from "./config/logger";
import mongoose from "./models";

const server = http.createServer(app);

async function main() {
  try {
    await mongoose.connect(config.mongoose.url);

    logger.info("Connected to MongoDB");

    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
}

main();

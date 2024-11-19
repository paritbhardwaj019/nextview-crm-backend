import app from "./app";
import http from "http";
import config from "./config/config";
import logger from "./config/logger";

const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info(`Server is running on ${config.port}`);
});

import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { createServer } from "./server.js";

const config = loadConfig(process.env);
const logger = createLogger("qunta-api");
const server = createServer(config);

server.listen(config.port, config.host, () => {
  logger.info(`Qunta API listening on ${config.host}:${config.port}`);
});

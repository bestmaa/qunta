import { loadGatewayConfig } from "./config.js";
import { createGatewayServer } from "./server.js";

const config = loadGatewayConfig(process.env);
const server = createGatewayServer(config);

server.listen(config.port, config.host, () => {
  console.info(
    JSON.stringify({
      level: "info",
      message: `Qunta gateway listening on ${config.host}:${config.port}`,
      scope: "qunta-llm-gateway",
      timestamp: new Date().toISOString()
    })
  );
});

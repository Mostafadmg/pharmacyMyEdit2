import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
const portValue = rawPort ?? "5000";
const port = Number(portValue);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${portValue}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

import app from "./app";
import { logger } from "./lib/logger";
import { ensureRequiredConditions } from "./bootstrap/ensureConditions";
import { ensureConsultationsSchema } from "./bootstrap/ensureConsultationsSchema";
import { ensurePatientIdentity } from "./bootstrap/ensurePatientIdentity";
import { ensureShopBasketDefaults } from "./bootstrap/ensureShopBasketDefaults";

const rawPort = process.env["PORT"];
const portValue = rawPort ?? "5000";
const port = Number(portValue);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${portValue}"`);
}

async function bootstrapDatabase(): Promise<void> {
  await ensureConsultationsSchema();
  await ensurePatientIdentity();
  await ensureRequiredConditions();
  await ensureShopBasketDefaults();
}

void bootstrapDatabase()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Database bootstrap failed — cannot start server");
    process.exit(1);
  });

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

/**
 * Imported TIP catalog products were seeded with requires_consultation=true for most
 * SKUs. Patient shop defaults to add-to-basket; pharmacists opt in via shop admin.
 */
export async function ensureShopBasketDefaults(): Promise<void> {
  const result = await db.execute(sql`
    UPDATE products
    SET requires_consultation = false,
        updated_at = NOW()
    WHERE requires_consultation = true
      AND (
        id LIKE 'tip-%'
        OR tags::text LIKE '%"tip-catalog"%'
      )
  `);
  const count = Number(result.rowCount ?? 0);
  if (count > 0) {
    logger.info({ count }, "Reset imported catalog products to add-to-basket");
  }
}

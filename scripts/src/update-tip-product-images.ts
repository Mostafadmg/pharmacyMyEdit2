/**
 * Update image_url for tip-* products from tip-product-images.json (no full reseed).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP = resolve(__dirname, "../../lib/db/src/data/tip-product-images.json");

void (async () => {
  if (!existsSync(MAP)) {
    console.error("Missing tip-product-images.json — run fetch-tip-product-images first");
    process.exit(1);
  }
  const map = JSON.parse(readFileSync(MAP, "utf8")) as Record<
    string,
    { imageUrl: string }
  >;
  let updated = 0;
  for (const [slug, entry] of Object.entries(map)) {
    if (!entry.imageUrl) continue;
    const id = `tip-${slug}`;
    await db
      .update(productsTable)
      .set({ imageUrl: entry.imageUrl, updatedAt: new Date() })
      .where(eq(productsTable.id, id));
    updated++;
  }
  console.log(`Updated imageUrl for ${updated} products`);
  process.exit(0);
})();

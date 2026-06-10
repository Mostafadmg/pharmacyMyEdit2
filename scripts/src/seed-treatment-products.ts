/**
 * Seed shop catalog from parsed Independent Pharmacy treatments export.
 * Run: npx tsx ./src/parse-tip-treatments.ts && npx tsx ./src/seed-treatment-products.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { parseTreatmentsMarkdown } from "./parse-tip-treatments";
import { writeProductCardSvg } from "./product-card-svg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_JSON = resolve(__dirname, "../../lib/db/src/data/tip-treatments.json");
const DATA_MD = resolve(
  __dirname,
  "../../lib/db/src/data/treatments-0.md",
);
const IMAGES_JSON = resolve(
  __dirname,
  "../../lib/db/src/data/tip-product-images.json",
);

type TipImageEntry = { imageUrl: string };

function loadTipImageMap(): Record<string, TipImageEntry> {
  if (!existsSync(IMAGES_JSON)) return {};
  return JSON.parse(readFileSync(IMAGES_JSON, "utf8")) as Record<
    string,
    TipImageEntry
  >;
}

function productImageUrl(
  slug: string,
  name: string,
  category: string,
  imageMap: Record<string, TipImageEntry>,
): string {
  const mapped = imageMap[slug]?.imageUrl;
  if (mapped && !mapped.startsWith("http")) return mapped;
  if (mapped?.startsWith("http")) return mapped;
  return writeProductCardSvg(slug, name, category);
}

function shortDescription(name: string, alt?: string): string {
  const base = alt?.trim() || name;
  return base.length > 160 ? `${base.slice(0, 157)}…` : base;
}

export async function seedTreatmentProducts(opts?: {
  replace?: boolean;
}): Promise<{ inserted: number; skipped: number; total: number }> {
  let items: ReturnType<typeof parseTreatmentsMarkdown>;

  if (existsSync(DATA_JSON)) {
    items = JSON.parse(readFileSync(DATA_JSON, "utf8")) as ReturnType<
      typeof parseTreatmentsMarkdown
    >;
  } else if (existsSync(DATA_MD)) {
    items = parseTreatmentsMarkdown(readFileSync(DATA_MD, "utf8"));
  } else {
    throw new Error("No tip-treatments.json or uploads/treatments-0.md found");
  }

  if (opts?.replace) {
    await db.delete(productsTable).where(sql`id LIKE 'tip-%'`);
  }

  const imageMap = loadTipImageMap();

  let inserted = 0;
  let skipped = 0;

  for (const p of items) {
    const id = `tip-${p.slug}`;
    try {
      await db
        .insert(productsTable)
        .values({
          id,
          slug: id,
          name: p.name,
          brand: "EveryDayMeds",
          category: p.category,
          subcategory: null,
          classification: p.classification,
          shortDescription: shortDescription(p.name, p.altTitle),
          longDescription: `${p.name} is supplied following pharmacist review where required. ${p.altTitle ? `Also known as: ${p.altTitle}.` : ""} Always read the patient information leaflet before use.`,
          ingredients: null,
          directions: "Use as directed by your prescriber or the product leaflet.",
          warnings:
            "Keep out of sight and reach of children. If symptoms persist, speak to a pharmacist or GP.",
          imageUrl: productImageUrl(p.slug, p.name, p.category, imageMap),
          galleryUrls: [],
          packSize: null,
          priceGbp: p.priceGbpPence,
          rrpGbp: Math.round(p.priceGbpPence * 1.15),
          stock: 100,
          active: true,
          requiresConsultation: p.requiresConsultation,
          tags: [
            "tip-catalog",
            p.category,
            ...(p.reviewCount ? [`${p.reviewCount}-reviews`] : []),
          ],
        })
        .onConflictDoUpdate({
          target: productsTable.id,
          set: {
            name: p.name,
            category: p.category,
            priceGbp: p.priceGbpPence,
            imageUrl: productImageUrl(p.slug, p.name, p.category, imageMap),
            shortDescription: shortDescription(p.name, p.altTitle),
            classification: p.classification,
            active: true,
            updatedAt: new Date(),
          },
        });
      inserted++;
    } catch (err) {
      console.error(`Skip ${p.name}:`, err);
      skipped++;
    }
  }

  return { inserted, skipped, total: items.length };
}

void (async () => {
  const replace = process.argv.includes("--replace");
  if (!existsSync(DATA_JSON) && existsSync(DATA_MD)) {
    const { writeFileSync } = await import("node:fs");
    const parsed = parseTreatmentsMarkdown(readFileSync(DATA_MD, "utf8"));
    writeFileSync(DATA_JSON, JSON.stringify(parsed, null, 2), "utf8");
    console.log(`Wrote ${parsed.length} items to tip-treatments.json`);
  }
  const result = await seedTreatmentProducts({ replace });
  console.log(
    `Treatment products: ${result.inserted} upserted, ${result.skipped} skipped (${result.total} in catalog)`,
  );
  process.exit(0);
})();

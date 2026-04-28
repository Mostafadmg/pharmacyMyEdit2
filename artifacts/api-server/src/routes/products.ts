import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, and, ilike, or, desc, asc, sql } from "drizzle-orm";
import { requirePharmacist } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function paramAsString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

router.get("/products", async (req, res): Promise<void> => {
  const category = paramAsString(req.query.category as string | string[] | undefined);
  const search = paramAsString(req.query.search as string | string[] | undefined);
  const includeInactive = paramAsString(req.query.includeInactive as string | string[] | undefined) === "true";
  const limitRaw = paramAsString(req.query.limit as string | string[] | undefined);
  const limit = Math.min(Math.max(parseInt(limitRaw ?? "100", 10) || 100, 1), 200);

  const conditions = [];
  if (!includeInactive) conditions.push(eq(productsTable.active, true));
  if (category && category !== "all") conditions.push(eq(productsTable.category, category));
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(productsTable.name, pattern),
        ilike(productsTable.brand, pattern),
        ilike(productsTable.shortDescription, pattern)
      )!
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const products = await db
    .select()
    .from(productsTable)
    .where(whereClause)
    .orderBy(asc(productsTable.name))
    .limit(limit);

  const categoriesResult = await db.execute(sql`
    SELECT category, COUNT(*)::int AS count
    FROM products
    WHERE active = true
    GROUP BY category
    ORDER BY category
  `);

  res.json({
    products,
    categories: categoriesResult.rows,
  });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const id = req.params.id;
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});

router.post("/admin/products", requirePharmacist, async (req, res): Promise<void> => {
  const b = req.body as Record<string, unknown>;
  const slug = String(b.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const name = String(b.name ?? "").trim();
  const category = String(b.category ?? "").trim();
  const priceGbp = Number(b.priceGbp ?? 0);
  if (!slug || !name || !category || !Number.isFinite(priceGbp) || priceGbp <= 0) {
    res.status(400).json({ error: "slug, name, category, priceGbp (pence) required" });
    return;
  }

  const id = slug;
  try {
    const [product] = await db.insert(productsTable).values({
      id,
      slug,
      name,
      brand: (b.brand as string) || null,
      category,
      subcategory: (b.subcategory as string) || null,
      classification: (b.classification as string) || "GSL",
      shortDescription: String(b.shortDescription ?? ""),
      longDescription: String(b.longDescription ?? ""),
      ingredients: (b.ingredients as string) || null,
      directions: (b.directions as string) || null,
      warnings: (b.warnings as string) || null,
      imageUrl: String(b.imageUrl ?? ""),
      galleryUrls: (b.galleryUrls as unknown[]) ?? [],
      packSize: (b.packSize as string) || null,
      priceGbp: Math.round(priceGbp),
      rrpGbp: b.rrpGbp != null ? Math.round(Number(b.rrpGbp)) : null,
      stock: Math.max(0, Math.round(Number(b.stock ?? 0))),
      active: b.active !== false,
      requiresConsultation: b.requiresConsultation === true,
      tags: (b.tags as unknown[]) ?? [],
    }).returning();
    res.status(201).json({ product });
  } catch (e) {
    res.status(409).json({ error: "Product slug must be unique" });
  }
});

router.patch("/admin/products/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = req.params.id;
  const b = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  const allowed = ["name", "brand", "category", "subcategory", "classification", "shortDescription", "longDescription", "ingredients", "directions", "warnings", "imageUrl", "galleryUrls", "packSize", "priceGbp", "rrpGbp", "stock", "active", "requiresConsultation", "tags"];
  for (const k of allowed) {
    if (k in b) update[k] = b[k];
  }
  if (typeof update.priceGbp === "number") update.priceGbp = Math.round(update.priceGbp);
  if (typeof update.rrpGbp === "number") update.rrpGbp = Math.round(update.rrpGbp);
  if (typeof update.stock === "number") update.stock = Math.max(0, Math.round(update.stock));

  const [product] = await db.update(productsTable).set(update).where(eq(productsTable.id, id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});

router.delete("/admin/products/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = req.params.id;
  const [product] = await db.update(productsTable).set({ active: false }).where(eq(productsTable.id, id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ success: true, product });
});

export default router;

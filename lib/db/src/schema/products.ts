import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  classification: text("classification").notNull().default("GSL"),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description").notNull().default(""),
  ingredients: text("ingredients"),
  directions: text("directions"),
  warnings: text("warnings"),
  imageUrl: text("image_url").notNull().default(""),
  galleryUrls: jsonb("gallery_urls").notNull().default([]),
  packSize: text("pack_size"),
  priceGbp: integer("price_gbp_pence").notNull(),
  rrpGbp: integer("rrp_gbp_pence"),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(20),
  restockAt: timestamp("restock_at", { withTimezone: true }),
  costPriceGbp: integer("cost_price_gbp_pence"),
  active: boolean("active").notNull().default(true),
  requiresConsultation: boolean("requires_consultation").notNull().default(false),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

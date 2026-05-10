import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

/**
 * Single-table promo code engine.
 * - Codes are case-insensitive (stored uppercase).
 * - kind="percent" => discountValue is 1..100; kind="fixed" => pence off the subtotal.
 * - Optional minSubtotalPence gate, expiresAt, and a usageLimit / usageCount counter.
 * - Free-text label shown to the patient on the checkout review.
 */
export const promoCodesTable = pgTable("promo_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  kind: text("kind").notNull(),
  discountValue: integer("discount_value").notNull(),
  minSubtotalPence: integer("min_subtotal_pence").notNull().default(0),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PromoCode = typeof promoCodesTable.$inferSelect;
export type NewPromoCode = typeof promoCodesTable.$inferInsert;

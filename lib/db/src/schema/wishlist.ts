import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const wishlistItemsTable = pgTable(
  "wishlist_items",
  {
    patientEmail: text("patient_email").notNull(),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.patientEmail, t.productId] }),
  }),
);

export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
export type NewWishlistItem = typeof wishlistItemsTable.$inferInsert;

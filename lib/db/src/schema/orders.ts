import { pgTable, text, integer, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: jsonb("shipping_address").notNull().default({}),
  itemsTotalGbp: integer("items_total_gbp_pence").notNull(),
  shippingGbp: integer("shipping_gbp_pence").notNull().default(0),
  totalGbp: integer("total_gbp_pence").notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("paid_demo"),
  paymentProvider: text("payment_provider"),
  paymentSessionId: text("payment_session_id"),
  paymentIntentId: text("payment_intent_id"),
  notes: text("notes"),
  internalNotes: jsonb("internal_notes").notNull().default([]),
  prescriptionItems: jsonb("prescription_items").notNull().default([]),
  consultationId: text("consultation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  // Prevent duplicate auto-created RX orders for the same consultation under
  // concurrent approval. Partial index — shop orders (no consultationId) are unaffected.
  consultationIdUnique: uniqueIndex("orders_consultation_id_uniq")
    .on(t.consultationId)
    .where(sql`${t.consultationId} IS NOT NULL`),
}));

export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSlug: text("product_slug").notNull(),
  imageUrl: text("image_url"),
  unitPriceGbp: integer("unit_price_gbp_pence").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalGbp: integer("line_total_gbp_pence").notNull(),
});

export const deliveriesTable = pgTable("deliveries", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  carrier: text("carrier").notNull().default("PharmaCare Express"),
  trackingNumber: text("tracking_number").notNull(),
  trackingUrl: text("tracking_url"),
  status: text("status").notNull().default("preparing"),
  estimatedDelivery: timestamp("estimated_delivery", { withTimezone: true }),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  events: jsonb("events").notNull().default([]),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type NewOrderItem = typeof orderItemsTable.$inferInsert;
export type Delivery = typeof deliveriesTable.$inferSelect;
export type NewDelivery = typeof deliveriesTable.$inferInsert;

import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  // recipientType: "patient" | "pharmacist"
  recipientType: text("recipient_type").notNull(),
  // for patient = email; for pharmacist = pharmacist user id ("*" for all)
  recipientKey: text("recipient_key").notNull(),
  // category for icon/colour: "message" | "consultation" | "order" | "system"
  category: text("category").notNull().default("message"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  // optional deep-link URL (e.g. /my-consultations#abc, /dashboard/consultations/xyz)
  link: text("link"),
  consultationId: text("consultation_id"),
  orderId: text("order_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Expo push tokens registered by the pharmacist mobile app.
 * One pharmacist can have multiple devices, so we store one row per
 * (pharmacistId, expoPushToken). The token itself is the primary key
 * because Expo guarantees its uniqueness across devices.
 */
export const pharmacistPushTokensTable = pgTable("pharmacist_push_tokens", {
  expoPushToken: text("expo_push_token").primaryKey(),
  pharmacistId: text("pharmacist_id").notNull(),
  pharmacistName: text("pharmacist_name"),
  platform: text("platform"), // "ios" | "android" | "web"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PharmacistPushToken = typeof pharmacistPushTokensTable.$inferSelect;
export type NewPharmacistPushToken = typeof pharmacistPushTokensTable.$inferInsert;

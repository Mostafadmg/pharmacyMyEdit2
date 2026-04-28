import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const commsLogTable = pgTable("comms_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientEmail: text("patient_email").notNull(),
  channel: text("channel").notNull(), // email | phone | video | sms | note
  direction: text("direction").notNull().default("outbound"), // outbound | inbound
  subject: text("subject"),
  summary: text("summary"),
  pharmacistId: varchar("pharmacist_id"),
  pharmacistName: text("pharmacist_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

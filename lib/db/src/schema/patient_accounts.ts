import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const patientAccountsTable = pgTable("patient_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PatientAccount = typeof patientAccountsTable.$inferSelect;

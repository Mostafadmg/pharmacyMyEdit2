import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const patientAccountsTable = pgTable("patient_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  dateOfBirth: text("date_of_birth"),
  sex: text("sex"),
  phone: text("phone"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  postcode: text("postcode"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PatientAccount = typeof patientAccountsTable.$inferSelect;

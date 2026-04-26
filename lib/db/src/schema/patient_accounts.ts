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
  // GP / regular prescriber details (GPhC 4.2k)
  gpName: text("gp_name"),
  gpSurgery: text("gp_surgery"),
  gpAddress: text("gp_address"),
  gpPhone: text("gp_phone"),
  // Identity verification reference (GPhC 4.2e)
  identityVerificationMethod: text("identity_verification_method"),
  identityVerificationRef: text("identity_verification_ref"),
  identityVerifiedAt: timestamp("identity_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PatientAccount = typeof patientAccountsTable.$inferSelect;

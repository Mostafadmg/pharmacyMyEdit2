import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Referral credit ledger. Append-only — balance = SUM(amountPence) over rows
 * for a given patientEmail. Positive amounts are credits earned (referrer
 * reward, signup bonus); negative amounts are credits spent at checkout.
 *
 * sourceType: "referral_signup" | "referral_first_order" | "checkout_apply" | "manual_adjustment"
 */
export const referralCreditsTable = pgTable("referral_credits", {
  id: text("id").primaryKey(),
  patientEmail: text("patient_email").notNull(),
  amountPence: integer("amount_pence").notNull(),
  sourceType: text("source_type").notNull(),
  sourceRef: text("source_ref"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ReferralCredit = typeof referralCreditsTable.$inferSelect;
export type NewReferralCredit = typeof referralCreditsTable.$inferInsert;

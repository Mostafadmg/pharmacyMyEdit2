import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// GPhC Principle 1.4 / 3.2a / 4.1a — feedback and complaints handling
export const complaintsTable = pgTable("complaints", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "complaint" | "feedback" | "concern"
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone"),
  consultationRef: text("consultation_ref"), // optional reference to a consultation
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open | investigating | resolved | closed
  responseNote: text("response_note"),
  respondedBy: text("responded_by"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Complaint = typeof complaintsTable.$inferSelect;

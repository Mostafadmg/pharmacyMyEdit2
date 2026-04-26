import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const pharmacistNotesTable = pgTable("pharmacist_notes", {
  id: text("id").primaryKey(),
  patientEmail: text("patient_email").notNull(),
  note: text("note").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  updatedBy: text("updated_by"),
});

export const consultationNotesTable = pgTable("consultation_notes", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull(),
  note: text("note").notNull(),
  createdById: text("created_by_id").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  updatedBy: text("updated_by"),
});

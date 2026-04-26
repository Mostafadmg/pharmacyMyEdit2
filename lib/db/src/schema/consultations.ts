import { pgTable, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const consultationsTable = pgTable("consultations", {
  id: text("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientAge: integer("patient_age").notNull(),
  patientSex: text("patient_sex").notNull(),
  conditionId: text("condition_id").notNull(),
  conditionName: text("condition_name").notNull(),
  status: text("status").notNull().default("pending"),
  answers: jsonb("answers").notNull().default({}),
  hasRedFlag: boolean("has_red_flag").notNull().default(false),
  hasPhoto: boolean("has_photo").notNull().default(false),
  pharmacistNote: text("pharmacist_note"),
  prescription: text("prescription"),
  referralInfo: text("referral_info"),
  allergies: text("allergies"),
  currentMedications: text("current_medications"),
  medicalHistory: text("medical_history"),
  isPregnant: boolean("is_pregnant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const insertConsultationSchema = createInsertSchema(consultationsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultationsTable.$inferSelect;

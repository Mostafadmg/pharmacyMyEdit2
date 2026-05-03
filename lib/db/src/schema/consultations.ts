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
  prescriptionItems: jsonb("prescription_items").notNull().default([]),
  referralInfo: text("referral_info"),
  allergies: text("allergies"),
  currentMedications: text("current_medications"),
  medicalHistory: text("medical_history"),
  isPregnant: boolean("is_pregnant"),

  // ─── GPhC compliance: identity verification (4.2e) ───
  identityVerificationMethod: text("identity_verification_method"), // e.g. "nhs_number", "photo_id", "address_verified"
  identityVerificationRef: text("identity_verification_ref"),       // ID number / reference shown
  identityVerifiedAt: timestamp("identity_verified_at", { withTimezone: true }),

  // ─── GPhC compliance: GP / regular prescriber (4.2k) ───
  gpName: text("gp_name"),
  gpSurgery: text("gp_surgery"),
  gpAddress: text("gp_address"),
  gpPhone: text("gp_phone"),
  hasRegularGp: boolean("has_regular_gp").notNull().default(true),
  consentShareWithGp: boolean("consent_share_with_gp").notNull().default(false),
  sharedWithGpAt: timestamp("shared_with_gp_at", { withTimezone: true }),

  // ─── GPhC compliance: consent (Principle 4.1, 4.2d) ───
  consentToTreatment: boolean("consent_to_treatment").notNull().default(false),
  consentToDelivery: boolean("consent_to_delivery").notNull().default(false),
  consentDataProcessing: boolean("consent_data_processing").notNull().default(false),
  preferredDeliveryMethod: text("preferred_delivery_method"), // e.g. "royal_mail_tracked", "courier_signed"
  deliveryAddress: text("delivery_address"),

  // ─── GPhC compliance: safeguard / risk flags (4.2h, 4.2j) ───
  riskFlags: jsonb("risk_flags").notNull().default([]), // string[] e.g. ["multiple_orders", "antimicrobial_repeat"]
  riskCategory: text("risk_category"), // "low" | "medium" | "high"

  // ─── GPhC compliance: weight management verification (4.2l) ───
  verifiedHeightCm: integer("verified_height_cm"),
  verifiedWeightKg: integer("verified_weight_kg"),
  bmi: integer("bmi"),

  // ─── GPhC compliance: delivery confirmation (1.4, 4.3) ───
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  deliveryCarrier: text("delivery_carrier"),
  deliveryTrackingNumber: text("delivery_tracking_number"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  deliveryConfirmation: text("delivery_confirmation"), // free-text confirmation

  // ─── GPhC compliance: clinical decision audit (1.4) ───
  clinicalDecisionRationale: text("clinical_decision_rationale"),
  reviewedBy: text("reviewed_by"), // pharmacist username

  // ─── Patient-uploaded photos (data URLs or stored URLs) ───
  photoUrls: jsonb("photo_urls").notNull().default([]),

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

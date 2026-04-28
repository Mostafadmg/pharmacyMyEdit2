import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const consultationMessagesTable = pgTable("consultation_messages", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull(),
  patientEmail: text("patient_email").notNull(),
  // sender: "patient" | "pharmacist" | "system"
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name").notNull(),
  body: text("body").notNull(),
  // type: "message" | "more_info_request" | "approve" | "reject" | "refer" | "system"
  kind: text("kind").notNull().default("message"),
  // jsonb-ish metadata in text for now (kept simple — small payload)
  meta: text("meta"),
  readByPatient: boolean("read_by_patient").notNull().default(false),
  readByPharmacist: boolean("read_by_pharmacist").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ConsultationMessage = typeof consultationMessagesTable.$inferSelect;
export type NewConsultationMessage = typeof consultationMessagesTable.$inferInsert;

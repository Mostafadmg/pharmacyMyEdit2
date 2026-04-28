import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const consultationActionsTable = pgTable("consultation_actions", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull(),
  // action: "submitted" | "approve" | "reject" | "more_info" | "refer" | "patient_reply" | "cancelled"
  action: text("action").notNull(),
  actorRole: text("actor_role").notNull(), // "patient" | "pharmacist" | "system"
  actorName: text("actor_name").notNull(),
  // structured details (recipient type, reject reason, etc.)
  details: jsonb("details").notNull().default({}),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ConsultationAction = typeof consultationActionsTable.$inferSelect;
export type NewConsultationAction = typeof consultationActionsTable.$inferInsert;

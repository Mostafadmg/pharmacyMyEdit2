import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

// GPhC Principle 1.4 — record keeping / audit trail of clinical decisions
export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "consultation" | "complaint" | "delivery" | "patient"
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(), // e.g. "created", "approved", "rejected", "dispatched", "delivered", "shared_with_gp"
  actor: text("actor").notNull(), // pharmacist username or patient email or "system"
  actorRole: text("actor_role").notNull(), // "pharmacist" | "patient" | "system"
  details: jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;

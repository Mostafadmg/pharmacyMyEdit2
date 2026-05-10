import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const clinicalRepliesTable = pgTable("clinical_replies", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  conditionId: text("condition_id"),
  statusContext: text("status_context"),
  category: text("category").notNull().default("general"),
  useCount: integer("use_count").notNull().default(0),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ClinicalReply = typeof clinicalRepliesTable.$inferSelect;
export type NewClinicalReply = typeof clinicalRepliesTable.$inferInsert;

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const drugInteractionsTable = pgTable("drug_interactions", {
  id: text("id").primaryKey(),
  drugA: text("drug_a").notNull(),
  drugB: text("drug_b").notNull(),
  severity: text("severity").notNull(),
  mechanism: text("mechanism").notNull(),
  advice: text("advice").notNull(),
  source: text("source").notNull().default("BNF"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DrugInteraction = typeof drugInteractionsTable.$inferSelect;
export type NewDrugInteraction = typeof drugInteractionsTable.$inferInsert;

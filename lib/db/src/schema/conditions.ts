import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conditionsTable = pgTable("conditions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  onlineEligible: boolean("online_eligible").notNull().default(true),
  requiresPhoto: boolean("requires_photo").notNull().default(false),
  requiresInPerson: boolean("requires_in_person").notNull().default(false),
  ageRestrictions: text("age_restrictions"),
  redFlags: text("red_flags").array().notNull().default([]),
  questionsCount: integer("questions_count").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConditionSchema = createInsertSchema(conditionsTable);
export type InsertCondition = z.infer<typeof insertConditionSchema>;
export type Condition = typeof conditionsTable.$inferSelect;

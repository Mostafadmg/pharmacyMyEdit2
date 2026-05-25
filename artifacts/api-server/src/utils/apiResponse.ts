import type { conditionsTable, consultationsTable } from "@workspace/db";

type ConditionRow = typeof conditionsTable.$inferSelect;
type ConsultationRow = typeof consultationsTable.$inferSelect;

const CONDITION_CATEGORY_ALIASES: Record<string, string> = {
  allergies: "allergy",
  eye_mouth: "eye_care",
  lifestyle: "respiratory",
};

export function normalizeConditionCategory(category: string): string {
  return CONDITION_CATEGORY_ALIASES[category] ?? category;
}

export function jsonCondition(row: ConditionRow) {
  return {
    ...row,
    category: normalizeConditionCategory(row.category),
  };
}

export function jsonConsultation(row: ConsultationRow) {
  return row;
}

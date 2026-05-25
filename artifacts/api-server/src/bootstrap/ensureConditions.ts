import { db, conditionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

/** Minimum conditions required for patient-facing consultation flows. */
const REQUIRED_CONDITIONS = [
  {
    id: "weight-loss",
    name: "Weight Loss (Mounjaro · Wegovy · Saxenda · Orlistat · Mysimba)",
    category: "weight_management",
    description:
      "Clinically-led weight management with GLP-1 injectables and related medicines.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: [
      "pregnancy",
      "eating_disorder",
      "thyroid_cancer_history",
      "pancreatitis",
      "type1_diabetes",
    ],
    questionsCount: 0,
    questionsJson: [] as unknown[],
    priceGbp: 14900,
    active: true,
  },
] as const;

async function normalizeLegacyCategories(): Promise<void> {
  await db.execute(sql`
    UPDATE conditions SET category = 'allergy' WHERE category = 'allergies'
  `);
  await db.execute(sql`
    UPDATE conditions SET category = 'eye_care' WHERE category = 'eye_mouth'
  `);
  await db.execute(sql`
    UPDATE conditions SET category = 'respiratory' WHERE category = 'lifestyle'
  `);
}

export async function ensureRequiredConditions(): Promise<void> {
  await normalizeLegacyCategories();

  for (const row of REQUIRED_CONDITIONS) {
    const [existing] = await db
      .select({ id: conditionsTable.id })
      .from(conditionsTable)
      .where(eq(conditionsTable.id, row.id));

    if (existing) continue;

    await db.insert(conditionsTable).values({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      onlineEligible: row.onlineEligible,
      requiresPhoto: row.requiresPhoto,
      requiresInPerson: row.requiresInPerson,
      ageRestrictions: row.ageRestrictions,
      redFlags: [...row.redFlags],
      questionsCount: row.questionsCount,
      questionsJson: row.questionsJson,
      priceGbp: row.priceGbp,
      active: row.active,
    });

    logger.info({ conditionId: row.id }, "Seeded required condition");
  }
}

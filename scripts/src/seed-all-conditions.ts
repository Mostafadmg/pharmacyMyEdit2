/**
 * Upserts all condition rows used by the patient pharmacy (treatments menu + questionnaires).
 * Run: pnpm --filter @workspace/scripts run seed-all-conditions
 */
import { db, pool, conditionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { allConditionDbSeeds } from "../../artifacts/pharmacy/src/data/newConditionsData.ts";
import {
  getConditionQuestions,
  countConditionQuestions,
} from "../../artifacts/pharmacy/src/data/conditionQuestions.ts";

async function main() {
  let inserted = 0;
  let updated = 0;

  for (const seed of allConditionDbSeeds) {
    const questionnaire = getConditionQuestions(seed.id);
    const questionsCount = countConditionQuestions(questionnaire);
    const questionsJson = [
      ...questionnaire.eligibilityQuestions.map((q) => ({ ...q, phase: "eligibility" })),
      ...questionnaire.clinicalQuestions.map((q) => ({ ...q, phase: "clinical" })),
    ];

    const row = {
      id: seed.id,
      name: seed.name,
      category: seed.category,
      description: seed.description,
      onlineEligible: seed.onlineEligible,
      requiresPhoto: seed.requiresPhoto,
      requiresInPerson: seed.requiresInPerson,
      ageRestrictions: seed.ageRestrictions,
      redFlags: seed.redFlags,
      questionsCount,
      questionsJson,
      priceGbp: seed.priceGbp,
      active: true,
    };

    const [existing] = await db
      .select({ id: conditionsTable.id })
      .from(conditionsTable)
      .where(eq(conditionsTable.id, seed.id));

    if (existing) {
      await db.update(conditionsTable).set(row).where(eq(conditionsTable.id, seed.id));
      updated++;
    } else {
      await db.insert(conditionsTable).values(row);
      inserted++;
    }
  }

  console.log(
    `Conditions seed complete: ${inserted} inserted, ${updated} updated (${allConditionDbSeeds.length} total).`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { db, pool, conditionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const WEIGHT_LOSS = {
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
};

async function main() {
  const [existing] = await db
    .select({ id: conditionsTable.id })
    .from(conditionsTable)
    .where(eq(conditionsTable.id, WEIGHT_LOSS.id));

  if (existing) {
    console.log("weight-loss condition already exists");
  } else {
    await db.insert(conditionsTable).values(WEIGHT_LOSS);
    console.log("Inserted weight-loss condition");
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Seeds demo consultations for mostafa.damghani.md@gmail.com across every condition.
 * Run after seed-all-conditions:
 *   pnpm --filter @workspace/scripts run seed-all-conditions
 *   pnpm --filter @workspace/scripts run seed-patient-mostafa
 */
import {
  db,
  pool,
  consultationsTable,
  patientAccountsTable,
} from "@workspace/db";
import { eq, and, like } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { allConditionDbSeeds } from "../../artifacts/pharmacy/src/data/newConditionsData.ts";

const PATIENT_EMAIL = "mostafa.damghani.md@gmail.com";
const PATIENT_NAME = "Mostafa Damghani";
const PATIENT_AGE = 34;
const PATIENT_SEX = "male";
const DEFAULT_PASSWORD = "Pharmacy1!";
const ID_PREFIX = "seed-mostafa-";

const STATUSES = [
  "pending",
  "red_flag",
  "approved",
  "approved",
  "more_info_needed",
  "rejected",
  "referred",
  "cancelled",
] as const;

function sampleAnswers(conditionId: string): Record<string, unknown> {
  return {
    conditionId,
    duration: "under_1wk",
    severity: "moderate",
    previously_diagnosed: "no",
    allergies: "None known",
    current_meds: "None",
    consent_confirmed: true,
  };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function ensurePatientAccount(): Promise<string> {
  const email = PATIENT_EMAIL.toLowerCase();
  const [existing] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.email, email));

  if (existing) {
    console.log(`Patient account exists: ${email} (id ${existing.id})`);
    return existing.id;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const id = `patient-mostafa-demo`;

  await db.insert(patientAccountsTable).values({
    id,
    name: PATIENT_NAME,
    email,
    passwordHash,
    dateOfBirth: "1991-06-15",
    sex: PATIENT_SEX,
    phone: "07700900123",
    addressLine1: "42 Demo Street",
    city: "London",
    postcode: "SW1A 1AA",
  });

  console.log(`Created patient account: ${email} (password: ${DEFAULT_PASSWORD})`);
  return id;
}

async function main() {
  await ensurePatientAccount();

  await db
    .delete(consultationsTable)
    .where(
      and(
        eq(consultationsTable.patientEmail, PATIENT_EMAIL.toLowerCase()),
        like(consultationsTable.id, `${ID_PREFIX}%`),
      ),
    );

  let created = 0;
  const sorted = [...allConditionDbSeeds].sort((a, b) => a.name.localeCompare(b.name));

  for (let i = 0; i < sorted.length; i++) {
    const seed = sorted[i]!;
    const status = STATUSES[i % STATUSES.length]!;
    const isApproved = status === "approved";
    const isRejected = status === "rejected";
    const createdAt = daysAgo(Math.min(i + 1, 60));

    const id = `${ID_PREFIX}${seed.id}`;

    await db.insert(consultationsTable).values({
      id,
      patientName: PATIENT_NAME,
      patientEmail: PATIENT_EMAIL.toLowerCase(),
      patientAge: PATIENT_AGE,
      patientSex: PATIENT_SEX,
      conditionId: seed.id,
      conditionName: seed.name,
      status,
      answers: sampleAnswers(seed.id),
      hasRedFlag: status === "red_flag",
      hasPhoto: seed.requiresPhoto,
      pharmacistNote:
        status === "more_info_needed"
          ? "Please upload a clearer photo of the affected area when you can."
          : isApproved
            ? "Suitable for supply after clinical review."
            : null,
      prescription: isApproved ? `${seed.name.split("(")[0]?.trim()} — supply as clinically indicated` : null,
      prescriptionItems: isApproved
        ? [
            {
              name: seed.name.split("(")[0]?.trim() ?? seed.name,
              strength: "As directed",
              form: "Supply",
              quantity: "1",
              sig: "Use as directed by pharmacist",
              duration: "28 days",
            },
          ]
        : [],
      allergies: "None known",
      currentMedications: "None",
      consentToTreatment: true,
      consentToDelivery: true,
      consentDataProcessing: true,
      riskCategory: status === "red_flag" ? "high" : "low",
      reviewedBy: isApproved || isRejected ? "demo.pharmacist" : null,
      clinicalDecisionRationale: isApproved
        ? "Meets PGD criteria for online supply."
        : isRejected
          ? "Not suitable for online supply at this time."
          : null,
      createdAt,
      updatedAt: createdAt,
      reviewedAt: isApproved || isRejected ? daysAgo(Math.max(0, i)) : null,
    });
    created++;
  }

  const pending = sorted.filter((_, i) =>
    ["pending", "red_flag"].includes(STATUSES[i % STATUSES.length]!),
  ).length;
  const completed = created - pending;

  console.log(
    `Seeded ${created} consultations for ${PATIENT_EMAIL} (${pending} in review, ${completed} completed).`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

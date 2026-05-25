import { db, consultationsTable, patientAccountsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  extractDateOfBirthFromAnswers,
  nextConsultationNumber,
  nextPmrNumber,
} from "../utils/patientIdentity";

async function ensureColumns(): Promise<void> {
  await db.execute(sql`
    ALTER TABLE patient_accounts
    ADD COLUMN IF NOT EXISTS pmr_number text UNIQUE
  `);
  await db.execute(sql`
    ALTER TABLE consultations
    ADD COLUMN IF NOT EXISTS consultation_number text UNIQUE
  `);
  await db.execute(sql`
    ALTER TABLE consultations
    ADD COLUMN IF NOT EXISTS patient_date_of_birth text
  `);
  await db.execute(sql`
    ALTER TABLE consultations
    ADD COLUMN IF NOT EXISTS duplicate_patient_matches jsonb NOT NULL DEFAULT '[]'::jsonb
  `);
}

async function backfillPmrNumbers(): Promise<void> {
  const withoutPmr = await db
    .select({ id: patientAccountsTable.id })
    .from(patientAccountsTable)
    .where(sql`${patientAccountsTable.pmrNumber} IS NULL`);

  for (const row of withoutPmr) {
    const pmrNumber = await nextPmrNumber();
    await db
      .update(patientAccountsTable)
      .set({ pmrNumber })
      .where(eq(patientAccountsTable.id, row.id));
  }

  if (withoutPmr.length > 0) {
    logger.info({ count: withoutPmr.length }, "Backfilled PMR numbers");
  }
}

async function backfillConsultationNumbers(): Promise<void> {
  const withoutNumber = await db
    .select({
      id: consultationsTable.id,
      patientDateOfBirth: consultationsTable.patientDateOfBirth,
      answers: consultationsTable.answers,
    })
    .from(consultationsTable)
    .where(sql`${consultationsTable.consultationNumber} IS NULL`);

  for (const row of withoutNumber) {
    const consultationNumber = await nextConsultationNumber();
    const dob =
      row.patientDateOfBirth ??
      extractDateOfBirthFromAnswers(row.answers as Record<string, unknown>);
    await db
      .update(consultationsTable)
      .set({
        consultationNumber,
        ...(dob && !row.patientDateOfBirth
          ? { patientDateOfBirth: dob }
          : {}),
      })
      .where(eq(consultationsTable.id, row.id));
  }

  if (withoutNumber.length > 0) {
    logger.info(
      { count: withoutNumber.length },
      "Backfilled consultation numbers",
    );
  }
}

export async function ensurePatientIdentity(): Promise<void> {
  await ensureColumns();
  await backfillPmrNumbers();
  await backfillConsultationNumbers();
}

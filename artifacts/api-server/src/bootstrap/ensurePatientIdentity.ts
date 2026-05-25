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
    const dob =
      row.patientDateOfBirth ??
      extractDateOfBirthFromAnswers(row.answers as Record<string, unknown>);
    let saved = false;
    for (let attempt = 0; attempt < 12 && !saved; attempt++) {
      const consultationNumber = await nextConsultationNumber(attempt);
      try {
        await db
          .update(consultationsTable)
          .set({
            consultationNumber,
            ...(dob && !row.patientDateOfBirth
              ? { patientDateOfBirth: dob }
              : {}),
          })
          .where(eq(consultationsTable.id, row.id));
        saved = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          !msg.includes("unique constraint") &&
          !msg.includes("duplicate key")
        ) {
          throw err;
        }
      }
    }
    if (!saved) {
      logger.warn({ consultationId: row.id }, "Skipped consultation number backfill");
    }
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
  try {
    await backfillConsultationNumbers();
  } catch (err) {
    logger.warn({ err }, "Consultation number backfill had errors");
  }
}

import { pool } from "@workspace/db";

const alters = [
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS consultation_number text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS patient_date_of_birth text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS duplicate_patient_matches jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `CREATE UNIQUE INDEX IF NOT EXISTS consultations_consultation_number_unique ON consultations (consultation_number) WHERE consultation_number IS NOT NULL`,
  `ALTER TABLE patient_accounts ADD COLUMN IF NOT EXISTS pmr_number text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS patient_accounts_pmr_number_unique ON patient_accounts (pmr_number) WHERE pmr_number IS NOT NULL`,
];

async function main() {
  for (const sql of alters) {
    await pool.query(sql);
    console.log("OK:", sql.slice(0, 72) + "...");
  }
  await pool.end();
  console.log("Database schema synced for local seeding.");
}

main().catch(async (e) => {
  console.error(e);
  await pool.end().catch(() => {});
  process.exit(1);
});

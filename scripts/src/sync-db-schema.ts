import { pool } from "@workspace/db";

const alters = [
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS consultation_number text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS patient_date_of_birth text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS duplicate_patient_matches jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `CREATE UNIQUE INDEX IF NOT EXISTS consultations_consultation_number_unique ON consultations (consultation_number) WHERE consultation_number IS NOT NULL`,
  `ALTER TABLE patient_accounts ADD COLUMN IF NOT EXISTS pmr_number text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS patient_accounts_pmr_number_unique ON patient_accounts (pmr_number) WHERE pmr_number IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS dmd_gtin (
    gtin text PRIMARY KEY,
    ampp_id text NOT NULL,
    vmp_id text,
    product_name text NOT NULL,
    strength text,
    form text,
    supplier text,
    discontinued boolean NOT NULL DEFAULT false,
    synced_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS dmd_gtin_ampp_id_idx ON dmd_gtin (ampp_id)`,
  `CREATE TABLE IF NOT EXISTS dmd_sync_runs (
    id text PRIMARY KEY,
    release_id text NOT NULL,
    release_name text,
    archive_sha256 text,
    row_count integer NOT NULL DEFAULT 0,
    status text NOT NULL,
    error_message text,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS dmd_sync_runs_started_at_idx ON dmd_sync_runs (started_at DESC)`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS rx_clinical_check_complete boolean NOT NULL DEFAULT false`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS rx_clinical_check_at timestamptz`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS rx_clinical_check_by text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pmr_workflow_status text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pmr_clinical_check_at timestamptz`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pmr_clinical_check_by text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS picking_label_code text`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pick_verified_items jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pmr_workflow_updated_at timestamptz`,
  `CREATE UNIQUE INDEX IF NOT EXISTS consultations_picking_label_code_unique ON consultations (picking_label_code) WHERE picking_label_code IS NOT NULL`,
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

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

/**
 * Align live PostgreSQL with lib/db consultations schema (idempotent).
 * Older databases may lack columns added after first deploy.
 */
const CONSULTATION_COLUMN_DDLS: string[] = [
  `ADD COLUMN IF NOT EXISTS consultation_number text`,
  `ADD COLUMN IF NOT EXISTS patient_date_of_birth text`,
  `ADD COLUMN IF NOT EXISTS prescription text`,
  `ADD COLUMN IF NOT EXISTS prescription_items jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ADD COLUMN IF NOT EXISTS referral_info text`,
  `ADD COLUMN IF NOT EXISTS allergies text`,
  `ADD COLUMN IF NOT EXISTS current_medications text`,
  `ADD COLUMN IF NOT EXISTS medical_history text`,
  `ADD COLUMN IF NOT EXISTS is_pregnant boolean`,
  `ADD COLUMN IF NOT EXISTS identity_verification_method text`,
  `ADD COLUMN IF NOT EXISTS identity_verification_ref text`,
  `ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz`,
  `ADD COLUMN IF NOT EXISTS gp_name text`,
  `ADD COLUMN IF NOT EXISTS gp_surgery text`,
  `ADD COLUMN IF NOT EXISTS gp_address text`,
  `ADD COLUMN IF NOT EXISTS gp_phone text`,
  `ADD COLUMN IF NOT EXISTS has_regular_gp boolean NOT NULL DEFAULT true`,
  `ADD COLUMN IF NOT EXISTS consent_share_with_gp boolean NOT NULL DEFAULT false`,
  `ADD COLUMN IF NOT EXISTS shared_with_gp_at timestamptz`,
  `ADD COLUMN IF NOT EXISTS consent_to_treatment boolean NOT NULL DEFAULT false`,
  `ADD COLUMN IF NOT EXISTS consent_to_delivery boolean NOT NULL DEFAULT false`,
  `ADD COLUMN IF NOT EXISTS consent_data_processing boolean NOT NULL DEFAULT false`,
  `ADD COLUMN IF NOT EXISTS preferred_delivery_method text`,
  `ADD COLUMN IF NOT EXISTS delivery_address text`,
  `ADD COLUMN IF NOT EXISTS risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ADD COLUMN IF NOT EXISTS risk_category text`,
  `ADD COLUMN IF NOT EXISTS duplicate_patient_matches jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ADD COLUMN IF NOT EXISTS verified_height_cm integer`,
  `ADD COLUMN IF NOT EXISTS verified_weight_kg integer`,
  `ADD COLUMN IF NOT EXISTS bmi integer`,
  `ADD COLUMN IF NOT EXISTS dispatched_at timestamptz`,
  `ADD COLUMN IF NOT EXISTS delivery_carrier text`,
  `ADD COLUMN IF NOT EXISTS delivery_tracking_number text`,
  `ADD COLUMN IF NOT EXISTS delivered_at timestamptz`,
  `ADD COLUMN IF NOT EXISTS delivery_confirmation text`,
  `ADD COLUMN IF NOT EXISTS clinical_decision_rationale text`,
  `ADD COLUMN IF NOT EXISTS reviewed_by text`,
  `ADD COLUMN IF NOT EXISTS photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb`,
  `ADD COLUMN IF NOT EXISTS previous_consultation_id text`,
  `ADD COLUMN IF NOT EXISTS reviewed_at timestamptz`,
];

export async function ensureConsultationsSchema(): Promise<void> {
  for (const ddl of CONSULTATION_COLUMN_DDLS) {
    await db.execute(sql.raw(`ALTER TABLE consultations ${ddl}`));
  }

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS consultations_consultation_number_key
    ON consultations (consultation_number)
    WHERE consultation_number IS NOT NULL
  `);

  logger.info("Consultations table schema verified");
}

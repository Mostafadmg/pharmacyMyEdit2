/**
 * Auto-complex patient rules (weight-management consultations only):
 * 1. Medication switch — last approved order was Mounjaro and current is Wegovy (or vice versa).
 * 2. Weight change — |current − previous| ≥ 10 kg OR ≥ 7% vs prior order weight (answers.weight_kg / verifiedWeightKg).
 *
 * Persists: riskFlags (auto_complex_patient, …), answers.patient_complexity = "complex",
 * answers.auto_complex (reasons + detail). Does not change consultation_type from the patient journey.
 */
import {
  db,
  consultationsTable,
  type Consultation,
} from "@workspace/db";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { isWeightManagementCondition } from "./patientIdentity";

/** Auto-classify as complex when |Δweight| ≥ 10 kg OR ≥ 7% vs prior order. */
export const WEIGHT_CHANGE_KG_THRESHOLD = 10;
export const WEIGHT_CHANGE_PCT_THRESHOLD = 7;

export type Glp1Medicine = "mounjaro" | "wegovy" | "saxenda";

export type AutoComplexReason =
  | "medication_switch_mounjaro_wegovy"
  | "weight_change_threshold";

export type AutoComplexPayload = {
  detectedAt: string;
  reasons: AutoComplexReason[];
  patient_complexity: "complex";
  medication_switch?: {
    from: Glp1Medicine;
    to: Glp1Medicine;
    priorConsultationId: string;
    priorOrderDate: string;
  };
  weight_change?: {
    currentWeightKg: number;
    previousWeightKg: number;
    deltaKg: number;
    deltaPct: number;
    priorConsultationId: string;
    priorOrderDate: string;
  };
};

const APPROVED_STATUSES = ["approved"] as const;

const GLP1_PATTERNS: { id: Glp1Medicine; re: RegExp }[] = [
  { id: "mounjaro", re: /mounjaro|tirzepatide/i },
  { id: "wegovy", re: /wegovy|semaglutide|ozempic/i },
  { id: "saxenda", re: /saxenda|liraglutide/i },
];

export function resolveWeightKg(row: {
  verifiedWeightKg: number | null;
  answers: Record<string, unknown>;
}): number | null {
  const fromAnswers = row.answers.weight_kg;
  if (typeof fromAnswers === "number" && Number.isFinite(fromAnswers) && fromAnswers > 0) {
    return fromAnswers;
  }
  if (
    row.verifiedWeightKg != null &&
    Number.isFinite(row.verifiedWeightKg) &&
    row.verifiedWeightKg > 0
  ) {
    return row.verifiedWeightKg;
  }
  return null;
}

/** Normalise Mounjaro (tirzepatide), Wegovy (semaglutide), Saxenda from plan / items / answers. */
export function normalizeGlp1Medicine(source: unknown): Glp1Medicine | null {
  if (source == null) return null;

  if (typeof source === "object" && !Array.isArray(source)) {
    const obj = source as Record<string, unknown>;
    if (typeof obj.medicine === "string") {
      const m = obj.medicine.toLowerCase();
      if (m === "mounjaro" || m === "wegovy" || m === "saxenda") return m;
    }
    if (Array.isArray(obj.penIds)) {
      const joined = obj.penIds.join(" ");
      for (const { id, re } of GLP1_PATTERNS) {
        if (re.test(joined)) return id;
      }
    }
  }

  const text = String(source);
  for (const { id, re } of GLP1_PATTERNS) {
    if (re.test(text)) return id;
  }
  return null;
}

export function extractGlp1MedicineFromConsultation(row: {
  answers: Record<string, unknown>;
  prescriptionItems: unknown;
  conditionName: string;
}): Glp1Medicine | null {
  const answers = row.answers;
  const fromPlan = normalizeGlp1Medicine(answers.selected_plan);
  if (fromPlan) return fromPlan;

  const requested =
    typeof answers.requested_medication === "string"
      ? answers.requested_medication
      : null;
  const fromRequested = normalizeGlp1Medicine(requested);
  if (fromRequested) return fromRequested;

  const items = row.prescriptionItems;
  if (Array.isArray(items)) {
    for (const item of items) {
      if (item && typeof item === "object") {
        const name = (item as { name?: string }).name ?? "";
        const strength = (item as { strength?: string }).strength ?? "";
        const hit = normalizeGlp1Medicine(`${name} ${strength}`);
        if (hit) return hit;
      }
    }
  }

  const fromDose = normalizeGlp1Medicine(answers.current_dose);
  if (fromDose) return fromDose;

  return normalizeGlp1Medicine(row.conditionName);
}

/**
 * Mounjaro ↔ Wegovy switch (either direction). Saxenda is detected but does not
 * trigger this rule unless paired with Mounjaro/Wegovy on the prior order.
 */
export function isMounjaroWegovySwitch(
  current: Glp1Medicine | null,
  previous: Glp1Medicine | null,
): boolean {
  if (!current || !previous || current === previous) return false;
  const pair = new Set([current, previous]);
  return pair.has("mounjaro") && pair.has("wegovy");
}

/**
 * Complex when |Δ| ≥ 10 kg OR |Δ%| ≥ 7 (previous weight must be > 0).
 */
export function evaluateWeightChangeThreshold(
  currentKg: number,
  previousKg: number,
): { isComplex: boolean; deltaKg: number; deltaPct: number } | null {
  if (currentKg <= 0 || previousKg <= 0) return null;
  const deltaKg = Math.abs(currentKg - previousKg);
  const deltaPct = (deltaKg / previousKg) * 100;
  const isComplex =
    deltaKg >= WEIGHT_CHANGE_KG_THRESHOLD ||
    deltaPct >= WEIGHT_CHANGE_PCT_THRESHOLD;
  return {
    isComplex,
    deltaKg: Math.round(deltaKg * 10) / 10,
    deltaPct: Math.round(deltaPct * 10) / 10,
  };
}

type ConsultationSnapshot = {
  id: string;
  createdAt: Date;
  status: string;
  answers: Record<string, unknown>;
  verifiedWeightKg: number | null;
  prescriptionItems: unknown;
  conditionName: string;
  conditionId: string;
};

function toSnapshot(row: Consultation): ConsultationSnapshot {
  return {
    id: row.id,
    createdAt: row.createdAt,
    status: row.status,
    answers: (row.answers ?? {}) as Record<string, unknown>,
    verifiedWeightKg: row.verifiedWeightKg,
    prescriptionItems: row.prescriptionItems,
    conditionName: row.conditionName,
    conditionId: row.conditionId,
  };
}

function formatOrderDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function fetchConsultationById(
  id: string,
): Promise<ConsultationSnapshot | null> {
  const [row] = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.id, id))
    .limit(1);
  return row ? toSnapshot(row) : null;
}

/** Last approved/dispensed weight-management consultation for this patient. */
export async function findLastApprovedWeightConsultation(opts: {
  patientEmail: string;
  excludeId?: string | null;
}): Promise<ConsultationSnapshot | null> {
  const email = opts.patientEmail.trim().toLowerCase();
  const clauses = [
    eq(consultationsTable.patientEmail, email),
    inArray(consultationsTable.status, [...APPROVED_STATUSES]),
  ];
  if (opts.excludeId) {
    clauses.push(ne(consultationsTable.id, opts.excludeId));
  }

  const rows = await db
    .select()
    .from(consultationsTable)
    .where(and(...clauses))
    .orderBy(desc(consultationsTable.createdAt))
    .limit(50);

  for (const row of rows) {
    if (!isWeightManagementCondition(row.conditionId)) continue;
    return toSnapshot(row);
  }
  return null;
}

/** Prior consultation with a recorded weight (linked repeat or latest older order). */
export async function findPriorConsultationWithWeight(opts: {
  patientEmail: string;
  previousConsultationId?: string | null;
  excludeId?: string | null;
}): Promise<ConsultationSnapshot | null> {
  const email = opts.patientEmail.trim().toLowerCase();

  if (opts.previousConsultationId) {
    const linked = await fetchConsultationById(opts.previousConsultationId);
    if (
      linked &&
      linked.id !== opts.excludeId &&
      isWeightManagementCondition(linked.conditionId) &&
      resolveWeightKg(linked) != null
    ) {
      return linked;
    }
  }

  const clauses = [eq(consultationsTable.patientEmail, email)];
  if (opts.excludeId) {
    clauses.push(ne(consultationsTable.id, opts.excludeId));
  }

  const rows = await db
    .select()
    .from(consultationsTable)
    .where(and(...clauses))
    .orderBy(desc(consultationsTable.createdAt))
    .limit(80);

  for (const row of rows) {
    if (!isWeightManagementCondition(row.conditionId)) continue;
    const snap = toSnapshot(row);
    if (resolveWeightKg(snap) != null) return snap;
  }
  return null;
}

export type DetectAutoComplexInput = {
  patientEmail: string;
  conditionId: string;
  answers: Record<string, unknown>;
  verifiedWeightKg?: number | null;
  prescriptionItems?: unknown;
  conditionName: string;
  previousConsultationId?: string | null;
  excludeConsultationId?: string | null;
};

export type DetectAutoComplexResult = {
  riskFlags: string[];
  answersPatch: Record<string, unknown>;
};

/**
 * Runs at consultation create for weight-management orders.
 * Does not override consultation_type — only adds riskFlags + answers.auto_complex.
 */
export async function detectAutoComplexPatient(
  input: DetectAutoComplexInput,
): Promise<DetectAutoComplexResult> {
  if (!isWeightManagementCondition(input.conditionId)) {
    return { riskFlags: [], answersPatch: {} };
  }

  const currentAnswers = input.answers;
  const currentRow = {
    answers: currentAnswers,
    verifiedWeightKg: input.verifiedWeightKg ?? null,
    prescriptionItems: input.prescriptionItems ?? [],
    conditionName: input.conditionName,
  };

  const currentMedicine = extractGlp1MedicineFromConsultation({
    ...currentRow,
    conditionId: input.conditionId,
  } as ConsultationSnapshot);

  const reasons: AutoComplexReason[] = [];
  const riskFlags: string[] = [];
  let payload: AutoComplexPayload | null = null;

  const approvedPrior = await findLastApprovedWeightConsultation({
    patientEmail: input.patientEmail,
    excludeId: input.excludeConsultationId,
  });

  if (approvedPrior && currentMedicine) {
    const priorMedicine = extractGlp1MedicineFromConsultation(approvedPrior);
    if (isMounjaroWegovySwitch(currentMedicine, priorMedicine)) {
      reasons.push("medication_switch_mounjaro_wegovy");
      riskFlags.push("medication_switch_mounjaro_wegovy");
      payload = {
        detectedAt: new Date().toISOString(),
        reasons: [...reasons],
        patient_complexity: "complex",
        medication_switch: {
          from: priorMedicine!,
          to: currentMedicine,
          priorConsultationId: approvedPrior.id,
          priorOrderDate: formatOrderDate(approvedPrior.createdAt),
        },
      };
    }
  }

  const weightPrior = await findPriorConsultationWithWeight({
    patientEmail: input.patientEmail,
    previousConsultationId: input.previousConsultationId,
    excludeId: input.excludeConsultationId,
  });

  const currentWeight = resolveWeightKg(currentRow);
  if (weightPrior && currentWeight != null) {
    const previousWeight = resolveWeightKg(weightPrior);
    if (previousWeight != null) {
      const evalResult = evaluateWeightChangeThreshold(
        currentWeight,
        previousWeight,
      );
      if (evalResult?.isComplex) {
        reasons.push("weight_change_threshold");
        riskFlags.push("weight_change_10kg_or_7pct");
        const weightBlock = {
          currentWeightKg: currentWeight,
          previousWeightKg: previousWeight,
          deltaKg: evalResult.deltaKg,
          deltaPct: evalResult.deltaPct,
          priorConsultationId: weightPrior.id,
          priorOrderDate: formatOrderDate(weightPrior.createdAt),
        };
        payload = payload
          ? {
              ...payload,
              reasons: [...new Set([...payload.reasons, ...reasons])],
              weight_change: weightBlock,
            }
          : {
              detectedAt: new Date().toISOString(),
              reasons: ["weight_change_threshold"],
              patient_complexity: "complex",
              weight_change: weightBlock,
            };
      }
    }
  }

  if (reasons.length === 0) {
    return { riskFlags: [], answersPatch: {} };
  }

  riskFlags.unshift("auto_complex_patient");

  return {
    riskFlags,
    answersPatch: {
      patient_complexity: "complex",
      auto_complex: payload ?? {
        detectedAt: new Date().toISOString(),
        reasons,
        patient_complexity: "complex",
      },
    },
  };
}

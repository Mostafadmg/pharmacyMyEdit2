import type { Consultation } from "@workspace/api-client-react";
import { resolveConsultationWeightKg } from "@/lib/orderPatientUi";
import { isInjectableWeightLossOrder } from "@/lib/clinicalReview";

/** Matches api-server auto-complex thresholds. */
export const WEIGHT_CHANGE_KG_THRESHOLD = 10;
export const WEIGHT_CHANGE_PCT_THRESHOLD = 7;

export type Glp1Medicine = "mounjaro" | "wegovy" | "saxenda";

export type AutoComplexAlertKind =
  | "weight_change"
  | "medication_switch"
  | "stored";

export type AutoComplexAlert = {
  kind: AutoComplexAlertKind;
  isComplexPatient: true;
  headline: string;
  detail: string;
  pctChange?: number;
  deltaKg?: number;
  currentWeightKg?: number;
  previousWeightKg?: number;
  previousOrderDate?: string;
  fromMedicine?: Glp1Medicine;
  toMedicine?: Glp1Medicine;
  reasons: string[];
};

const GLP1_PATTERNS: { id: Glp1Medicine; re: RegExp }[] = [
  { id: "mounjaro", re: /mounjaro|tirzepatide/i },
  { id: "wegovy", re: /wegovy|semaglutide|ozempic/i },
  { id: "saxenda", re: /saxenda|liraglutide/i },
];

const MEDICINE_LABEL: Record<Glp1Medicine, string> = {
  mounjaro: "Mounjaro",
  wegovy: "Wegovy",
  saxenda: "Saxenda",
};

export function hasAutoComplexRiskFlags(c: Consultation): boolean {
  const flags = (c as { riskFlags?: string[] }).riskFlags ?? [];
  return flags.includes("auto_complex_patient");
}

function normalizeGlp1Medicine(source: unknown): Glp1Medicine | null {
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

export function extractGlp1Medicine(c: Consultation): Glp1Medicine | null {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const fromPlan = normalizeGlp1Medicine(answers.selected_plan);
  if (fromPlan) return fromPlan;
  const fromRequested = normalizeGlp1Medicine(answers.requested_medication);
  if (fromRequested) return fromRequested;
  const items = (c.prescriptionItems ?? []) as Array<{ name?: string; strength?: string }>;
  for (const item of items) {
    const hit = normalizeGlp1Medicine(`${item.name ?? ""} ${item.strength ?? ""}`);
    if (hit) return hit;
  }
  const fromDose = normalizeGlp1Medicine(answers.current_dose);
  if (fromDose) return fromDose;
  return normalizeGlp1Medicine(c.conditionName);
}

function isMounjaroWegovySwitch(
  current: Glp1Medicine | null,
  previous: Glp1Medicine | null,
): boolean {
  if (!current || !previous || current === previous) return false;
  const pair = new Set([current, previous]);
  return pair.has("mounjaro") && pair.has("wegovy");
}

function priorConsultationForOrder(
  current: Consultation,
  related: Consultation[],
): Consultation | null {
  if (current.previousConsultationId) {
    const linked = related.find((c) => c.id === current.previousConsultationId);
    if (linked && linked.id !== current.id) return linked;
  }
  const samePatient = related
    .filter(
      (c) =>
        c.patientEmail.toLowerCase() === current.patientEmail.toLowerCase() &&
        !c.id.endsWith("-prior") &&
        c.id !== current.id,
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const older = samePatient.filter(
    (c) => new Date(c.createdAt).getTime() < new Date(current.createdAt).getTime(),
  );
  return older.length > 0 ? older[older.length - 1]! : null;
}

function priorApprovedConsultation(
  current: Consultation,
  related: Consultation[],
): Consultation | null {
  const approved = related
    .filter(
      (c) =>
        c.patientEmail.toLowerCase() === current.patientEmail.toLowerCase() &&
        c.id !== current.id &&
        c.status === "approved" &&
        new Date(c.createdAt).getTime() < new Date(current.createdAt).getTime(),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  return approved[0] ?? null;
}

function alertsFromStoredAutoComplex(c: Consultation): AutoComplexAlert[] {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const stored = answers.auto_complex;
  if (!stored || typeof stored !== "object") return [];

  const block = stored as Record<string, unknown>;
  const reasons = Array.isArray(block.reasons)
    ? block.reasons.map(String)
    : hasAutoComplexRiskFlags(c)
      ? ["auto_complex_patient"]
      : [];

  if (
    reasons.length === 0 &&
    answers.patient_complexity !== "complex" &&
    !hasAutoComplexRiskFlags(c)
  ) {
    return [];
  }

  const out: AutoComplexAlert[] = [];

  const med = block.medication_switch as Record<string, unknown> | undefined;
  if (med && typeof med.from === "string" && typeof med.to === "string") {
    const from = med.from as Glp1Medicine;
    const to = med.to as Glp1Medicine;
    out.push({
      kind: "medication_switch",
      isComplexPatient: true,
      reasons,
      headline: "Complex patient — GLP-1 medication switch",
      detail: `Switched from ${MEDICINE_LABEL[from] ?? med.from} to ${MEDICINE_LABEL[to] ?? med.to} since last approved order${typeof med.priorOrderDate === "string" ? ` (${med.priorOrderDate})` : ""}.`,
      fromMedicine: from,
      toMedicine: to,
      previousOrderDate:
        typeof med.priorOrderDate === "string" ? med.priorOrderDate : undefined,
    });
  }

  const weight = block.weight_change as Record<string, unknown> | undefined;
  if (
    weight &&
    typeof weight.currentWeightKg === "number" &&
    typeof weight.previousWeightKg === "number"
  ) {
    const cur = weight.currentWeightKg;
    const prev = weight.previousWeightKg;
    const deltaKg =
      typeof weight.deltaKg === "number"
        ? weight.deltaKg
        : Math.abs(cur - prev);
    const deltaPct =
      typeof weight.deltaPct === "number"
        ? weight.deltaPct
        : prev > 0
          ? Math.round((deltaKg / prev) * 1000) / 10
          : 0;
    const signedPct =
      Math.round(((cur - prev) / prev) * 1000) / 10;
    out.push({
      kind: "weight_change",
      isComplexPatient: true,
      reasons,
      pctChange: signedPct,
      deltaKg,
      currentWeightKg: cur,
      previousWeightKg: prev,
      previousOrderDate:
        typeof weight.priorOrderDate === "string"
          ? weight.priorOrderDate
          : undefined,
      headline: "Complex patient — significant weight change since last order",
      detail: `${deltaKg.toFixed(1)} kg (${deltaPct}%) since previous order (${prev.toFixed(1)} kg → ${cur.toFixed(1)} kg). Threshold: ≥${WEIGHT_CHANGE_KG_THRESHOLD} kg or ≥${WEIGHT_CHANGE_PCT_THRESHOLD}%.`,
    });
  }

  if (out.length === 0 && (hasAutoComplexRiskFlags(c) || answers.patient_complexity === "complex")) {
    out.push({
      kind: "stored",
      isComplexPatient: true,
      reasons,
      headline: "Complex patient — auto-detected at submission",
      detail: reasons.length
        ? reasons.map((r) => r.replace(/_/g, " ")).join("; ")
        : "Review clinical history before approval.",
    });
  }

  return out;
}

function evaluateWeightChangeClient(
  current: Consultation,
  related: Consultation[],
): AutoComplexAlert | null {
  const currentWeight = resolveConsultationWeightKg(current);
  if (currentWeight == null || currentWeight <= 0) return null;

  const prior = priorConsultationForOrder(current, related);
  if (!prior) return null;

  const previousWeight = resolveConsultationWeightKg(prior);
  if (previousWeight == null || previousWeight <= 0) return null;

  const deltaKg = Math.abs(currentWeight - previousWeight);
  const deltaPct = (deltaKg / previousWeight) * 100;
  if (
    deltaKg < WEIGHT_CHANGE_KG_THRESHOLD &&
    deltaPct < WEIGHT_CHANGE_PCT_THRESHOLD
  ) {
    return null;
  }

  const previousOrderDate = new Date(prior.createdAt).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
  const signedPct =
    Math.round(((currentWeight - previousWeight) / previousWeight) * 1000) /
    10;

  return {
    kind: "weight_change",
    isComplexPatient: true,
    reasons: ["weight_change_threshold"],
    pctChange: signedPct,
    deltaKg: Math.round(deltaKg * 10) / 10,
    currentWeightKg: currentWeight,
    previousWeightKg: previousWeight,
    previousOrderDate,
    headline: "Complex patient — significant weight change since last order",
    detail: `${deltaKg.toFixed(1)} kg (${Math.round(deltaPct * 10) / 10}%) since previous order (${previousWeight.toFixed(1)} kg → ${currentWeight.toFixed(1)} kg). Threshold: ≥${WEIGHT_CHANGE_KG_THRESHOLD} kg or ≥${WEIGHT_CHANGE_PCT_THRESHOLD}%.`,
  };
}

function evaluateMedicationSwitchClient(
  current: Consultation,
  related: Consultation[],
): AutoComplexAlert | null {
  const currentMed = extractGlp1Medicine(current);
  if (!currentMed) return null;

  const priorApproved = priorApprovedConsultation(current, related);
  if (!priorApproved) return null;

  const priorMed = extractGlp1Medicine(priorApproved);
  if (!isMounjaroWegovySwitch(currentMed, priorMed)) return null;

  const previousOrderDate = new Date(priorApproved.createdAt).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );

  return {
    kind: "medication_switch",
    isComplexPatient: true,
    reasons: ["medication_switch_mounjaro_wegovy"],
    fromMedicine: priorMed!,
    toMedicine: currentMed,
    previousOrderDate,
    headline: "Complex patient — GLP-1 medication switch",
    detail: `Switched from ${MEDICINE_LABEL[priorMed!]} to ${MEDICINE_LABEL[currentMed]} since last approved order (${previousOrderDate}).`,
  };
}

/** Prefer server-persisted auto_complex; fall back to client evaluation for older rows. */
export function evaluateAutoComplexPatient(
  current: Consultation,
  related: Consultation[] = [],
): AutoComplexAlert[] {
  if (!isInjectableWeightLossOrder(current)) return [];

  const stored = alertsFromStoredAutoComplex(current);
  if (stored.length > 0) return stored;

  const alerts: AutoComplexAlert[] = [];
  const med = evaluateMedicationSwitchClient(current, related);
  if (med) alerts.push(med);

  const weight = evaluateWeightChangeClient(current, related);
  if (weight) alerts.push(weight);

  return alerts;
}

/** All auto-complex alerts for flags / tags (alias for call sites). */
export function evaluateAllAutoComplexAlerts(
  current: Consultation,
  related: Consultation[] = [],
): AutoComplexAlert[] {
  return evaluateAutoComplexPatient(current, related);
}

/** Primary banner alert — medication switch takes precedence over weight. */
export function primaryAutoComplexAlert(
  current: Consultation,
  related: Consultation[] = [],
): AutoComplexAlert | null {
  const all = evaluateAutoComplexPatient(current, related);
  return (
    all.find((a) => a.kind === "medication_switch") ??
    all.find((a) => a.kind === "weight_change") ??
    all[0] ??
    null
  );
}

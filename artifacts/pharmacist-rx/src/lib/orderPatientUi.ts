import type { Consultation } from "@workspace/api-client-react";

/** Catalogue names include medicine options in brackets for patients — strip for order views. */
export function shortConditionName(conditionName: string): string {
  return conditionName.replace(/\s*\([^)]*\)\s*$/, "").trim() || conditionName;
}

export type PatientJourneyType = "new_starter" | "transfer" | "simple_repeat";

export function getPatientJourneyType(c: Consultation): PatientJourneyType {
  if (!c.previousConsultationId) return "new_starter";
  if (c.status === "patient_responded" || c.status === "more_info_needed") {
    return "transfer";
  }
  return "simple_repeat";
}

export const JOURNEY_BADGE: Record<
  PatientJourneyType,
  { label: string; className: string; dotClassName: string }
> = {
  new_starter: {
    label: "New starter",
    className: "bg-primary/10 text-primary border-primary/25",
    dotClassName: "bg-primary",
  },
  transfer: {
    label: "Transfer patient",
    className:
      "bg-violet-500/10 text-violet-800 border-violet-500/25 dark:text-violet-200",
    dotClassName: "bg-violet-500",
  },
  simple_repeat: {
    label: "Simple repeat",
    className: "bg-sky-500/10 text-sky-800 border-sky-500/25 dark:text-sky-200",
    dotClassName: "bg-sky-500",
  },
};

const DOB_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatPatientDob(opts: {
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  patientAge?: number | null;
}): string {
  const { dobDay, dobMonth, dobYear, patientAge } = opts;
  if (dobDay && dobMonth && dobYear) {
    const month =
      DOB_MONTHS[Number(dobMonth) - 1] ?? `Month ${dobMonth}`;
    return `${dobDay} ${month} ${dobYear}`;
  }
  if (dobYear) {
    return patientAge != null
      ? `${dobYear} · ${patientAge} yrs`
      : `Born ${dobYear}`;
  }
  if (patientAge != null) return `${patientAge} years old`;
  return "—";
}

export function parseOrderMedication(c: Consultation): {
  title: string;
  subtitle: string;
  doseLabel: string | null;
  qty: number;
} {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const items = (c.prescriptionItems ?? []) as Array<{
    name: string;
    strength: string;
    quantity: string;
    form: string;
  }>;

  let title = shortConditionName(c.conditionName);
  let subtitle = c.conditionId;
  let doseLabel: string | null = null;
  let qty = 1;

  const currentDose =
    typeof answers.current_dose === "string" ? answers.current_dose : null;
  if (currentDose) doseLabel = currentDose.replace(/^Mounjaro |^Wegovy /i, "");

  if (items.length === 1) {
    const it = items[0]!;
    title = it.name;
    doseLabel = it.strength || doseLabel;
    subtitle = it.form || c.conditionName;
    qty = Number.parseInt(String(it.quantity), 10) || 1;
  } else if (items.length > 1) {
    title = items.map((i) => i.name).join(" · ");
    subtitle = items.map((i) => i.strength).filter(Boolean).join(" · ");
    qty =
      items.reduce(
        (s, i) => s + (Number.parseInt(String(i.quantity), 10) || 0),
        0,
      ) || items.length;
  }

  return { title, subtitle, doseLabel, qty };
}

export function bmiHighlightClass(bmi: number): string {
  if (bmi >= 35) return "text-rose-600 dark:text-rose-400";
  if (bmi >= 30) return "text-amber-600 dark:text-amber-400";
  if (bmi >= 25) return "text-emerald-600 dark:text-emerald-400";
  return "text-foreground";
}

export function bmiBandShort(bmi: number): string {
  if (bmi >= 40) return "Class III";
  if (bmi >= 35) return "Class II";
  if (bmi >= 30) return "Class I";
  if (bmi >= 25) return "Overweight";
  return "Normal";
}

export const ETHNICITY_LABELS: Record<string, string> = {
  asian: "Asian or Asian British",
  black: "Black, African, Caribbean or Black British",
  "middle-eastern": "Middle Eastern",
  mixed: "Mixed or Multiple Ethnicities",
  white: "White",
  other: "Other ethnic group",
  "prefer-not-to-say": "Prefer not to say",
};

export function resolveConsultationHeightCm(c: Consultation): number | null {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  if (typeof answers.height_cm === "number" && Number.isFinite(answers.height_cm)) {
    return answers.height_cm;
  }
  if (c.verifiedHeightCm != null && Number.isFinite(Number(c.verifiedHeightCm))) {
    return Number(c.verifiedHeightCm);
  }
  const legacy = (c as { heightCm?: number | null }).heightCm;
  if (legacy != null && Number.isFinite(Number(legacy))) {
    return Number(legacy);
  }
  return null;
}

export function resolveConsultationBmi(c: Consultation): number | null {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const fromAnswers = answers.bmi;
  if (typeof fromAnswers === "number" && Number.isFinite(fromAnswers)) {
    return fromAnswers;
  }
  if (c.bmi != null && Number.isFinite(Number(c.bmi))) {
    return Number(c.bmi);
  }
  const heightCm = resolveConsultationHeightCm(c);
  const weightKg = resolveConsultationWeightKg(c);
  if (heightCm != null && weightKg != null && heightCm > 0) {
    const h = heightCm / 100;
    return Math.round((weightKg / (h * h)) * 10) / 10;
  }
  return null;
}

export function bmiVerdictLabel(bmi: number): {
  label: string;
  className: string;
} {
  if (bmi >= 40) return { label: "OBESE (CLASS III)", className: "text-rose-600 dark:text-rose-400" };
  if (bmi >= 35) return { label: "OBESE (CLASS II)", className: "text-rose-600 dark:text-rose-400" };
  if (bmi >= 30) return { label: "OBESE", className: "text-rose-600 dark:text-rose-400" };
  if (bmi >= 25) return { label: "OVERWEIGHT", className: "text-amber-600 dark:text-amber-400" };
  if (bmi >= 18.5) return { label: "HEALTHY WEIGHT", className: "text-primary" };
  return { label: "UNDERWEIGHT", className: "text-sky-600 dark:text-sky-400" };
}

export function resolveConsultationWeightKg(c: Consultation): number | null {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const fromAnswers = answers.weight_kg;
  if (typeof fromAnswers === "number" && Number.isFinite(fromAnswers)) {
    return fromAnswers;
  }
  if (
    c.verifiedWeightKg != null &&
    Number.isFinite(Number(c.verifiedWeightKg))
  ) {
    return Number(c.verifiedWeightKg);
  }
  const legacy = (c as { weightKg?: number | null }).weightKg;
  if (legacy != null && Number.isFinite(Number(legacy))) {
    return Number(legacy);
  }
  return null;
}

export function formatEthnicityLabel(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  return (
    ETHNICITY_LABELS[raw] ??
    raw
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/** e.g. `85.2 kg · 187.8 lb · 13 st 5 lb` */
export function formatWeightAllUnits(kg: number | null): string {
  if (kg == null || !Number.isFinite(kg) || kg <= 0) {
    return "Weight not recorded";
  }
  const lbsTotal = kg * 2.2046226218;
  const stone = Math.floor(lbsTotal / 14);
  const lbRem = Math.round((lbsTotal - stone * 14) * 10) / 10;
  return `${kg.toFixed(1)} kg · ${lbsTotal.toFixed(1)} lb · ${stone} st ${lbRem} lb`;
}

export function statusPillForConsultation(status: Consultation["status"]): {
  label: string;
  cls: string;
  dotCls: string;
} {
  switch (status) {
    case "pending":
      return {
        label: "Awaiting Review",
        cls: "bg-rx-cs-surface0/10 text-amber-800 border-amber-500/25 dark:text-amber-200",
        dotCls: "bg-rx-cs-surface0",
      };
    case "more_info_needed":
      return {
        label: "More info needed",
        cls: "bg-rx-cs-surface0/10 text-amber-800 border-amber-500/25 dark:text-amber-200",
        dotCls: "bg-rx-cs-surface0",
      };
    case "approved":
      return {
        label: "Approved",
        cls: "bg-primary/10 text-primary border-primary/25",
        dotCls: "bg-primary",
      };
    case "rejected":
      return {
        label: "Rejected",
        cls: "bg-rx-decline-surface0/10 text-rose-800 border-rose-500/25 dark:text-rose-200",
        dotCls: "bg-rx-decline-surface0",
      };
    case "referred":
      return {
        label: "Referred",
        cls: "bg-sky-500/10 text-sky-800 border-sky-500/25 dark:text-sky-200",
        dotCls: "bg-sky-500",
      };
    case "red_flag":
      return {
        label: "Red flag",
        cls: "bg-rx-decline-surface0/10 text-rose-800 border-rose-500/25 dark:text-rose-200",
        dotCls: "bg-rx-decline-surface0",
      };
    case "patient_responded":
      return {
        label: "Patient responded",
        cls: "bg-violet-500/10 text-violet-800 border-violet-500/25 dark:text-violet-200",
        dotCls: "bg-violet-500",
      };
    default:
      return {
        label: "Re-Review",
        cls: "bg-rx-decline-surface0/10 text-rose-800 border-rose-500/25 dark:text-rose-200",
        dotCls: "bg-rx-decline-surface0",
      };
  }
}

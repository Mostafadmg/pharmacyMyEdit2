import type { Consultation } from "@workspace/api-client-react";
import { isInjectableWeightLossOrder } from "./clinicalReview";

export type MeasurementLogEntry = {
  id: string;
  date: Date;
  dateLabel: string;
  monthLabel: string;
  medication: string;
  doseMg: number;
  doseDisplay: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiBand: string;
  weightChangeKg: number | null;
  isCurrent: boolean;
  isBaseline: boolean;
  orderIndex: number;
};

export function calcBmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function bmiBandLabel(bmi: number): string {
  if (bmi >= 40) return "Obese (Class III)";
  if (bmi >= 35) return "Obese (Class II)";
  if (bmi >= 30) return "Obese (Class I)";
  if (bmi >= 25) return "Overweight";
  if (bmi >= 18.5) return "Healthy weight";
  return "Underweight";
}

export function doseBadgeClass(doseMg: number): string {
  if (doseMg <= 2.5) return "bg-rx-approve-surface text-primary border-border";
  if (doseMg <= 5) return "bg-teal-50 text-teal-800 border-teal-200";
  if (doseMg <= 7.5) return "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-200";
  if (doseMg <= 10) return "bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-200";
  if (doseMg <= 12.5) return "bg-rx-decline-surface text-rx-decline border-rx-decline-border";
  return "bg-red-50 text-red-800 border-red-200";
}

function parseDoseMg(raw: string | null | undefined): number {
  if (!raw) return 2.5;
  const m = raw.match(/(\d+(?:\.\d+)?)\s*mg/i);
  return m ? Number.parseFloat(m[1]!) : 2.5;
}

function parseMedication(
  c: Consultation,
  answers: Record<string, unknown>,
): string {
  const fromAnswers = answers.requested_medication;
  if (typeof fromAnswers === "string" && fromAnswers.trim()) return fromAnswers;
  if (c.conditionName.toLowerCase().includes("wegovy")) return "Wegovy";
  return "Mounjaro";
}

function readMetrics(c: Consultation, answers: Record<string, unknown>) {
  const heightCm =
    typeof answers.height_cm === "number"
      ? answers.height_cm
      : typeof answers.heightCm === "number"
        ? answers.heightCm
        : (c.verifiedHeightCm ?? c.heightCm ?? 170);
  const weightKg =
    typeof answers.weight_kg === "number"
      ? answers.weight_kg
      : typeof answers.weightKg === "number"
        ? answers.weightKg
        : (c.verifiedWeightKg ?? c.weightKg ?? 90);
  const bmiRaw =
    typeof answers.bmi === "number"
      ? answers.bmi
      : c.bmi != null
        ? Number(c.bmi)
        : calcBmi(weightKg, heightCm);
  return { heightCm, weightKg, bmi: Number(bmiRaw) };
}

function consultToEntry(
  c: Consultation,
  opts: { isCurrent: boolean; orderIndex: number },
): MeasurementLogEntry | null {
  if (c.id.endsWith("-prior")) return null;
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const medication = parseMedication(c, answers);
  const doseRaw =
    (typeof answers.current_dose === "string" ? answers.current_dose : null) ??
    (c.prescriptionItems?.[0] as { strength?: string } | undefined)?.strength ??
    c.prescription ??
    "";
  const doseMg = parseDoseMg(doseRaw);
  const { heightCm, weightKg, bmi } = readMetrics(c, answers);
  const date = new Date(c.createdAt);
  return {
    id: c.id,
    date,
    dateLabel: date.toLocaleDateString("en-GB"),
    monthLabel: "",
    medication,
    doseMg,
    doseDisplay: `${doseMg} mg`,
    heightCm,
    weightKg: Math.round(weightKg * 10) / 10,
    bmi: Math.round(bmi * 10) / 10,
    bmiBand: bmiBandLabel(bmi),
    weightChangeKg: null,
    isCurrent: opts.isCurrent,
    isBaseline: false,
    orderIndex: opts.orderIndex,
  };
}

function orderLabelForEntry(
  index: number,
  total: number,
  isBaseline: boolean,
  isCurrent: boolean,
): string {
  const n = index + 1;
  if (isBaseline && total === 1) return "First order";
  if (isBaseline) return `Order #${n} (First)`;
  if (isCurrent) return `Order #${n} (Current)`;
  return `Order #${n}`;
}

function enrichChangeLabels(entries: MeasurementLogEntry[]): MeasurementLogEntry[] {
  return entries.map((e, i) => {
    const prev = entries[i - 1];
    const weightChangeKg =
      prev != null ? Math.round((e.weightKg - prev.weightKg) * 10) / 10 : null;
    const monthLabel = orderLabelForEntry(
      i,
      entries.length,
      e.isBaseline,
      e.isCurrent,
    );
    return { ...e, weightChangeKg, monthLabel, orderIndex: i + 1 };
  });
}

export function buildMeasurementLog(
  current: Consultation,
  related: Consultation[] = [],
): MeasurementLogEntry[] {
  if (!isInjectableWeightLossOrder(current)) return [];

  const samePatient = related
    .filter(
      (x) =>
        x.patientEmail === current.patientEmail &&
        !x.id.endsWith("-prior") &&
        (x.conditionId === "weight-loss" ||
          /mounjaro|wegovy|weight/i.test(x.conditionName)),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const fromDb: MeasurementLogEntry[] = [];
  for (let i = 0; i < samePatient.length; i++) {
    const row = consultToEntry(samePatient[i]!, {
      isCurrent: samePatient[i]!.id === current.id,
      orderIndex: i + 1,
    });
    if (row) fromDb.push(row);
  }

  let entries: MeasurementLogEntry[];
  if (fromDb.length >= 1) {
    entries = fromDb.map((e) => ({
      ...e,
      isCurrent: e.id === current.id,
    }));
  } else {
    const single = consultToEntry(current, { isCurrent: true, orderIndex: 1 });
    entries = single ? [single] : [];
  }

  entries = enrichChangeLabels(entries);
  const currentIdx = entries.findIndex((e) => e.isCurrent);
  if (currentIdx >= 0) {
    entries = entries.map((e, i) => ({
      ...e,
      isCurrent: i === currentIdx,
      isBaseline: i === 0,
    }));
  } else if (entries.length > 0) {
    entries[entries.length - 1]!.isCurrent = true;
  }
  return entries;
}

export function overallWeightLossPct(
  entries: MeasurementLogEntry[],
): number | null {
  if (entries.length < 2) return null;
  const first = entries[0]!;
  const last = entries[entries.length - 1]!;
  if (first.weightKg <= 0) return null;
  return (
    Math.round(
      ((first.weightKg - last.weightKg) / first.weightKg) * 1000,
    ) / 10
  );
}

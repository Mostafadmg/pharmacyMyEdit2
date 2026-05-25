import type { Consultation } from "@workspace/api-client-react";

export type RxItem = {
  name: string;
  strength: string;
  form: string;
  quantity: string;
  sig: string;
  duration: string;
  notes?: string;
};

const DEFAULT_ITEM: RxItem = {
  name: "",
  strength: "",
  form: "Injection",
  quantity: "1",
  sig: "As directed",
  duration: "28 days",
};

/** Prescription lines to send on approve — stored items or consultation answers fallback. */
export function getConsultationRxItems(consultation: Consultation): RxItem[] {
  const raw = (consultation.prescriptionItems ?? []) as RxItem[];
  if (raw.length > 0) {
    return raw.map((it) => ({
      name: it.name ?? "",
      strength: it.strength ?? "",
      form: it.form ?? "Supply",
      quantity: String(it.quantity ?? "1"),
      sig: it.sig ?? "As directed",
      duration: it.duration ?? "28 days",
      notes: it.notes,
    }));
  }

  const answers = (consultation.answers ?? {}) as Record<string, unknown>;
  const plan =
    typeof answers.selected_plan === "string"
      ? answers.selected_plan
      : consultation.conditionName;
  return [
    {
      ...DEFAULT_ITEM,
      name: plan.split("·")[0]?.trim() || consultation.conditionName,
      strength:
        typeof answers.current_dose === "string" ? answers.current_dose : "",
    },
  ];
}

export function validatePrescriptionItemsForApproval(
  items: RxItem[],
): string | null {
  if (items.length === 0) {
    return "Set the prescribed medication on this order before approving.";
  }
  const incomplete = items.find(
    (it) => !it.name.trim() || !it.strength.trim() || !it.sig.trim(),
  );
  if (incomplete) {
    return "Each prescription item needs a medication name, strength, and dosing instructions (sig).";
  }
  return null;
}

export function reviewActionErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    const match = err.message.match(/:\s*(.+)$/);
    return match?.[1]?.trim() ?? err.message;
  }
  return "Failed to submit action. Please try again.";
}

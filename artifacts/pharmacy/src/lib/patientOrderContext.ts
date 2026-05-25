/** Catalogue names include medicine options in brackets for patients — strip for order views. */
export function shortConditionName(conditionName: string): string {
  return conditionName.replace(/\s*\([^)]*\)\s*$/, "").trim() || conditionName;
}

export type PatientOrderMeta = {
  id: string;
  conditionName: string;
  status: string;
  createdAt: string;
  prescriptionItems?: Array<{
    name?: string;
    strength?: string;
    quantity?: string;
  }>;
};

export function orderRefFromConsultationId(id: string): string {
  return `#${id.replace(/-/g, "").toUpperCase().slice(-5)}`;
}

export function patientOrderStatusLabel(status: string): string {
  switch (status) {
    case "approved":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "more_info_needed":
      return "Action needed";
    case "patient_responded":
      return "Awaiting review";
    case "red_flag":
      return "Under review";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function patientOrderStatusTone(
  status: string,
): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
    case "cancelled":
      return "danger";
    case "more_info_needed":
    case "red_flag":
      return "warning";
    case "patient_responded":
      return "info";
    default:
      return "neutral";
  }
}

export function medicationLabelFromOrder(c: PatientOrderMeta): string {
  const items = c.prescriptionItems ?? [];
  if (items.length > 0) {
    const first = items[0]!;
    const name = (first.name ?? "").trim();
    const strength = (first.strength ?? "").trim();
    if (name && strength) return `${name} · ${strength}`;
    if (name) return name;
  }
  const short = shortConditionName(c.conditionName);
  return short || c.conditionName;
}

export function formatOrderPlacedShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildOrderContextLine(c: PatientOrderMeta): string {
  return `${orderRefFromConsultationId(c.id)} · ${medicationLabelFromOrder(c)}`;
}

export function patientMessagesHref(consultationId?: string | null): string {
  if (!consultationId) return "/my-messages";
  return `/my-messages?consultation=${encodeURIComponent(consultationId)}`;
}

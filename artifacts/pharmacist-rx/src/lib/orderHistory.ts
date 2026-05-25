import type { Consultation } from "@workspace/api-client-react";
import { parseOrderMedication } from "@/lib/orderPatientUi";

export type OrderHistoryFilter =
  | "All"
  | "Fulfilled"
  | "Unfulfilled"
  | "Pending"
  | "Cancelled";

export function orderRefFromId(
  id: string,
  consultationNumber?: string | null,
): string {
  if (consultationNumber?.trim()) return consultationNumber.trim();
  return "#" + id.replace(/-/g, "").toUpperCase().slice(-5);
}

export function formatOrderHistoryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatHistoryMedication(c: Consultation): string {
  const med = parseOrderMedication(c);
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const weeks =
    typeof answers.treatment_weeks === "string"
      ? answers.treatment_weeks
      : typeof answers.dose_weeks === "string"
        ? answers.dose_weeks
        : null;

  let line = med.title;
  if (med.doseLabel) {
    line += ` — ${med.doseLabel}`;
  }
  if (weeks) {
    line += ` (${weeks})`;
  }
  return line;
}

export function orderHistoryFilterBucket(
  status: Consultation["status"],
): Exclude<OrderHistoryFilter, "All"> {
  switch (status) {
    case "approved":
      return "Fulfilled";
    case "rejected":
    case "red_flag":
      return "Cancelled";
    case "pending":
    case "more_info_needed":
    case "patient_responded":
    case "referred":
      return "Pending";
    default:
      return "Unfulfilled";
  }
}

export type OrderHistoryDisplayStatus = {
  label: string;
  tone: "fulfilled" | "pending" | "cancelled" | "other";
};

export function orderHistoryDisplayStatus(
  status: Consultation["status"],
): OrderHistoryDisplayStatus {
  switch (status) {
    case "approved":
      return { label: "Fulfilled", tone: "fulfilled" };
    case "rejected":
    case "red_flag":
      return { label: "Cancelled", tone: "cancelled" };
    case "pending":
    case "more_info_needed":
    case "patient_responded":
      return { label: "Pending Clinical Check", tone: "pending" };
    case "referred":
      return { label: "Referred", tone: "other" };
    default:
      return { label: "Unfulfilled", tone: "other" };
  }
}

export function sortOrdersForHistory(orders: Consultation[]): Consultation[] {
  return [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function filterOrdersByHistoryTab(
  orders: Consultation[],
  filter: OrderHistoryFilter,
): Consultation[] {
  if (filter === "All") return orders;
  return orders.filter((o) => orderHistoryFilterBucket(o.status) === filter);
}

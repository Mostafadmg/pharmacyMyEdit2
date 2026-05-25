import type { Consultation } from "@workspace/api-client-react";
import {
  hasWaitTagKind,
  isWaitingOnPatient,
  type CustomerWaitTagKind,
} from "@/lib/orderWaitingTags";
import { hasAutoComplexRiskFlags } from "@/lib/autoComplexPatient";

export type TypeFilter =
  | "all"
  | "new_starter"
  | "transfer"
  | "simple_repeat"
  | "complex";
export type CsWaitSubFilter = "all" | CustomerWaitTagKind;

export type QueueCategory =
  | "all"
  | "needs_approval"
  | "cs_hold"
  | "prescriber_hold"
  | "re_review"
  | "clinical_check"
  | "urgent_approval"
  | "urgent_dispatch";

export const QUEUE_CATEGORY_LABELS: Record<QueueCategory, string> = {
  all: "All Orders",
  needs_approval: "Needs Approval",
  cs_hold: "CS On Hold",
  prescriber_hold: "Prescriber Hold",
  re_review: "Re-Review",
  clinical_check: "Clinical Check",
  urgent_approval: "Urgent Approval",
  urgent_dispatch: "Urgent Dispatch",
};

export type QueueContext = {
  category: QueueCategory;
  typeFilter: TypeFilter;
  csSubFilter: CsWaitSubFilter;
  search: string;
};

const QUEUE_CATEGORIES = new Set<string>(Object.keys(QUEUE_CATEGORY_LABELS));
const TYPE_FILTERS = new Set<string>([
  "all",
  "new_starter",
  "transfer",
  "simple_repeat",
  "complex",
]);
const CS_SUB_FILTERS = new Set<string>([
  "all",
  "pending_customer_response",
  "pending_document_upload",
]);

function isQueueCategory(v: string | null): v is QueueCategory {
  return v != null && QUEUE_CATEGORIES.has(v);
}

function isTypeFilter(v: string | null): v is TypeFilter {
  return v != null && TYPE_FILTERS.has(v);
}

function isCsSubFilter(v: string | null): v is CsWaitSubFilter {
  return v != null && CS_SUB_FILTERS.has(v);
}

export function getQueueCategory(
  c: Consultation,
): Exclude<QueueCategory, "all"> {
  const note = (c.pharmacistNote ?? "").toUpperCase();

  if (c.status === "patient_responded") return "re_review";

  if (isWaitingOnPatient(c)) return "cs_hold";

  if (c.status === "more_info_needed") {
    if (note.startsWith("[CS_HOLD]")) return "cs_hold";
    if (note.startsWith("[PRESCRIBER_HOLD]")) return "prescriber_hold";
    return "prescriber_hold";
  }

  if (c.status === "pending") {
    return c.hasRedFlag ? "urgent_approval" : "needs_approval";
  }

  if (c.status === "approved") {
    return c.dispatchedAt
      ? "urgent_dispatch"
      : c.hasRedFlag
        ? "urgent_approval"
        : "clinical_check";
  }

  if (c.status === "red_flag") return "urgent_approval";

  return "clinical_check";
}

export function getQueueTypeLabel(c: Consultation): string {
  if (c.previousConsultationId) {
    if (c.status === "patient_responded" || c.status === "more_info_needed") {
      return "Transfer";
    }
    return "Simple Repeat";
  }
  return "New Starter";
}

function isComplexQueuePatient(c: Consultation): boolean {
  if (hasAutoComplexRiskFlags(c)) return true;
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  return answers.patient_complexity === "complex";
}

function matchesTypeFilter(c: Consultation, typeFilter: TypeFilter): boolean {
  if (typeFilter === "all") return true;
  if (typeFilter === "complex") return isComplexQueuePatient(c);
  const t = getQueueTypeLabel(c).toLowerCase().replace(/\s+/g, "_");
  return t === typeFilter;
}

export function filterQueueConsultations(
  rows: Consultation[],
  ctx: QueueContext,
): Consultation[] {
  return rows.filter((c) => {
    if (ctx.search) {
      const hay =
        `${c.patientName} ${c.patientEmail} ${c.conditionName} ${c.id}`.toLowerCase();
      if (!hay.includes(ctx.search.toLowerCase())) return false;
    }
    if (ctx.category !== "all" && getQueueCategory(c) !== ctx.category) {
      return false;
    }
    if (ctx.category === "cs_hold" && ctx.csSubFilter !== "all") {
      if (!hasWaitTagKind(c, ctx.csSubFilter)) return false;
    }
    if (!matchesTypeFilter(c, ctx.typeFilter)) return false;
    return true;
  });
}

export function parseQueueContextFromSearch(
  search: string,
): QueueContext | null {
  const params = new URLSearchParams(search);
  if (!params.has("queue")) return null;
  const category = params.get("queue");
  if (!isQueueCategory(category)) return null;
  const typeRaw = params.get("queueType");
  const csRaw = params.get("queueCs");
  return {
    category,
    typeFilter: isTypeFilter(typeRaw) ? typeRaw : "all",
    csSubFilter: isCsSubFilter(csRaw) ? csRaw : "all",
    search: params.get("queueSearch") ?? "",
  };
}

export function queueContextToSearchParams(ctx: QueueContext): URLSearchParams {
  const params = new URLSearchParams();
  if (ctx.category !== "all") params.set("queue", ctx.category);
  if (ctx.typeFilter !== "all") params.set("queueType", ctx.typeFilter);
  if (ctx.csSubFilter !== "all") params.set("queueCs", ctx.csSubFilter);
  if (ctx.search.trim()) params.set("queueSearch", ctx.search.trim());
  return params;
}

export function buildQueueListHref(ctx: QueueContext): string {
  const params = queueContextToSearchParams(ctx);
  params.set("queue", ctx.category);
  const q = params.toString();
  return q ? `/queue?${q}` : "/queue";
}

/** Preserve clinical-review params (tab, chat) when moving within a queue. */
export function buildOrderDetailHref(
  orderId: string,
  ctx: QueueContext,
  currentSearch = "",
): string {
  const params = new URLSearchParams(currentSearch);
  params.set("queue", ctx.category);
  if (ctx.typeFilter !== "all") params.set("queueType", ctx.typeFilter);
  else params.delete("queueType");
  if (ctx.csSubFilter !== "all") params.set("queueCs", ctx.csSubFilter);
  else params.delete("queueCs");
  if (ctx.search.trim()) params.set("queueSearch", ctx.search.trim());
  else params.delete("queueSearch");
  const q = params.toString();
  return q ? `/orders/${orderId}?${q}` : `/orders/${orderId}`;
}

export function queueNeighbors(
  filtered: Consultation[],
  currentId: string,
): {
  index: number;
  total: number;
  prevId: string | null;
  nextId: string | null;
} {
  const index = filtered.findIndex((c) => c.id === currentId);
  if (index < 0) {
    return { index: -1, total: filtered.length, prevId: null, nextId: null };
  }
  return {
    index,
    total: filtered.length,
    prevId: index > 0 ? filtered[index - 1].id : null,
    nextId:
      index < filtered.length - 1 ? filtered[index + 1].id : null,
  };
}

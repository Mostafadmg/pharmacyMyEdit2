import type { Consultation } from "@workspace/api-client-react";
import {
  isCustomOrderTagId,
  type CustomOrderTag,
} from "@/lib/customOrderTags";
import {
  evaluateAutoComplexPatient,
  hasAutoComplexRiskFlags,
} from "@/lib/autoComplexPatient";
import {
  getPatientJourneyType,
  JOURNEY_BADGE,
} from "@/lib/orderPatientUi";
import {
  WEIGHT_GAIN_ALERT_PCT,
  WEIGHT_LOSS_ALERT_PCT,
  evaluateWeightChangeMonitoring,
} from "@/lib/weightChangeMonitoring";
import { getActiveWaitTags } from "@/lib/orderWaitingTags";

export type HeaderDisplayTag = {
  key: string;
  label: string;
  detail?: string;
  pillCls: string;
  removed?: boolean;
};

/** Prescriber / consultation tags — red pills in order header. */
export const PRESCRIBER_TAG_PILL_CLS =
  "bg-rose-600/10 text-rose-900 border-rose-300/70 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-700";

/** Automatic order / journey badges — forest / journey colours. */
export const JOURNEY_COMPLEX_PILL_CLS =
  "bg-violet-500/10 text-violet-900 border-violet-500/30 dark:text-violet-100";

const CONSULTATION_TYPE_LABELS: Record<string, string> = {
  new_start: "Starter patient",
  new_starter: "Starter patient",
  simple_repeat: "Simple repeat",
  transfer: "Transfer patient",
};

function normalizeTagLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

export type CatalogOrderTagId =
  | "invalid_id_verification"
  | "invalid_full_scale_video"
  | "invalid_weight_scale_video"
  | "pending_customer_response"
  | "previous_bmi_verification_required"
  | "previous_bmi_verification_failed"
  | "previous_use_evidence_required"
  | "previous_use_evidence_invalid"
  | "suspicious_height"
  | "suspicious_bmi"
  | "lost_10_percent"
  | "gained_7_percent";

/** Catalogue tag or pharmacist-defined `custom:<slug>` tag. */
export type OrderTagId = CatalogOrderTagId | `custom:${string}`;

export type OrderTagSource =
  | "manual"
  | "document_reject"
  | "weight_monitoring"
  | "cs_hold"
  | "prescriber_hold"
  | "document_requirement"
  | "system";

export type OrderTagRecord = {
  tagId: string;
  label: string;
  addedAt: string;
  addedBy: string;
  source: OrderTagSource;
  relatedDocId?: string;
  addedNote?: string;
  removedAt?: string | null;
  removedBy?: string | null;
  removedNote?: string;
  /** Shared id when several tags were removed in one save action. */
  removedBatchId?: string;
  /** Shared id when several tags were added in one save action. */
  addedBatchId?: string;
};

export type OrderTagDef = {
  id: CatalogOrderTagId;
  label: string;
  description: string;
  /** Auto-applied by the system when possible */
  auto?: boolean;
  pillCls: string;
};

export type PickerOrderTagDef = {
  id: string;
  label: string;
  description?: string;
  isCustom?: boolean;
  pillCls: string;
};

export const CUSTOM_PICKER_TAG_PILL_CLS =
  "bg-emerald-50 text-emerald-950 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800";

export const ORDER_TAG_DEFS: OrderTagDef[] = [
  {
    id: "invalid_id_verification",
    label: "Invalid ID verification",
    description: "Government ID rejected or unusable",
    auto: true,
    pillCls: "bg-rose-50 text-rose-900 border-rose-200",
  },
  {
    id: "invalid_full_scale_video",
    label: "Invalid full scale video",
    description: "Full body video rejected",
    auto: true,
    pillCls: "bg-rose-50 text-rose-900 border-rose-200",
  },
  {
    id: "invalid_weight_scale_video",
    label: "Invalid weight scale video",
    description: "Weight-on-scales video rejected",
    auto: true,
    pillCls: "bg-rose-50 text-rose-900 border-rose-200",
  },
  {
    id: "pending_customer_response",
    label: "Pending customer response",
    description: "Awaiting reply or action from the patient",
    auto: true,
    pillCls: "bg-amber-50 text-amber-950 border-amber-200",
  },
  {
    id: "previous_bmi_verification_required",
    label: "Previous BMI verification required",
    description: "Prior-order BMI proof requested",
    auto: true,
    pillCls: "bg-sky-50 text-sky-950 border-sky-200",
  },
  {
    id: "previous_bmi_verification_failed",
    label: "Previous BMI verification failed",
    description: "Prior BMI evidence rejected",
    auto: true,
    pillCls: "bg-rose-50 text-rose-900 border-rose-200",
  },
  {
    id: "previous_use_evidence_required",
    label: "Previous use evidence required",
    description: "Transfer / prior-use proof requested",
    auto: true,
    pillCls: "bg-sky-50 text-sky-950 border-sky-200",
  },
  {
    id: "previous_use_evidence_invalid",
    label: "Previous use evidence invalid",
    description: "Prior prescription or transfer proof rejected",
    auto: true,
    pillCls: "bg-rose-50 text-rose-900 border-rose-200",
  },
  {
    id: "suspicious_height",
    label: "Suspicious height",
    description: "Height flagged for clinical review",
    pillCls: "bg-orange-50 text-orange-950 border-orange-200",
  },
  {
    id: "suspicious_bmi",
    label: "Suspicious BMI",
    description: "BMI flagged for clinical review",
    pillCls: "bg-orange-50 text-orange-950 border-orange-200",
  },
  {
    id: "lost_10_percent",
    label: "Lost 10%",
    description: `≥${WEIGHT_LOSS_ALERT_PCT}% weight loss vs previous order`,
    auto: true,
    pillCls: "bg-violet-50 text-violet-950 border-violet-200",
  },
  {
    id: "gained_7_percent",
    label: "Gained 7%",
    description: `≥${WEIGHT_GAIN_ALERT_PCT}% weight gain vs previous order`,
    auto: true,
    pillCls: "bg-violet-50 text-violet-950 border-violet-200",
  },
];

export const ORDER_TAG_BY_ID = Object.fromEntries(
  ORDER_TAG_DEFS.map((d) => [d.id, d]),
) as Record<CatalogOrderTagId, OrderTagDef>;

export function resolveOrderTagLabel(
  tagId: string,
  customTags: CustomOrderTag[] = [],
): string {
  const catalog = ORDER_TAG_BY_ID[tagId as CatalogOrderTagId];
  if (catalog) return catalog.label;
  const custom = customTags.find((t) => t.id === tagId);
  if (custom) return custom.label;
  if (isCustomOrderTagId(tagId)) {
    return tagId
      .slice("custom:".length)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return tagId;
}

export function buildPickerOrderTagDefs(
  customTags: CustomOrderTag[] = [],
): PickerOrderTagDef[] {
  const catalogue: PickerOrderTagDef[] = ORDER_TAG_DEFS.map((d) => ({
    id: d.id,
    label: d.label,
    description: d.description,
    pillCls: d.pillCls,
  }));
  const custom: PickerOrderTagDef[] = customTags.map((t) => ({
    id: t.id,
    label: t.label,
    isCustom: true,
    pillCls: CUSTOM_PICKER_TAG_PILL_CLS,
  }));
  return [...catalogue, ...custom];
}
export function readOrderTagsFromConsultation(
  c: Consultation,
): OrderTagRecord[] {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const raw = answers.order_tags;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is OrderTagRecord =>
      typeof item === "object" &&
      item != null &&
      typeof (item as OrderTagRecord).tagId === "string",
  );
}

export function getActiveOrderTags(c: Consultation): OrderTagRecord[] {
  return readOrderTagsFromConsultation(c).filter((t) => !t.removedAt);
}

function isComplexJourneyPatient(
  c: Consultation,
  related: Consultation[],
): boolean {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  if (hasAutoComplexRiskFlags(c)) return true;
  if (answers.patient_complexity === "complex") return true;
  if (answers.auto_complex != null && typeof answers.auto_complex === "object") {
    return true;
  }
  return evaluateAutoComplexPatient(c, related).length > 0;
}

/**
 * Automatic order / journey badges (consultation_type, journey, auto-complex).
 * Never reads answers.order_tags.
 */
export function getOrderJourneyTags(
  c: Consultation,
  related: Consultation[] = [],
): HeaderDisplayTag[] {
  const out: HeaderDisplayTag[] = [];
  const seen = new Set<string>();

  const add = (tag: HeaderDisplayTag) => {
    const norm = normalizeTagLabel(tag.label);
    if (seen.has(norm)) return;
    seen.add(norm);
    out.push(tag);
  };

  const journey = getPatientJourneyType(c);
  const journeyMeta = JOURNEY_BADGE[journey];
  add({
    key: `journey-${journey}`,
    label: journeyMeta.label,
    pillCls: `${journeyMeta.className} border font-semibold`,
    detail: "Patient journey",
  });

  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const consultationType =
    typeof answers.consultation_type === "string"
      ? answers.consultation_type.trim()
      : "";
  if (consultationType) {
    const mapped =
      CONSULTATION_TYPE_LABELS[consultationType] ??
      consultationType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
    add({
      key: `ctype-${consultationType}`,
      label: mapped,
      pillCls: `${journeyMeta.className} border font-semibold`,
      detail: `Consultation type: ${consultationType}`,
    });
  }

  if (isComplexJourneyPatient(c, related)) {
    add({
      key: "journey-complex",
      label: "Complex patient",
      pillCls: `${JOURNEY_COMPLEX_PILL_CLS} border font-bold`,
      detail: "Auto-detected complexity (weight change, medication switch, or stored flags)",
    });
  }

  return out;
}

/**
 * Prescriber / consultation tags from answers.order_tags (+ legacy wait tags).
 * Styled red in the order header; deduped against journey labels.
 */
export function getPrescriberOrderTags(
  c: Consultation,
  journeyLabels?: Iterable<string>,
): HeaderDisplayTag[] {
  const journeyNorm = new Set(
    journeyLabels
      ? [...journeyLabels].map(normalizeTagLabel)
      : getOrderJourneyTags(c).map((t) => normalizeTagLabel(t.label)),
  );

  const out: HeaderDisplayTag[] = [];

  for (const t of getActiveOrderTags(c)) {
    if (journeyNorm.has(normalizeTagLabel(t.label))) continue;
    const noteBit = t.addedNote ? ` · ${t.addedNote}` : "";
    out.push({
      key: `tag-${t.tagId}-${t.addedAt}`,
      label: t.label,
      detail: `Added by ${t.addedBy} · ${t.source.replace(/_/g, " ")}${noteBit}`,
      pillCls: PRESCRIBER_TAG_PILL_CLS,
    });
  }

  const persistedIds = new Set(getActiveOrderTags(c).map((t) => t.tagId));
  if (!persistedIds.has("pending_customer_response")) {
    for (const w of getActiveWaitTags(c)) {
      if (w.kind !== "pending_customer_response") continue;
      if (journeyNorm.has(normalizeTagLabel(w.label))) continue;
      out.push({
        key: w.id,
        label: w.label,
        detail: w.detail,
        pillCls: PRESCRIBER_TAG_PILL_CLS,
      });
    }
  }

  return out;
}

/** Tags shown in queue rows — prescriber tags only (legacy helper). */
export function getDisplayOrderTags(c: Consultation): Array<{
  key: string;
  label: string;
  detail?: string;
  pillCls: string;
  source: string;
  removed?: boolean;
}> {
  return getPrescriberOrderTags(c).map((t) => ({
    ...t,
    source: "order_tags",
  }));
}

export function weightMonitoringTagId(
  c: Consultation,
  related: Consultation[],
): CatalogOrderTagId | null {
  const alert = evaluateWeightChangeMonitoring(c, related);
  if (!alert || alert.kind === "medication_switch") return null;
  if (alert.pctChange != null && alert.pctChange > 0) return "gained_7_percent";
  if (alert.pctChange != null && alert.pctChange < 0) return "lost_10_percent";
  return "gained_7_percent";
}

/** Single-sentence copy for batch tag add activity cards. */
export function formatOrderTagsBatchAddActivityCopy(
  labels: string[],
  actor: string,
  note?: string,
): {
  tagLabel: string;
  title: string;
  body: string;
  note?: string;
} {
  const trimmedNote = note?.trim();
  const unique = [...new Set(labels.filter(Boolean))];
  const title = unique.join(", ");
  const count = unique.length;
  const tagWord = count === 1 ? "tag" : "tags";
  return {
    tagLabel: title,
    title,
    body: `${tagWord} added by ${actor}`,
    note: trimmedNote,
  };
}

/** Single-sentence copy for batch tag removal activity cards. */
export function formatOrderTagsBatchRemoveActivityCopy(
  labels: string[],
  actor: string,
  note?: string,
): {
  tagLabel: string;
  title: string;
  body: string;
  note?: string;
} {
  const trimmedNote = note?.trim();
  const unique = [...new Set(labels.filter(Boolean))];
  const title = unique.join(", ");
  const count = unique.length;
  return {
    tagLabel: title,
    title,
    body: `${count} tag${count === 1 ? "" : "s"} removed by ${actor}`,
    note: trimmedNote,
  };
}

/** Single-sentence copy for tag activity cards (attribution inline, no footer). */
export function formatOrderTagActivityCopy(
  action: "add" | "remove",
  label: string,
  actor: string,
  note?: string,
): {
  tagLabel: string;
  title: string;
  body: string;
  note?: string;
} {
  const trimmedNote = note?.trim();
  const verb = action === "remove" ? "removed" : "added";
  return {
    tagLabel: label,
    title: label,
    body: `tag ${verb} by ${actor}`,
    note: trimmedNote,
  };
}

export function orderTagActivityEvents(
  c: Consultation,
): Array<{
  atIso: string;
  title: string;
  body: string;
  tagLabel: string;
  kind: "tag_added" | "tag_removed";
  note?: string;
}> {
  const events: Array<{
    atIso: string;
    title: string;
    body: string;
    tagLabel: string;
    kind: "tag_added" | "tag_removed";
    note?: string;
  }> = [];

  const allTags = readOrderTagsFromConsultation(c);
  const addBatchGroups = new Map<string, OrderTagRecord[]>();
  const singleAdds: OrderTagRecord[] = [];

  for (const t of allTags) {
    if (t.addedBatchId) {
      const group = addBatchGroups.get(t.addedBatchId) ?? [];
      group.push(t);
      addBatchGroups.set(t.addedBatchId, group);
    } else {
      singleAdds.push(t);
    }
  }

  for (const group of addBatchGroups.values()) {
    const first = group[0];
    if (!first) continue;
    if (group.length === 1) {
      const added = formatOrderTagActivityCopy(
        "add",
        first.label,
        first.addedBy,
        first.addedNote,
      );
      events.push({
        atIso: first.addedAt,
        title: added.title,
        body: added.body,
        tagLabel: added.tagLabel,
        kind: "tag_added",
        note: added.note,
      });
      continue;
    }
    const batch = formatOrderTagsBatchAddActivityCopy(
      group.map((t) => t.label),
      first.addedBy,
      first.addedNote,
    );
    events.push({
      atIso: first.addedAt,
      title: batch.title,
      body: batch.body,
      tagLabel: batch.tagLabel,
      kind: "tag_added",
      note: batch.note,
    });
  }

  for (const t of singleAdds) {
    const added = formatOrderTagActivityCopy(
      "add",
      t.label,
      t.addedBy,
      t.addedNote,
    );
    events.push({
      atIso: t.addedAt,
      title: added.title,
      body: added.body,
      tagLabel: added.tagLabel,
      kind: "tag_added",
      note: added.note,
    });
  }

  const removedTags = readOrderTagsFromConsultation(c).filter((t) => t.removedAt);
  const batchGroups = new Map<string, OrderTagRecord[]>();
  const singleRemovals: OrderTagRecord[] = [];

  for (const t of removedTags) {
    if (t.removedBatchId) {
      const group = batchGroups.get(t.removedBatchId) ?? [];
      group.push(t);
      batchGroups.set(t.removedBatchId, group);
    } else {
      singleRemovals.push(t);
    }
  }

  for (const group of batchGroups.values()) {
    const first = group[0];
    if (!first?.removedAt) continue;
    if (group.length === 1) {
      const removed = formatOrderTagActivityCopy(
        "remove",
        first.label,
        first.removedBy ?? "Staff",
        first.removedNote,
      );
      events.push({
        atIso: first.removedAt,
        title: removed.title,
        body: removed.body,
        tagLabel: removed.tagLabel,
        kind: "tag_removed",
        note: removed.note,
      });
      continue;
    }
    const batch = formatOrderTagsBatchRemoveActivityCopy(
      group.map((t) => t.label),
      first.removedBy ?? "Staff",
      first.removedNote,
    );
    events.push({
      atIso: first.removedAt,
      title: batch.title,
      body: batch.body,
      tagLabel: batch.tagLabel,
      kind: "tag_removed",
      note: batch.note,
    });
  }

  for (const t of singleRemovals) {
    if (!t.removedAt) continue;
    const removed = formatOrderTagActivityCopy(
      "remove",
      t.label,
      t.removedBy ?? "Staff",
      t.removedNote,
    );
    events.push({
      atIso: t.removedAt,
      title: removed.title,
      body: removed.body,
      tagLabel: removed.tagLabel,
      kind: "tag_removed",
      note: removed.note,
    });
  }

  return events;
}

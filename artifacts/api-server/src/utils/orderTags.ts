import { randomUUID } from "node:crypto";
import type { EvidenceSlotId } from "@workspace/evidence-slots";
import { EVIDENCE_SLOT_META, patientUploadSlots } from "@workspace/evidence-slots";
import { missingEvidenceSlots } from "./patientDocuments";

export type OrderTagId =
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
  removedBatchId?: string;
  /** Shared id when several tags were added in one save action. */
  addedBatchId?: string;
};

export const ORDER_TAG_LABELS: Record<OrderTagId, string> = {
  invalid_id_verification: "Invalid ID verification",
  invalid_full_scale_video: "Invalid full scale video",
  invalid_weight_scale_video: "Invalid weight scale video",
  pending_customer_response: "Pending customer response",
  previous_bmi_verification_required: "Previous BMI verification required",
  previous_bmi_verification_failed: "Previous BMI verification failed",
  previous_use_evidence_required: "Previous use evidence required",
  previous_use_evidence_invalid: "Previous use evidence invalid",
  suspicious_height: "Suspicious height",
  suspicious_bmi: "Suspicious BMI",
  lost_10_percent: "Lost 10%",
  gained_7_percent: "Gained 7%",
};

const SLOT_REJECT_TAG: Partial<Record<EvidenceSlotId, OrderTagId>> = {
  "government-id": "invalid_id_verification",
  "full-body-video": "invalid_full_scale_video",
  "weight-scale-video": "invalid_weight_scale_video",
  "previous-prescription": "previous_use_evidence_invalid",
  "previous-bmi-verification": "previous_bmi_verification_failed",
  "supporting-evidence": "previous_use_evidence_invalid",
};

const SLOT_MISSING_TAG: Partial<Record<EvidenceSlotId, OrderTagId>> = {
  "previous-bmi-verification": "previous_bmi_verification_required",
  "previous-prescription": "previous_use_evidence_required",
  "supporting-evidence": "previous_use_evidence_required",
};

/** Tags applied when a secure upload link is emailed for a slot. */
export const SLOT_UPLOAD_LINK_PENDING_TAG: Partial<
  Record<EvidenceSlotId, OrderTagId>
> = {
  "previous-prescription": "previous_use_evidence_required",
  "previous-bmi-verification": "previous_bmi_verification_required",
  "supporting-evidence": "previous_use_evidence_required",
};

const DOCUMENT_AUTO_SOURCES: OrderTagSource[] = [
  "document_reject",
  "document_requirement",
  "system",
];

const DOCUMENT_MANAGED_TAG_IDS: OrderTagId[] = [
  "invalid_id_verification",
  "invalid_full_scale_video",
  "invalid_weight_scale_video",
  "previous_bmi_verification_required",
  "previous_bmi_verification_failed",
  "previous_use_evidence_required",
  "previous_use_evidence_invalid",
  "pending_customer_response",
];

export function orderTagIdForRejectedDocument(
  docId: string,
): OrderTagId | null {
  return SLOT_REJECT_TAG[docId as EvidenceSlotId] ?? null;
}

export function readOrderTags(
  answers: Record<string, unknown>,
): OrderTagRecord[] {
  const raw = answers.order_tags;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is OrderTagRecord =>
      typeof item === "object" &&
      item != null &&
      typeof (item as OrderTagRecord).tagId === "string" &&
      typeof (item as OrderTagRecord).label === "string",
  );
}

export function getActiveOrderTags(
  answers: Record<string, unknown>,
): OrderTagRecord[] {
  return readOrderTags(answers).filter((t) => !t.removedAt);
}

const CUSTOM_ORDER_TAG_ID_PREFIX = "custom:";

function isOrderTagId(id: string): id is OrderTagId {
  return id in ORDER_TAG_LABELS;
}

function isCustomOrderTagId(id: string): boolean {
  return (
    id.startsWith(CUSTOM_ORDER_TAG_ID_PREFIX) &&
    /^custom:[a-z0-9][a-z0-9_-]{0,47}$/.test(id)
  );
}

function isKnownOrderTagId(id: string): boolean {
  return isOrderTagId(id) || isCustomOrderTagId(id);
}

function hasRejectedEvidenceSlot(
  answers: Record<string, unknown>,
): boolean {
  const reviews = (answers.document_reviews ?? {}) as Record<
    string,
    { status?: string }
  >;
  return patientUploadSlots(answers).some(
    (slotId) => reviews[slotId]?.status === "rejected",
  );
}

function sourceForAutoTag(
  tagId: OrderTagId,
  answers: Record<string, unknown>,
): OrderTagSource {
  if (tagId === "pending_customer_response") {
    return hasRejectedEvidenceSlot(answers)
      ? "document_reject"
      : "system";
  }
  if (
    tagId === "previous_bmi_verification_required" ||
    tagId === "previous_use_evidence_required"
  ) {
    return "document_requirement";
  }
  if (
    tagId.startsWith("invalid_") ||
    tagId === "previous_bmi_verification_failed" ||
    tagId === "previous_use_evidence_invalid"
  ) {
    return "document_reject";
  }
  return "system";
}

/** Tags that should be active based on uploads, requirements, and review status. */
export function deriveDesiredAutoTagIds(
  answers: Record<string, unknown>,
  photoUrls?: string[] | null,
): Set<OrderTagId> {
  const desired = new Set<OrderTagId>();
  let needsPending = false;
  const reviews = (answers.document_reviews ?? {}) as Record<
    string,
    { status?: string }
  >;
  const missing = missingEvidenceSlots(answers, photoUrls);

  for (const slotId of patientUploadSlots(answers)) {
    const rev = reviews[slotId];

    if (rev?.status === "rejected") {
      const rejectTag = SLOT_REJECT_TAG[slotId];
      if (rejectTag) desired.add(rejectTag);
      if (slotId === "previous-bmi-verification") {
        desired.add("previous_bmi_verification_failed");
      }
      needsPending = true;
      continue;
    }

    if (rev?.status === "verified") continue;

    if (missing.includes(slotId)) {
      const missingTag = SLOT_MISSING_TAG[slotId];
      if (missingTag) desired.add(missingTag);
      needsPending = true;
    }
  }

  if (needsPending) desired.add("pending_customer_response");
  return desired;
}

export function orderTagForUploadLinkRequest(
  slotId: EvidenceSlotId,
): OrderTagId | null {
  return SLOT_UPLOAD_LINK_PENDING_TAG[slotId] ?? null;
}

/** Add catalogue tags when pharmacist/system emails an upload link for a slot. */
export function applyUploadLinkRequestedOrderTags(
  answers: Record<string, unknown>,
  input: {
    slotId: EvidenceSlotId;
    pharmacistName: string;
    note?: string;
  },
): Record<string, unknown> {
  let next = answers;
  const tagId = orderTagForUploadLinkRequest(input.slotId);
  if (tagId) {
    const slotTitle = EVIDENCE_SLOT_META[input.slotId]?.title ?? input.slotId;
    const { answers: tagged } = applyOrderTagChange(next, {
      action: "add",
      tagId,
      pharmacistName: input.pharmacistName,
      source: "document_requirement",
      relatedDocId: input.slotId,
      note:
        input.note?.trim() ||
        `Awaiting ${slotTitle} upload via secure link`,
    });
    next = tagged;
  }
  return next;
}

/** Sync document-related auto tags with current evidence state. */
export function reconcileAutoOrderTags(
  answers: Record<string, unknown>,
  opts?: { actor?: string; photoUrls?: string[] | null },
): Record<string, unknown> {
  const actor = opts?.actor ?? "System";
  const desired = deriveDesiredAutoTagIds(answers, opts?.photoUrls);
  let next = answers;

  for (const t of getActiveOrderTags(next)) {
    if (!DOCUMENT_AUTO_SOURCES.includes(t.source)) continue;
    if (!DOCUMENT_MANAGED_TAG_IDS.includes(t.tagId)) continue;
    if (desired.has(t.tagId)) continue;

    const result = applyOrderTagChange(next, {
      action: "remove",
      tagId: t.tagId,
      pharmacistName: actor,
    });
    next = result.answers;
  }

  for (const tagId of desired) {
    const active = getActiveOrderTags(next);
    if (active.some((t) => t.tagId === tagId)) continue;

    const result = applyOrderTagChange(next, {
      action: "add",
      tagId,
      pharmacistName: actor,
      source: sourceForAutoTag(tagId, next),
    });
    next = result.answers;
  }

  return next;
}

export function applyOrderTagChange(
  answers: Record<string, unknown>,
  input: {
    action: "add" | "remove";
    tagId: string;
    pharmacistName: string;
    source?: OrderTagSource;
    relatedDocId?: string;
    note?: string;
    /** Required when adding a `custom:*` tag — display label from pharmacist settings. */
    label?: string;
  },
): { answers: Record<string, unknown>; changed: boolean; record?: OrderTagRecord } {
  const tagId = input.tagId.trim();
  if (!isKnownOrderTagId(tagId)) {
    throw new Error(`Unknown tag: ${tagId}`);
  }

  const now = new Date().toISOString();
  const list = readOrderTags(answers);
  const active = list.filter((t) => !t.removedAt);
  const existingActive = active.find((t) => t.tagId === tagId);

  if (input.action === "add") {
    if (existingActive) {
      return { answers, changed: false, record: existingActive };
    }
    const trimmedNote = input.note?.trim();
    let label: string;
    if (isOrderTagId(tagId)) {
      label = ORDER_TAG_LABELS[tagId];
    } else {
      const fromInput = input.label?.trim();
      if (!fromInput || fromInput.length > 48) {
        throw new Error("label is required for custom tags (max 48 characters)");
      }
      label = fromInput;
    }
    const record: OrderTagRecord = {
      tagId,
      label,
      addedAt: now,
      addedBy: input.pharmacistName,
      source: input.source ?? "manual",
      relatedDocId: input.relatedDocId,
      ...(trimmedNote ? { addedNote: trimmedNote } : {}),
      removedAt: null,
      removedBy: null,
    };
    const next = { ...answers, order_tags: [...list, record] };
    return { answers: next, changed: true, record };
  }

  if (!existingActive) {
    return { answers, changed: false };
  }

  const trimmedNote = input.note?.trim();
  const nextList = list.map((t) =>
    t.tagId === tagId && !t.removedAt
      ? {
          ...t,
          removedAt: now,
          removedBy: input.pharmacistName,
          ...(trimmedNote ? { removedNote: trimmedNote } : {}),
        }
      : t,
  );
  return {
    answers: { ...answers, order_tags: nextList },
    changed: true,
    record: existingActive,
  };
}

export function applyOrderTagsBatchAdd(
  answers: Record<string, unknown>,
  input: {
    tagIds: string[];
    pharmacistName: string;
    note?: string;
    labels?: Record<string, string>;
    source?: OrderTagSource;
  },
): {
  answers: Record<string, unknown>;
  changed: boolean;
  added: OrderTagRecord[];
} {
  const tagIds = [
    ...new Set(input.tagIds.map((id) => id.trim()).filter(Boolean)),
  ];
  if (tagIds.length === 0) {
    return { answers, changed: false, added: [] };
  }

  for (const tagId of tagIds) {
    if (!isKnownOrderTagId(tagId)) {
      throw new Error(`Unknown tag: ${tagId}`);
    }
  }

  const now = new Date().toISOString();
  const batchId = randomUUID();
  const trimmedNote = input.note?.trim();
  const list = readOrderTags(answers);
  const activeIds = new Set(
    list.filter((t) => !t.removedAt).map((t) => t.tagId),
  );
  const added: OrderTagRecord[] = [];

  for (const tagId of tagIds) {
    if (activeIds.has(tagId)) continue;

    let label: string;
    if (isOrderTagId(tagId)) {
      label = ORDER_TAG_LABELS[tagId];
    } else {
      const fromInput = input.labels?.[tagId]?.trim();
      if (!fromInput || fromInput.length > 48) {
        throw new Error(
          "label is required for custom tags (max 48 characters)",
        );
      }
      label = fromInput;
    }

    const record: OrderTagRecord = {
      tagId,
      label,
      addedAt: now,
      addedBy: input.pharmacistName,
      source: input.source ?? "manual",
      addedBatchId: batchId,
      ...(trimmedNote ? { addedNote: trimmedNote } : {}),
      removedAt: null,
      removedBy: null,
    };
    added.push(record);
    activeIds.add(tagId);
  }

  if (added.length === 0) {
    return { answers, changed: false, added: [] };
  }

  return {
    answers: { ...answers, order_tags: [...list, ...added] },
    changed: true,
    added,
  };
}

export function applyOrderTagsBatchRemove(
  answers: Record<string, unknown>,
  input: {
    tagIds: string[];
    pharmacistName: string;
    note?: string;
  },
): {
  answers: Record<string, unknown>;
  changed: boolean;
  removed: OrderTagRecord[];
} {
  const tagIds = [
    ...new Set(input.tagIds.map((id) => id.trim()).filter(Boolean)),
  ];
  if (tagIds.length === 0) {
    return { answers, changed: false, removed: [] };
  }

  for (const tagId of tagIds) {
    if (!isKnownOrderTagId(tagId)) {
      throw new Error(`Unknown tag: ${tagId}`);
    }
  }

  const now = new Date().toISOString();
  const batchId = randomUUID();
  const trimmedNote = input.note?.trim();
  const list = readOrderTags(answers);
  const removed: OrderTagRecord[] = [];
  let changed = false;

  const nextList = list.map((t) => {
    if (t.removedAt || !tagIds.includes(t.tagId)) return t;
    changed = true;
    const updated: OrderTagRecord = {
      ...t,
      removedAt: now,
      removedBy: input.pharmacistName,
      removedBatchId: batchId,
      ...(trimmedNote ? { removedNote: trimmedNote } : {}),
    };
    removed.push(updated);
    return updated;
  });

  if (!changed) {
    return { answers, changed: false, removed: [] };
  }

  return {
    answers: { ...answers, order_tags: nextList },
    changed: true,
    removed,
  };
}

/** @deprecated Use reconcileAutoOrderTags after document review changes. */
export function autoTagDocumentRejected(
  answers: Record<string, unknown>,
  docId: string,
  pharmacistName: string,
): Record<string, unknown> {
  const tagId = orderTagIdForRejectedDocument(docId);
  if (!tagId) return answers;
  const { answers: next } = applyOrderTagChange(answers, {
    action: "add",
    tagId,
    pharmacistName,
    source: "document_reject",
    relatedDocId: docId,
  });
  return next;
}

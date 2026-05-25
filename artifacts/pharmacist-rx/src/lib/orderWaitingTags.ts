import type { Consultation } from "@workspace/api-client-react";
import {
  EVIDENCE_SLOT_META,
  rxVisibleSlots,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";

export type CustomerWaitTagKind =
  | "pending_customer_response"
  | "pending_document_upload";

export type CustomerWaitTag = {
  id: string;
  kind: CustomerWaitTagKind;
  label: string;
  detail: string;
  createdAt: string;
  source:
    | "document_reject"
    | "upload_link"
    | "message"
    | "cs_hold"
    | "requirement_email";
  relatedDocId?: string;
  resolvedAt?: string;
};

const STORAGE_PREFIX = "pharmacare:rx-wait-tags:";

export const WAIT_TAG_META: Record<
  CustomerWaitTagKind,
  { label: string; queueCls: string; activityLabel: string }
> = {
  pending_customer_response: {
    label: "Pending customer response",
    queueCls: "bg-rx-hold-surface text-rx-hold border-rx-hold-border",
    activityLabel: "Awaiting patient reply",
  },
  pending_document_upload: {
    label: "Pending document upload",
    queueCls: "bg-rx-cs-surface text-rx-cs border-rx-cs-border",
    activityLabel: "Awaiting document upload",
  },
};

export function waitTagsStorageKey(consultationId: string): string {
  return `${STORAGE_PREFIX}${consultationId}`;
}

export function readSessionWaitTags(consultationId: string): CustomerWaitTag[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(waitTagsStorageKey(consultationId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomerWaitTag =>
        typeof item === "object" &&
        item != null &&
        typeof (item as CustomerWaitTag).id === "string" &&
        typeof (item as CustomerWaitTag).kind === "string",
    );
  } catch {
    return [];
  }
}

export function writeSessionWaitTags(
  consultationId: string,
  tags: CustomerWaitTag[],
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      waitTagsStorageKey(consultationId),
      JSON.stringify(tags),
    );
  } catch {
    /* ignore */
  }
}

export function upsertSessionWaitTag(
  consultationId: string,
  tag: CustomerWaitTag,
): CustomerWaitTag[] {
  const existing = readSessionWaitTags(consultationId).filter(
    (t) => t.id !== tag.id && !t.resolvedAt,
  );
  const next = [{ ...tag, resolvedAt: undefined }, ...existing];
  writeSessionWaitTags(consultationId, next);
  return next;
}

export function resolveSessionWaitTags(
  consultationId: string,
  predicate: (tag: CustomerWaitTag) => boolean,
): void {
  const now = new Date().toISOString();
  const next = readSessionWaitTags(consultationId).map((tag) =>
    predicate(tag) && !tag.resolvedAt ? { ...tag, resolvedAt: now } : tag,
  );
  writeSessionWaitTags(consultationId, next);
}

type ReviewMeta = {
  status?: string;
  reviewedAt?: string;
  uploadEmailSentAt?: string;
  rejectionNote?: string;
  rejectionTemplateTitle?: string;
};

function isSlotAwaitingReupload(
  slotId: EvidenceSlotId,
  rev: ReviewMeta | undefined,
  uploadedAt: Record<string, string>,
): boolean {
  if (!rev || rev.status !== "rejected") return false;
  const uploadIso = uploadedAt[slotId];
  if (!uploadIso) return true;
  const uploadMs = new Date(uploadIso).getTime();
  if (rev.uploadEmailSentAt) {
    return uploadMs <= new Date(rev.uploadEmailSentAt).getTime();
  }
  if (rev.reviewedAt) {
    return uploadMs <= new Date(rev.reviewedAt).getTime();
  }
  return false;
}

/** Tags derived from persisted consultation answers (survives refresh). */
export function deriveWaitTagsFromConsultation(
  c: Consultation,
): CustomerWaitTag[] {
  const tags: CustomerWaitTag[] = [];
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const reviews = (answers.document_reviews ?? {}) as Record<
    string,
    ReviewMeta
  >;
  const uploadedAt = (answers.patient_documents_uploaded_at ?? {}) as Record<
    string,
    string
  >;
  const note = c.pharmacistNote ?? "";

  for (const slotId of rxVisibleSlots(answers)) {
    const rev = reviews[slotId];
    if (!isSlotAwaitingReupload(slotId, rev, uploadedAt)) continue;
    const title = EVIDENCE_SLOT_META[slotId].title;
    const reason = rev?.rejectionTemplateTitle
      ? ` (${rev.rejectionTemplateTitle})`
      : "";
    const emailLine = rev?.uploadEmailSentAt
      ? "Upload requested — awaiting patient re-upload."
      : "Document rejected — awaiting re-upload.";
    tags.push({
      id: `doc-${slotId}`,
      kind: "pending_document_upload",
      label: WAIT_TAG_META.pending_document_upload.label,
      detail: `${title}${reason} — ${emailLine}`,
      createdAt: rev?.uploadEmailSentAt ?? rev?.reviewedAt ?? c.createdAt,
      source: rev?.uploadEmailSentAt ? "upload_link" : "document_reject",
      relatedDocId: slotId,
    });
  }

  if (c.status === "more_info_needed" && note.startsWith("[CS_HOLD]")) {
    const detail = note.replace(/^\[CS_HOLD\]\s*/i, "").trim();
    tags.push({
      id: "cs-hold-response",
      kind: "pending_customer_response",
      label: WAIT_TAG_META.pending_customer_response.label,
      detail: detail || "Awaiting patient reply on CS hold.",
      createdAt:
        c.reviewedAt ?? (c as { updatedAt?: string }).updatedAt ?? c.createdAt,
      source: "cs_hold",
    });
  }

  return tags;
}

function mergeTags(
  derived: CustomerWaitTag[],
  session: CustomerWaitTag[],
): CustomerWaitTag[] {
  const byId = new Map<string, CustomerWaitTag>();
  for (const tag of [...derived, ...session]) {
    if (tag.resolvedAt) continue;
    const existing = byId.get(tag.id);
    if (!existing || tag.createdAt > existing.createdAt) {
      byId.set(tag.id, tag);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getActiveWaitTags(c: Consultation): CustomerWaitTag[] {
  return mergeTags(
    deriveWaitTagsFromConsultation(c),
    readSessionWaitTags(c.id),
  );
}

export function hasWaitTagKind(
  c: Consultation,
  kind: CustomerWaitTagKind,
): boolean {
  return getActiveWaitTags(c).some((t) => t.kind === kind);
}

export function isWaitingOnPatient(c: Consultation): boolean {
  return getActiveWaitTags(c).length > 0;
}

export function buildWaitTag(input: {
  kind: CustomerWaitTagKind;
  detail: string;
  source: CustomerWaitTag["source"];
  relatedDocId?: string;
  id?: string;
}): CustomerWaitTag {
  return {
    id:
      input.id ??
      `${input.kind}-${input.relatedDocId ?? Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    label: WAIT_TAG_META[input.kind].label,
    detail: input.detail,
    createdAt: new Date().toISOString(),
    source: input.source,
    relatedDocId: input.relatedDocId,
  };
}

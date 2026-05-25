import type { Consultation } from "@workspace/api-client-react";

import {
  EVIDENCE_SLOT_META,
  getDocumentRequirements,
  getSlotUploadsFromAnswers,
  latestSlotUpload,
  normalizeSlotUploads,
  requirementLabel,
  rxVisibleSlots,
  type EvidenceSlotId,
  type DocumentRequirement,
  type PatientDocumentUpload,
  type PatientDocumentsMap,
} from "@workspace/evidence-slots";

export type EvidenceSlotStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "not_uploaded";

export type EvidenceSlot = {
  id: EvidenceSlotId;
  title: string;
  sub: string;
  uploaded: string;
  status: EvidenceSlotStatus;
  requirement: DocumentRequirement;
  reviewedBy?: string;
  imageUrl?: string;
  imageUrls: string[];
  uploads: PatientDocumentUpload[];
  uploadCount: number;
  uploadEmailSentAt?: string;
  uploadEmailCount?: number;
  rejectionNote?: string;
  rejectionTemplateTitle?: string;
};

export type DocumentReviewMeta = {
  status: "verified" | "pending" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  uploadEmailSentAt?: string;
  uploadEmailCount?: number;
  rejectionNote?: string;
  rejectionTemplateId?: string;
  rejectionTemplateTitle?: string;
  emailSubject?: string;
};

type DocumentReviewsMap = Record<string, DocumentReviewMeta>;

export function formatEvidenceUploaded(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Upload date unknown";
  return `Uploaded ${d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatUploadedLine(uploadCount: number, uploadedIso: string): string {
  const when = formatEvidenceUploaded(uploadedIso);
  if (uploadCount > 1) {
    return `${uploadCount} documents · ${when}`;
  }
  return when;
}

/** Patient uploads keyed by slot id with legacy photoUrls fallback. */
export function getPatientDocumentUploadsBySlot(
  c: Consultation,
): Partial<Record<EvidenceSlotId, PatientDocumentUpload[]>> {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const docs = (answers.patient_documents ?? {}) as PatientDocumentsMap;
  const uploadedAtMap = (answers.patient_documents_uploaded_at ?? {}) as Record<
    string,
    string
  >;
  const out: Partial<Record<EvidenceSlotId, PatientDocumentUpload[]>> = {};

  for (const slotId of rxVisibleSlots(answers)) {
    const uploads = normalizeSlotUploads(docs[slotId], uploadedAtMap[slotId]);
    if (uploads.length > 0) out[slotId] = uploads;
  }

  const photos = ((c.photoUrls ?? []) as string[]).filter(Boolean);
  if (!out["weight-scale-video"]?.length && photos[0]) {
    out["weight-scale-video"] = [
      { id: "legacy-photo", dataUrl: photos[0], uploadedAt: c.createdAt },
    ];
  }
  if (!out["full-body-video"]?.length && photos[1]) {
    out["full-body-video"] = [
      { id: "legacy-photo", dataUrl: photos[1], uploadedAt: c.createdAt },
    ];
  }
  if (!out["previous-prescription"]?.length && photos[2]) {
    out["previous-prescription"] = [
      { id: "legacy-photo", dataUrl: photos[2], uploadedAt: c.createdAt },
    ];
  }

  return out;
}

/** Latest data URL per slot (preview thumbnail). */
export function getPatientDocumentUrls(
  c: Consultation,
): Partial<Record<EvidenceSlotId, string>> {
  const bySlot = getPatientDocumentUploadsBySlot(c);
  const urls: Partial<Record<EvidenceSlotId, string>> = {};
  for (const [slotId, uploads] of Object.entries(bySlot)) {
    const latest = uploads[uploads.length - 1];
    if (latest) urls[slotId as EvidenceSlotId] = latest.dataUrl;
  }
  return urls;
}

/** Evidence slots for this consultation — missing uploads show as not_uploaded. */
export function buildPrescriptionEvidenceSlots(c: Consultation): EvidenceSlot[] {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const requirements = getDocumentRequirements(answers);
  const reviews = (answers.document_reviews ?? {}) as DocumentReviewsMap;
  const uploadsBySlot = getPatientDocumentUploadsBySlot(c);
  const uploadedAt = (answers.patient_documents_uploaded_at ?? {}) as Record<
    string,
    string
  >;

  return rxVisibleSlots(answers).map((slotId) => {
    const meta = EVIDENCE_SLOT_META[slotId];
    const uploads = uploadsBySlot[slotId] ?? [];
    const imageUrls = uploads.map((u) => u.dataUrl);
    const imageUrl = imageUrls[imageUrls.length - 1];
    const uploadCount = uploads.length;
    const rev = reviews[slotId];
    const req = requirements[slotId];

    if (uploadCount === 0) {
      return {
        id: slotId,
        title: meta.title,
        sub: meta.summary,
        uploaded: "Not uploaded",
        status: "not_uploaded" as const,
        requirement: req,
        imageUrls: [],
        uploads: [],
        uploadCount: 0,
      };
    }

    const uploadedIso =
      uploads[uploads.length - 1]?.uploadedAt ??
      uploadedAt[slotId] ??
      c.createdAt;
    const reviewStatus = rev?.status ?? "pending";
    const isReuploadPending =
      reviewStatus === "pending" &&
      Boolean(
        rev?.uploadEmailSentAt &&
          uploadedAt[slotId] &&
          new Date(uploadedAt[slotId]!).getTime() >
            new Date(rev.uploadEmailSentAt).getTime(),
      );

    const uploadedLabel = formatUploadedLine(uploadCount, uploadedIso);

    return {
      id: slotId,
      title: meta.title,
      sub: `${meta.summary} · ${requirementLabel(req)}`,
      uploaded: isReuploadPending
        ? `Re-uploaded · ${uploadedLabel}`
        : uploadedLabel,
      status: reviewStatus,
      requirement: req,
      reviewedBy: rev?.reviewedBy,
      imageUrl,
      imageUrls,
      uploads,
      uploadCount,
      uploadEmailSentAt: rev?.uploadEmailSentAt,
      uploadEmailCount: rev?.uploadEmailCount,
      rejectionNote: rev?.rejectionNote,
      rejectionTemplateTitle: rev?.rejectionTemplateTitle,
    };
  });
}

export function countEvidenceSlots(slots: EvidenceSlot[]) {
  return slots.reduce(
    (acc, slot) => {
      if (slot.status === "not_uploaded") acc.not_uploaded += 1;
      else acc[slot.status] += 1;
      return acc;
    },
    { verified: 0, pending: 0, rejected: 0, not_uploaded: 0 },
  );
}

export { EVIDENCE_SLOT_META, type EvidenceSlotId };
export const PRESCRIPTION_EVIDENCE_SLOTS = (
  [
    "government-id",
    "full-body-video",
    "weight-scale-video",
    "previous-prescription",
    "previous-bmi-verification",
    "supporting-evidence",
  ] as const
).map((id) => ({
  id,
  title: EVIDENCE_SLOT_META[id].title,
  sub: EVIDENCE_SLOT_META[id].summary,
}));

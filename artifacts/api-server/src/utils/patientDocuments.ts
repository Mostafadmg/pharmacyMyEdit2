import {
  EVIDENCE_SLOT_IDS,
  EVIDENCE_SLOT_META,
  type EvidenceSlotId,
  getDocumentRequirements,
  isEvidenceSlotId,
  isPreviousPrescriptionRequired,
  isTransferPatient,
  patientUploadSlots,
  type DocumentRequirement,
} from "@workspace/evidence-slots";

export {
  EVIDENCE_SLOT_IDS,
  type EvidenceSlotId,
  isEvidenceSlotId,
  isTransferPatient,
  isPreviousPrescriptionRequired,
};

export const EVIDENCE_SLOT_TITLES: Record<EvidenceSlotId, string> =
  Object.fromEntries(
    EVIDENCE_SLOT_IDS.map((id) => [id, EVIDENCE_SLOT_META[id].title]),
  ) as Record<EvidenceSlotId, string>;

function missingSlots(answers: Record<string, unknown>): EvidenceSlotId[] {
  const docs = (answers.patient_documents ?? {}) as Record<string, string>;
  const pending = (answers.documents_pending ?? {}) as Record<string, boolean>;
  const requirements = getDocumentRequirements(answers);
  const missing: EvidenceSlotId[] = [];

  for (const docId of patientUploadSlots(answers)) {
    if (docs[docId]) continue;
    if (docId === "weight-scale-video" && pending.weight_scale === false) {
      continue;
    }
    if (
      docId === "supporting-evidence" &&
      pending.supporting_evidence === false
    ) {
      continue;
    }
    if (
      docId === "previous-prescription" &&
      !isPreviousPrescriptionRequired(answers)
    ) {
      continue;
    }
    if (requirements[docId] === "not_required") continue;
    if (
      docId === "government-id" ||
      docId === "full-body-video" ||
      docId === "weight-scale-video" ||
      requirements[docId] === "required" ||
      isPreviousPrescriptionRequired(answers)
    ) {
      missing.push(docId);
    }
  }

  return missing;
}

export function patientAppBaseUrl(): string {
  return (
    process.env.PATIENT_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}

export function buildDocumentUploadUrl(
  consultationId: string,
  docId: string,
): string {
  return `${patientAppBaseUrl()}/upload-documents/${consultationId}?slot=${encodeURIComponent(docId)}`;
}

export function buildDocumentUploadPath(
  consultationId: string,
  docId: string,
): string {
  return `/upload-documents/${consultationId}?slot=${encodeURIComponent(docId)}`;
}

export type DocumentReviewEntry = {
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

export type PatientDocumentSlotStatus = {
  docId: EvidenceSlotId;
  docTitle: string;
  status: "required" | "uploaded" | "verified" | "rejected";
  uploadedAt?: string;
  rejectionNote?: string;
  uploadPath: string;
  uploadUrl: string;
};

function slotShowsWhenEmpty(
  docId: EvidenceSlotId,
  requirements: Record<EvidenceSlotId, DocumentRequirement>,
  answers: Record<string, unknown>,
): boolean {
  if (requirements[docId] === "not_required") return false;
  if (requirements[docId] === "required") return true;
  if (docId === "previous-prescription") {
    return isPreviousPrescriptionRequired(answers);
  }
  if (
    docId === "government-id" ||
    docId === "full-body-video" ||
    docId === "weight-scale-video"
  ) {
    return true;
  }
  return answers.excluding_conditions === "yes";
}

function orderDocumentSlotIds(
  answers: Record<string, unknown>,
): EvidenceSlotId[] {
  const raw = (answers.order_document_slots ?? []) as string[];
  return raw.filter(isEvidenceSlotId);
}

export function trackOrderDocumentSlot(
  answers: Record<string, unknown>,
  docId: EvidenceSlotId,
): Record<string, unknown> {
  const existing = orderDocumentSlotIds(answers);
  if (existing.includes(docId)) return answers;
  return {
    ...answers,
    order_document_slots: [...existing, docId],
  };
}

/** All document slots that must appear in the patient portal (including after upload). */
export function portalVisibleSlotIds(
  answers: Record<string, unknown>,
): EvidenceSlotId[] {
  const a = answers ?? {};
  const docs = (a.patient_documents ?? {}) as Record<string, string>;
  const requirements = getDocumentRequirements(a);
  const reviews = (a.document_reviews ?? {}) as Record<
    string,
    DocumentReviewEntry
  >;
  const seen = new Set<EvidenceSlotId>();
  const ordered: EvidenceSlotId[] = [];

  const add = (id: EvidenceSlotId) => {
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };

  for (const id of EVIDENCE_SLOT_IDS) {
    if (docs[id]) add(id);
  }

  for (const id of orderDocumentSlotIds(a)) {
    add(id);
  }

  for (const id of patientUploadSlots(a)) {
    add(id);
  }

  for (const id of EVIDENCE_SLOT_IDS) {
    if (requirements[id] === "required") add(id);
    if (reviews[id]?.status === "rejected") add(id);
  }

  for (const id of EVIDENCE_SLOT_IDS) {
    if (slotShowsWhenEmpty(id, requirements, a)) add(id);
  }

  return ordered;
}

/** Per-slot status for patient portal (required, uploaded, verified, rejected). */
export function patientDocumentSlotStatuses(
  consultationId: string,
  answers: Record<string, unknown> | null | undefined,
): PatientDocumentSlotStatus[] {
  const a = answers ?? {};
  const docs = (a.patient_documents ?? {}) as Record<string, string>;
  const uploadedAtMap = (a.patient_documents_uploaded_at ?? {}) as Record<
    string,
    string
  >;
  const reviews = (a.document_reviews ?? {}) as Record<
    string,
    DocumentReviewEntry
  >;
  const requirements = getDocumentRequirements(a);
  const out: PatientDocumentSlotStatus[] = [];

  for (const docId of portalVisibleSlotIds(a)) {
    const review = reviews[docId];
    const hasFile = !!docs[docId];
    const uploadedAt = uploadedAtMap[docId];
    const base = {
      docId,
      docTitle: EVIDENCE_SLOT_TITLES[docId],
      uploadPath: buildDocumentUploadPath(consultationId, docId),
      uploadUrl: buildDocumentUploadUrl(consultationId, docId),
      uploadedAt,
    };

    if (review?.status === "rejected") {
      out.push({
        ...base,
        status: "rejected",
        rejectionNote:
          review.rejectionNote?.trim() ||
          review.rejectionTemplateTitle?.trim() ||
          "Your pharmacist rejected this upload. Please upload a new file and check Messages for details.",
      });
      continue;
    }

    if (review?.status === "verified" && hasFile) {
      out.push({ ...base, status: "verified" });
      continue;
    }

    if (hasFile) {
      out.push({ ...base, status: "uploaded" });
      continue;
    }

    if (!slotShowsWhenEmpty(docId, requirements, a)) continue;

    out.push({
      ...base,
      status: "required",
      rejectionNote: "Required — please upload when you can.",
    });
  }

  return out;
}

export type DocumentActionRequired = {
  docId: EvidenceSlotId;
  docTitle: string;
  rejectionNote?: string;
  uploadPath: string;
  uploadUrl: string;
};

/** Rejected uploads and required slots not yet uploaded. */
export function documentActionsRequired(
  consultationId: string,
  answers: Record<string, unknown> | null | undefined,
): DocumentActionRequired[] {
  return patientDocumentSlotStatuses(consultationId, answers)
    .filter((s) => s.status === "required" || s.status === "rejected")
    .map((s) => ({
      docId: s.docId,
      docTitle: s.docTitle,
      rejectionNote:
        s.status === "rejected"
          ? s.rejectionNote
          : s.rejectionNote ?? "Required — please upload when you can.",
      uploadPath: s.uploadPath,
      uploadUrl: s.uploadUrl,
    }));
}

export type PatientDocumentsAnswers = {
  patient_documents?: Partial<Record<EvidenceSlotId, string>>;
  patient_documents_uploaded_at?: Partial<Record<EvidenceSlotId, string>>;
  document_reviews?: Record<string, DocumentReviewEntry>;
};

export function applyPatientDocumentUpload(
  answers: Record<string, unknown>,
  docId: EvidenceSlotId,
  dataUrl: string,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const withSlot = trackOrderDocumentSlot(answers, docId);
  const docs = {
    ...((withSlot.patient_documents as Record<string, string>) ?? {}),
    [docId]: dataUrl,
  };
  const uploadedAt = {
    ...((withSlot.patient_documents_uploaded_at as Record<string, string>) ??
      {}),
    [docId]: now,
  };
  const prev = (withSlot.document_reviews as Record<string, DocumentReviewEntry>)?.[
    docId
  ];
  const reviews = {
    ...((withSlot.document_reviews as Record<string, DocumentReviewEntry>) ??
      {}),
    [docId]: {
      ...prev,
      status: "pending" as const,
      reviewedAt: now,
    },
  };
  return {
    ...withSlot,
    patient_documents: docs,
    patient_documents_uploaded_at: uploadedAt,
    document_reviews: reviews,
  };
}

export function getPatientDocumentDataUrl(
  answers: Record<string, unknown>,
  docId: EvidenceSlotId,
): { dataUrl: string; uploadedAt?: string; status?: string } | null {
  const docs = (answers.patient_documents ?? {}) as Record<string, string>;
  const dataUrl = docs[docId];
  if (!dataUrl) return null;
  const uploadedAt = (
    answers.patient_documents_uploaded_at as Record<string, string> | undefined
  )?.[docId];
  const review = (
    answers.document_reviews as Record<string, DocumentReviewEntry> | undefined
  )?.[docId];
  return {
    dataUrl,
    uploadedAt,
    status: review?.status,
  };
}

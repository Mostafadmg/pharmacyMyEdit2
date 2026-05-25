import {

  EVIDENCE_SLOT_IDS,

  EVIDENCE_SLOT_META,

  type EvidenceSlotId,

  getDocumentRequirements,

  isEvidenceSlotId,

  isPreviousPrescriptionRequired,

  isPreviousBmiVerificationRequired,

  isTransferPatient,

  patientUploadSlots,

  type DocumentRequirement,

  type DocumentRequirementChange,

  appendSlotUpload,

  getSlotUploadsFromAnswers,

  latestSlotUpload,

  normalizeSlotUploads,

  slotHasUploads,

  type PatientDocumentsMap,

  type PatientDocumentUpload,
  DOCUMENT_REQUIREMENT_VALUES,
} from "@workspace/evidence-slots";
import { z } from "zod";

export {
  EVIDENCE_SLOT_IDS,
  type EvidenceSlotId,
  isEvidenceSlotId,
  isTransferPatient,
  isPreviousPrescriptionRequired,
  isPreviousBmiVerificationRequired,
  type PatientDocumentUpload,
};

export const EvidenceSlotIdSchema = z.enum(EVIDENCE_SLOT_IDS);
export const DocumentRequirementSchema = z.enum(DOCUMENT_REQUIREMENT_VALUES);



export const EVIDENCE_SLOT_TITLES: Record<EvidenceSlotId, string> =

  Object.fromEntries(

    EVIDENCE_SLOT_IDS.map((id) => [id, EVIDENCE_SLOT_META[id].title]),

  ) as Record<EvidenceSlotId, string>;



function hasEvidenceUpload(

  answers: Record<string, unknown>,

  docId: EvidenceSlotId,

  photoUrls?: string[] | null,

): boolean {

  const docs = (answers.patient_documents ?? {}) as PatientDocumentsMap;

  if (slotHasUploads(docs[docId])) return true;

  const photos = (photoUrls ?? []).filter(Boolean);

  if (docId === "weight-scale-video" && photos[0]) return true;

  if (docId === "full-body-video" && photos[1]) return true;

  if (docId === "previous-prescription" && photos[2]) return true;

  return false;

}



/** Required evidence slots with no patient upload yet. */

export function missingEvidenceSlots(

  answers: Record<string, unknown>,

  photoUrls?: string[] | null,

): EvidenceSlotId[] {

  const pending = (answers.documents_pending ?? {}) as Record<string, boolean>;

  const requirements = getDocumentRequirements(answers);

  const missing: EvidenceSlotId[] = [];



  for (const docId of patientUploadSlots(answers)) {

    if (hasEvidenceUpload(answers, docId, photoUrls)) continue;

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

    if (

      docId === "previous-bmi-verification" &&

      !isPreviousBmiVerificationRequired(answers)

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



function missingSlots(answers: Record<string, unknown>): EvidenceSlotId[] {

  return missingEvidenceSlots(answers);

}



export function patientAppBaseUrl(): string {

  return (

    process.env.PATIENT_APP_URL ||

    process.env.APP_URL ||

    "http://localhost:5173"

  ).replace(/\/$/, "");

}



function consultationDocumentFocusQuery(

  consultationId: string,

  docId: string,

): string {

  const params = new URLSearchParams();

  params.set("consultationId", consultationId);

  params.set("focusSlot", docId);

  return params.toString();

}



export function buildDocumentUploadUrl(

  consultationId: string,

  docId: string,

): string {

  return `${patientAppBaseUrl()}/my-consultations?${consultationDocumentFocusQuery(consultationId, docId)}`;

}



export function buildDocumentUploadPath(

  consultationId: string,

  docId: string,

): string {

  return `/my-consultations?${consultationDocumentFocusQuery(consultationId, docId)}`;

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

  uploadCount?: number;

  rejectionNote?: string;

  uploadPath: string;

  uploadUrl: string;

  /** True when the RX portal rejected, emailed an upload link, or marked the slot required. */
  pharmacistUploadRequested?: boolean;

};



function slotPharmacistUploadRequested(
  answers: Record<string, unknown>,
  docId: EvidenceSlotId,
  review?: DocumentReviewEntry,
): boolean {
  if (review?.status === "rejected") return true;
  if (review?.uploadEmailSentAt) return true;
  if (slotMarkedPendingUpload(answers, docId)) return true;
  if (lastRequiredAt(answers, docId)) return true;
  return false;
}



export function consultationHasPharmacistUploadRequest(
  answers: Record<string, unknown> | null | undefined,
): boolean {
  const a = answers ?? {};
  const reviews = (a.document_reviews ?? {}) as Record<string, DocumentReviewEntry>;
  for (const docId of portalVisibleSlotIds(a)) {
    const review = reviews[docId];
    if (slotPharmacistUploadRequested(a, docId, review)) return true;
  }
  return false;
}



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

  if (docId === "previous-bmi-verification") {

    return isPreviousBmiVerificationRequired(answers);

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

  const docs = (a.patient_documents ?? {}) as PatientDocumentsMap;

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

    if (slotHasUploads(docs[id])) add(id);

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

const PENDING_SLOT_KEYS: Partial<
  Record<
    EvidenceSlotId,
    | "weight_scale"
    | "previous_prescription"
    | "previous_bmi_verification"
    | "supporting_evidence"
  >
> = {
  "weight-scale-video": "weight_scale",
  "previous-prescription": "previous_prescription",
  "previous-bmi-verification": "previous_bmi_verification",
  "supporting-evidence": "supporting_evidence",
};

/** Pin slot to patient order + mark pending when pharmacist requests an upload. */
export function applyPatientDocumentUploadRequest(
  answers: Record<string, unknown>,
  docId: EvidenceSlotId,
): Record<string, unknown> {
  let next = trackOrderDocumentSlot(answers, docId);
  const docs = (next.patient_documents ?? {}) as PatientDocumentsMap;
  if (slotHasUploads(docs[docId])) return next;
  const pendingKey = PENDING_SLOT_KEYS[docId];
  if (!pendingKey) return next;
  const pending = {
    ...((next.documents_pending ?? {}) as Record<string, boolean>),
    [pendingKey]: true,
  };
  return { ...next, documents_pending: pending };
}

function lastRequiredAt(
  answers: Record<string, unknown>,
  slotId: EvidenceSlotId,
): string | null {
  const history = (answers.document_requirement_history ??
    []) as DocumentRequirementChange[];
  let latest: string | null = null;
  for (const entry of history) {
    if (entry.slotId === slotId && entry.to === "required") {
      if (!latest || entry.at > latest) latest = entry.at;
    }
  }
  return latest;
}

/** Upload satisfies an active pharmacist "required" flag (incl. after re-require). */
export function uploadMeetsCurrentRequirement(
  answers: Record<string, unknown>,
  slotId: EvidenceSlotId,
  uploadedAt: string | undefined,
): boolean {
  const requirements = getDocumentRequirements(answers);
  if (requirements[slotId] !== "required") return true;
  const requiredSince = lastRequiredAt(answers, slotId);
  if (!requiredSince) return !!uploadedAt;
  if (!uploadedAt) return false;
  return new Date(uploadedAt).getTime() >= new Date(requiredSince).getTime();
}

function slotMarkedPendingUpload(
  answers: Record<string, unknown>,
  docId: EvidenceSlotId,
): boolean {
  const pending = (answers.documents_pending ?? {}) as Record<string, boolean>;
  const key = PENDING_SLOT_KEYS[docId];
  return key ? pending[key] === true : false;
}

/** Patient must upload or re-upload (required, rejected, or pending from more_info). */
export function slotNeedsPatientUpload(
  answers: Record<string, unknown>,
  docId: EvidenceSlotId,
  opts: {
    hasFile: boolean;
    uploadedAt?: string;
    review?: DocumentReviewEntry;
  },
): boolean {
  if (opts.review?.status === "rejected") return true;
  if (slotMarkedPendingUpload(answers, docId)) return true;
  const requirements = getDocumentRequirements(answers);
  if (
    requirements[docId] === "required" &&
    !uploadMeetsCurrentRequirement(answers, docId, opts.uploadedAt)
  ) {
    return true;
  }
  if (!opts.hasFile && slotShowsWhenEmpty(docId, requirements, answers)) {
    return true;
  }
  return false;
}

/** Per-slot status for patient portal (required, uploaded, verified, rejected). */

export function patientDocumentSlotStatuses(

  consultationId: string,

  answers: Record<string, unknown> | null | undefined,

): PatientDocumentSlotStatus[] {

  const a = answers ?? {};

  const docs = (a.patient_documents ?? {}) as PatientDocumentsMap;

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

    const uploads = normalizeSlotUploads(docs[docId], uploadedAtMap[docId]);

    const hasFile = uploads.length > 0;

    const uploadCount = uploads.length;

    const uploadedAt = uploadedAtMap[docId] ?? uploads[uploads.length - 1]?.uploadedAt;

    const pharmacistUploadRequested = slotPharmacistUploadRequested(
      a,
      docId,
      review,
    );

    const base = {

      docId,

      docTitle: EVIDENCE_SLOT_TITLES[docId],

      uploadPath: buildDocumentUploadPath(consultationId, docId),

      uploadUrl: buildDocumentUploadUrl(consultationId, docId),

      uploadedAt,

      uploadCount: uploadCount > 0 ? uploadCount : undefined,

      pharmacistUploadRequested,

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



    const needsUpload = slotNeedsPatientUpload(a, docId, {
      hasFile,
      uploadedAt,
      review,
    });

    if (review?.status === "verified" && hasFile && !needsUpload) {

      out.push({ ...base, status: "verified" });

      continue;

    }



    if (hasFile && !needsUpload) {

      out.push({ ...base, status: "uploaded" });

      continue;

    }



    if (needsUpload) {

      out.push({

        ...base,

        status: "required",

        rejectionNote: "Required — please upload when you can.",

      });

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

  patient_documents?: PatientDocumentsMap;

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

  const uploadedAtMap = (withSlot.patient_documents_uploaded_at ?? {}) as Record<

    string,

    string

  >;

  const existingDocs = (withSlot.patient_documents ?? {}) as PatientDocumentsMap;

  const { docs, uploadedAt } = appendSlotUpload(

    existingDocs,

    docId,

    dataUrl,

    now,

    uploadedAtMap,

  );

  const uploadedAtMerged = {

    ...uploadedAtMap,

    [docId]: uploadedAt,

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

    patient_documents_uploaded_at: uploadedAtMerged,

    document_reviews: reviews,

  };

}



export function getPatientDocumentDataUrl(

  answers: Record<string, unknown>,

  docId: EvidenceSlotId,

): { dataUrl: string; uploadedAt?: string; status?: string } | null {

  const docs = (answers.patient_documents ?? {}) as PatientDocumentsMap;
  const latest = latestSlotUpload(
    docs[docId],
    (answers.patient_documents_uploaded_at as Record<string, string> | undefined)?.[
      docId
    ],
  );

  if (!latest) return null;

  const review = (

    answers.document_reviews as Record<string, DocumentReviewEntry> | undefined

  )?.[docId];

  return {

    dataUrl: latest.dataUrl,

    uploadedAt: latest.uploadedAt,

    status: review?.status,

  };

}



export function listPatientDocumentUploads(

  answers: Record<string, unknown>,

  docId: EvidenceSlotId,

): PatientDocumentUpload[] {

  return getSlotUploadsFromAnswers(answers, docId);

}



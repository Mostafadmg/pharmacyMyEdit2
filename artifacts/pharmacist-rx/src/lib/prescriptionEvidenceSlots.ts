import type { Consultation } from "@workspace/api-client-react";

import {

  EVIDENCE_SLOT_META,

  getDocumentRequirements,

  requirementLabel,

  rxVisibleSlots,

  type EvidenceSlotId,

  type DocumentRequirement,

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



/** Patient uploads keyed by slot id (from questionnaire) with legacy photoUrls fallback. */

export function getPatientDocumentUrls(

  c: Consultation,

): Partial<Record<EvidenceSlotId, string>> {

  const answers = (c.answers ?? {}) as Record<string, unknown>;

  const fromAnswers = answers.patient_documents as

    | Partial<Record<EvidenceSlotId, string>>

    | undefined;

  const docs: Partial<Record<EvidenceSlotId, string>> = { ...(fromAnswers ?? {}) };



  const photos = ((c.photoUrls ?? []) as string[]).filter(Boolean);

  if (!docs["weight-scale-video"] && photos[0]) {

    docs["weight-scale-video"] = photos[0];

  }

  if (!docs["full-body-video"] && photos[1]) {

    docs["full-body-video"] = photos[1];

  }

  if (!docs["previous-prescription"] && photos[2]) {

    docs["previous-prescription"] = photos[2];

  }



  return docs;

}



/** Evidence slots for this consultation — missing uploads show as not_uploaded. */

export function buildPrescriptionEvidenceSlots(c: Consultation): EvidenceSlot[] {

  const answers = (c.answers ?? {}) as Record<string, unknown>;

  const requirements = getDocumentRequirements(answers);

  const reviews = (answers.document_reviews ?? {}) as DocumentReviewsMap;

  const patientDocs = getPatientDocumentUrls(c);

  const uploadedAt = (answers.patient_documents_uploaded_at ?? {}) as Record<

    string,

    string

  >;



  return rxVisibleSlots(answers).map((slotId) => {

    const meta = EVIDENCE_SLOT_META[slotId];

    const imageUrl = patientDocs[slotId];

    const rev = reviews[slotId];

    const req = requirements[slotId];



    if (!imageUrl) {

      return {

        id: slotId,

        title: meta.title,

        sub: meta.summary,

        uploaded: "Not uploaded",

        status: "not_uploaded" as const,

        requirement: req,

      };

    }



    const uploadedIso = uploadedAt[slotId] ?? c.createdAt;

    const reviewStatus = rev?.status ?? "pending";

    const isReuploadPending =

      reviewStatus === "pending" &&

      Boolean(

        rev?.uploadEmailSentAt &&

          uploadedAt[slotId] &&

          new Date(uploadedAt[slotId]!).getTime() >

            new Date(rev.uploadEmailSentAt).getTime(),

      );



    return {

      id: slotId,

      title: meta.title,

      sub: `${meta.summary} · ${requirementLabel(req)}`,

      uploaded: isReuploadPending

        ? `Re-uploaded · ${formatEvidenceUploaded(uploadedIso)}`

        : formatEvidenceUploaded(uploadedIso),

      status: reviewStatus,

      requirement: req,

      reviewedBy: rev?.reviewedBy,

      imageUrl,

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
    "supporting-evidence",
  ] as const
).map((id) => ({
  id,
  title: EVIDENCE_SLOT_META[id].title,
  sub: EVIDENCE_SLOT_META[id].summary,
}));



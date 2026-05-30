export const EVIDENCE_SLOT_IDS = [
  "government-id",
  "full-body-video",
  "weight-scale-video",
  "previous-prescription",
  "previous-bmi-verification",
  "supporting-evidence",
] as const;

export * from "./wlBmiEligibility";
export * from "./patientDocumentStorage";
import {
  isWlPriorProviderPatient,
  requiresPreviousBmiVerification,
  requiresPreviousPrescription,
} from "./wlBmiEligibility";
import { slotHasUploads } from "./patientDocumentStorage";

export type EvidenceSlotId = (typeof EVIDENCE_SLOT_IDS)[number];

export const DOCUMENT_REQUIREMENT_VALUES = [
  "required",
  "not_required",
  "optional",
] as const;

export type DocumentRequirement =
  (typeof DOCUMENT_REQUIREMENT_VALUES)[number];

/** Slots pharmacists can toggle required / not required in Rx Documents. */
export const PHARMACIST_DOCUMENT_REQUIREMENT_SLOTS = [
  "previous-prescription",
  "previous-bmi-verification",
] as const satisfies readonly EvidenceSlotId[];

export type PharmacistDocumentRequirementSlotId =
  (typeof PHARMACIST_DOCUMENT_REQUIREMENT_SLOTS)[number];

export type EvidenceSlotMeta = {
  id: EvidenceSlotId;
  title: string;
  /** One-line summary for cards */
  summary: string;
  /** File input `accept` — MIME types and extensions for reliable OS pickers */
  accept: string;
  /** @deprecated Use `accept` — kept for callers that still read acceptMime */
  acceptMime: string;
  isVideo: boolean;
  maxMb: number;
  criteria: string[];
};

/** Max base64 data URL length for the largest slot (150 MB raw → ~205 MB encoded). */
export const PATIENT_DOCUMENT_DATA_URL_MAX = 210_000_000;

export const PATIENT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/heic,image/webp,.jpg,.jpeg,.png,.heic,.webp";

export const PATIENT_VIDEO_ACCEPT =
  "video/mp4,video/webm,video/quicktime,video/x-m4v,video/*,.mp4,.webm,.mov,.m4v";

export const PATIENT_VIDEO_OR_IMAGE_ACCEPT = `${PATIENT_VIDEO_ACCEPT},${PATIENT_IMAGE_ACCEPT}`;

export const PATIENT_DOC_MEDIA_ACCEPT = `${PATIENT_IMAGE_ACCEPT},image/*,${PATIENT_VIDEO_ACCEPT},application/pdf,.pdf`;

const IMAGE_EXT = /\.(jpe?g|png|heic|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
const PDF_EXT = /\.pdf$/i;

export type PatientDocumentFileKind = "image" | "video" | "pdf" | "unknown";

export function patientDocumentFileKind(file: Pick<File, "type" | "name">): PatientDocumentFileKind {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/") || IMAGE_EXT.test(file.name)) return "image";
  if (t.startsWith("video/") || VIDEO_EXT.test(file.name)) return "video";
  if (t === "application/pdf" || PDF_EXT.test(file.name)) return "pdf";
  return "unknown";
}

export function validatePatientDocumentFile(
  file: Pick<File, "type" | "name" | "size">,
  slotId: EvidenceSlotId,
): { ok: true } | { ok: false; message: string } {
  const meta = EVIDENCE_SLOT_META[slotId];
  const kind = patientDocumentFileKind(file);
  const maxBytes = meta.maxMb * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      ok: false,
      message: `File must be under ${meta.maxMb} MB.`,
    };
  }

  if (slotId === "government-id") {
    if (kind !== "image") {
      return {
        ok: false,
        message: "Please upload a JPEG, PNG, HEIC, or WebP photo of your ID.",
      };
    }
    return { ok: true };
  }

  if (meta.isVideo) {
    if (kind !== "video" && kind !== "image") {
      return {
        ok: false,
        message: `${meta.title} must be a video (MP4, WebM, MOV) or a clear photo if you cannot record video yet.`,
      };
    }
    return { ok: true };
  }

  if (kind === "image" || kind === "video" || kind === "pdf") {
    return { ok: true };
  }

  return {
    ok: false,
    message: "Please choose a supported image, video (MP4, WebM, MOV), or PDF file.",
  };
}

export function validatePatientDocumentDataUrl(
  dataUrl: string,
  slotId: EvidenceSlotId,
): { ok: true } | { ok: false; message: string } {
  const trimmed = dataUrl.trim();
  const match = /^data:([^;,]+)/i.exec(trimmed);
  if (!match) {
    return { ok: false, message: "Invalid file upload." };
  }

  const mime = match[1]!.toLowerCase();
  const meta = EVIDENCE_SLOT_META[slotId];

  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isPdf = mime === "application/pdf";

  if (slotId === "government-id") {
    if (!isImage) {
      return { ok: false, message: "ID uploads must be a photo (JPEG, PNG, HEIC, or WebP)." };
    }
    return { ok: true };
  }

  if (meta.isVideo) {
    if (!isVideo && !isImage) {
      return {
        ok: false,
        message: `${meta.title} must be a video or photo file.`,
      };
    }
    return { ok: true };
  }

  if (isImage || isVideo || isPdf) {
    return { ok: true };
  }

  return { ok: false, message: "Unsupported file type for this document slot." };
}

export const EVIDENCE_SLOT_META: Record<EvidenceSlotId, EvidenceSlotMeta> = {
  "government-id": {
    id: "government-id",
    title: "Government-issued ID",
    summary:
      "Passport or driving licence — clear, in date, all corners visible",
    accept: PATIENT_IMAGE_ACCEPT,
    acceptMime: PATIENT_IMAGE_ACCEPT,
    isVideo: false,
    maxMb: 10,
    criteria: [
      "Photo only — name and dates readable",
      "All four corners in frame",
    ],
  },
  "full-body-video": {
    id: "full-body-video",
    title: "Full body video",
    summary: "Live video of your full body — good lighting, fitted clothing",
    accept: PATIENT_VIDEO_OR_IMAGE_ACCEPT,
    acceptMime: PATIENT_VIDEO_OR_IMAGE_ACCEPT,
    isVideo: true,
    maxMb: 150,
    criteria: [
      "Record live video (not a screenshot)",
      "Full body visible for BMI check",
    ],
  },
  "weight-scale-video": {
    id: "weight-scale-video",
    title: "Weight scale video",
    summary: "Live video on the scale — your face and the reading visible",
    accept: PATIENT_VIDEO_OR_IMAGE_ACCEPT,
    acceptMime: PATIENT_VIDEO_OR_IMAGE_ACCEPT,
    isVideo: true,
    maxMb: 150,
    criteria: [
      "Record live video while on the scale",
      "Face and weight reading clearly readable",
    ],
  },
  "previous-prescription": {
    id: "previous-prescription",
    title: "Previous prescription",
    summary:
      "Transfer patients — label, Rx, order confirmation, or provider letter",
    accept: PATIENT_DOC_MEDIA_ACCEPT,
    acceptMime: PATIENT_DOC_MEDIA_ACCEPT,
    isVideo: false,
    maxMb: 15,
    criteria: [
      "Provider name, your name, date, and medication with strength",
      "Skip if you have not been asked for proof",
    ],
  },
  "previous-bmi-verification": {
    id: "previous-bmi-verification",
    title: "Previous BMI verification",
    summary:
      "Photo showing your weight or BMI when you started weight-loss injections with your previous provider",
    accept: PATIENT_DOC_MEDIA_ACCEPT,
    acceptMime: PATIENT_DOC_MEDIA_ACCEPT,
    isVideo: false,
    maxMb: 15,
    criteria: [
      "Must show weight or BMI reading from when you began treatment with the other provider",
      "Distinct from a prescription alone — we need proof you met BMI criteria at start",
      "Skip if your current BMI already meets eligibility for your requested dose",
    ],
  },
  "supporting-evidence": {
    id: "supporting-evidence",
    title: "Supporting evidence",
    summary: "Letters or clinic notes for conditions you reported",
    accept: PATIENT_DOC_MEDIA_ACCEPT,
    acceptMime: PATIENT_DOC_MEDIA_ACCEPT,
    isVideo: false,
    maxMb: 15,
    criteria: ["Optional unless your pharmacist has asked for it"],
  },
};

/** Catalogue metadata for a single evidence slot (titles, accept rules, criteria). */
export function getSlotMeta(slotId: EvidenceSlotId): EvidenceSlotMeta {
  return EVIDENCE_SLOT_META[slotId];
}

/** One-line file-type hint for patient upload UI */
export function patientUploadFileHint(slotId: EvidenceSlotId): string {
  const meta = EVIDENCE_SLOT_META[slotId];
  if (slotId === "government-id") {
    return `Max ${meta.maxMb} MB · JPEG, PNG, HEIC, WebP`;
  }
  if (meta.isVideo) {
    return `Max ${meta.maxMb} MB · live video (MP4, WebM, MOV) or photo`;
  }
  return `Max ${meta.maxMb} MB · image, video, or PDF`;
}

export function isEvidenceSlotId(id: string): id is EvidenceSlotId {
  return (EVIDENCE_SLOT_IDS as readonly string[]).includes(id);
}

export function isTransferPatient(answers: Record<string, unknown>): boolean {
  return (
    answers.journey_stage === "transferring" ||
    answers.consultation_type === "transfer" ||
    answers.changing_from_provider === "yes" ||
    answers.new_to_injectables === "no"
  );
}

export function getDocumentRequirements(
  answers: Record<string, unknown>,
): Record<EvidenceSlotId, DocumentRequirement> {
  const overrides = (answers.document_requirements ?? {}) as Partial<
    Record<EvidenceSlotId, DocumentRequirement>
  >;
  const needsPriorRx = requiresPreviousPrescription(answers);
  const needsPriorBmi = requiresPreviousBmiVerification(answers);

  const base: Record<EvidenceSlotId, DocumentRequirement> = {
    "government-id": "optional",
    "full-body-video": "optional",
    "weight-scale-video": "optional",
    "previous-prescription": needsPriorRx ? "required" : "not_required",
    "previous-bmi-verification": needsPriorBmi ? "required" : "not_required",
    "supporting-evidence":
      answers.excluding_conditions === "yes" ? "optional" : "not_required",
  };

  for (const id of EVIDENCE_SLOT_IDS) {
    if (overrides[id]) base[id] = overrides[id]!;
  }
  return base;
}

export function isPreviousPrescriptionRequired(
  answers: Record<string, unknown>,
): boolean {
  return getDocumentRequirements(answers)["previous-prescription"] === "required";
}

export function isPreviousBmiVerificationRequired(
  answers: Record<string, unknown>,
): boolean {
  return (
    getDocumentRequirements(answers)["previous-bmi-verification"] === "required"
  );
}

/** Slots on patient checkout upload step */
export function checkoutVisibleSlots(answers: Record<string, unknown>): EvidenceSlotId[] {
  return patientUploadSlots(answers);
}

/** Slots in patient portal / upload link (same rules as checkout) */
export function patientUploadSlots(answers: Record<string, unknown>): EvidenceSlotId[] {
  const req = getDocumentRequirements(answers);
  return EVIDENCE_SLOT_IDS.filter((id) => {
    if (id === "supporting-evidence") {
      return answers.excluding_conditions === "yes" || req[id] !== "not_required";
    }
    if (id === "previous-prescription") {
      return req[id] !== "not_required";
    }
    if (id === "previous-bmi-verification") {
      return req[id] !== "not_required";
    }
    return true;
  });
}

/** All evidence slots shown to pharmacists in Rx (includes not-required previous Rx) */
export function rxVisibleSlots(answers: Record<string, unknown>): EvidenceSlotId[] {
  const docs = (answers.patient_documents ?? {}) as Record<
    string,
    import("./patientDocumentStorage").PatientDocumentSlotValue
  >;
  return EVIDENCE_SLOT_IDS.filter((id) => {
    if (id === "supporting-evidence") {
      return answers.excluding_conditions === "yes";
    }
    if (id === "previous-bmi-verification") {
      return (
        isWlPriorProviderPatient(answers) ||
        requiresPreviousBmiVerification(answers) ||
        slotHasUploads(docs[id])
      );
    }
    return true;
  });
}

export type DocumentRequirementChange = {
  at: string;
  by: string;
  slotId: EvidenceSlotId;
  from: DocumentRequirement;
  to: DocumentRequirement;
};

export function requirementLabel(req: DocumentRequirement): string {
  switch (req) {
    case "required":
      return "Required";
    case "not_required":
      return "Not required";
    default:
      return "Optional";
  }
}

export function buildCriteriaEmailNote(slotId: EvidenceSlotId): string {
  const meta = EVIDENCE_SLOT_META[slotId];
  return [
    `Please upload ${meta.title} that meets the following criteria:`,
    "",
    ...meta.criteria.map((c) => `• ${c}`),
  ].join("\n");
}

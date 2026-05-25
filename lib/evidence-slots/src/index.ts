export const EVIDENCE_SLOT_IDS = [
  "government-id",
  "full-body-video",
  "weight-scale-video",
  "previous-prescription",
  "supporting-evidence",
] as const;

export type EvidenceSlotId = (typeof EVIDENCE_SLOT_IDS)[number];

export type DocumentRequirement = "required" | "not_required" | "optional";

export type EvidenceSlotMeta = {
  id: EvidenceSlotId;
  title: string;
  /** One-line summary for cards */
  summary: string;
  accept: string;
  acceptMime: string;
  isVideo: boolean;
  maxMb: number;
  criteria: string[];
};

export const EVIDENCE_SLOT_META: Record<EvidenceSlotId, EvidenceSlotMeta> = {
  "government-id": {
    id: "government-id",
    title: "Government-issued ID",
    summary: "Valid photo ID — passport or driving licence",
    accept: "image/jpeg,image/png,image/heic,image/webp,.jpg,.jpeg,.png,.heic,.webp",
    acceptMime: "image/jpeg,image/png,image/heic,image/webp",
    isVideo: false,
    maxMb: 10,
    criteria: [
      "A valid photo ID that is clear, readable, and in date",
      "All four corners of the document must be visible",
      "Name and other details must be easy for the clinical team to read",
    ],
  },
  "full-body-video": {
    id: "full-body-video",
    title: "Full body video",
    summary: "Live video for BMI verification",
    accept: "video/*,image/jpeg,image/png,image/heic,image/webp",
    acceptMime: "video/*,image/jpeg,image/png,image/heic,image/webp",
    isVideo: true,
    maxMb: 50,
    criteria: [
      "Record a live video (not a photo) showing your full body",
      "Good lighting and fitted clothing that clearly shows your body shape",
      "Required so we can verify your BMI for clinical review",
    ],
  },
  "weight-scale-video": {
    id: "weight-scale-video",
    title: "Weight scale video",
    summary: "Live video — face and scale reading visible",
    accept: "video/*,image/jpeg,image/png,image/heic,image/webp",
    acceptMime: "video/*,image/jpeg,image/png,image/heic,image/webp",
    isVideo: true,
    maxMb: 50,
    criteria: [
      "Record a live video while standing on the scale",
      "Your face must be clearly visible",
      "The scale reading must be clearly visible and readable",
      "Use good lighting; show the weight reading on the scale",
    ],
  },
  "previous-prescription": {
    id: "previous-prescription",
    title: "Previous prescription",
    summary: "Transfer patients — proof from prior provider",
    accept: "image/*,video/*,application/pdf",
    acceptMime: "image/*,video/*,application/pdf",
    isVideo: false,
    maxMb: 15,
    criteria: [
      "Only required if you are transferring from another weight-loss provider",
      "Acceptable evidence: dispensing label, prescription, order confirmation, or provider letter",
      "Must show: provider name, your full name, date issued or dispensed, and medication name and strength",
      "Starter patients who have not been asked for proof can ignore this section",
    ],
  },
  "supporting-evidence": {
    id: "supporting-evidence",
    title: "Supporting evidence",
    summary: "Letters or notes for reported conditions",
    accept: "image/*,video/*,application/pdf",
    acceptMime: "image/*,video/*,application/pdf",
    isVideo: false,
    maxMb: 15,
    criteria: [
      "Letters, prescriptions, or clinic notes for conditions you reported",
      "Optional at checkout unless we have asked you to provide them",
    ],
  },
};

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
  const transfer = isTransferPatient(answers);

  const base: Record<EvidenceSlotId, DocumentRequirement> = {
    "government-id": "optional",
    "full-body-video": "optional",
    "weight-scale-video": "optional",
    "previous-prescription": transfer ? "required" : "not_required",
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
    return true;
  });
}

/** All evidence slots shown to pharmacists in Rx (includes not-required previous Rx) */
export function rxVisibleSlots(answers: Record<string, unknown>): EvidenceSlotId[] {
  return EVIDENCE_SLOT_IDS.filter((id) => {
    if (id === "supporting-evidence") {
      return answers.excluding_conditions === "yes";
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

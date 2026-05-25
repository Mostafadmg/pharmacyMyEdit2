export {
  EVIDENCE_SLOT_IDS,
  EVIDENCE_SLOT_META,
  patientUploadSlots,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";

import { EVIDENCE_SLOT_META, type EvidenceSlotId } from "@workspace/evidence-slots";

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
  title: EVIDENCE_SLOT_META[id as EvidenceSlotId].title,
}));

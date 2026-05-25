import {
  EVIDENCE_SLOT_META,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";

export function EvidenceCriteriaList({ slotId }: { slotId: EvidenceSlotId }) {
  const criteria = EVIDENCE_SLOT_META[slotId].criteria;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-stone-600">
      {criteria.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

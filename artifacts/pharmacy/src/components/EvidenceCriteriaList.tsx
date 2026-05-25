import {
  EVIDENCE_SLOT_META,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";

export function EvidenceCriteriaList({ slotId }: { slotId: EvidenceSlotId }) {
  const criteria = EVIDENCE_SLOT_META[slotId].criteria.slice(0, 3);
  if (criteria.length === 0) return null;
  return (
    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs leading-snug text-stone-600">
      {criteria.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

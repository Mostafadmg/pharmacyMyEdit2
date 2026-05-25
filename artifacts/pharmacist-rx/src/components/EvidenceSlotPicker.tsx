import { RxOptionPicker } from "@/components/RxOptionPicker";
import {
  PRESCRIPTION_EVIDENCE_SLOTS,
  type EvidenceSlotId,
} from "@/lib/prescriptionEvidenceSlots";

export function EvidenceSlotPicker({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: EvidenceSlotId;
  onChange: (id: EvidenceSlotId) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RxOptionPicker
      value={value}
      onChange={onChange}
      options={PRESCRIPTION_EVIDENCE_SLOTS.map((slot) => ({
        value: slot.id,
        label: slot.title,
      }))}
      placeholder="Select document type…"
      menuLabel="Document type"
      disabled={disabled}
      className={className}
      allowEmpty={false}
    />
  );
}

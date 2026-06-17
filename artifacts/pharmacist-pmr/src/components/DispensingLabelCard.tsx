import type { PrescriptionItem } from "@workspace/api-client-react";
import type { Consultation } from "@workspace/api-client-react";
import { formatExpiryDisplay } from "@/lib/gs1Barcode";
import type { LabelPackDetails } from "@/lib/labelPrint";

const PHARMACY_HEADER = "EveryDayMeds Pharmacy · GPhC 9011223";
const CAUTION =
  "Keep out of sight and reach of children. Read the leaflet provided with this medicine.";

export function DispensingLabelCard({
  consult,
  item,
  index,
  packDetails,
  className = "",
}: {
  consult: Consultation;
  item: PrescriptionItem;
  index: number;
  packDetails?: LabelPackDetails;
  className?: string;
}) {
  return (
    <div
      className={`border-2 border-dashed border-border rounded-md p-4 bg-card ${className}`}
      data-testid={`label-${index}`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {PHARMACY_HEADER}
      </div>
      <div className="font-semibold mt-1">
        {item.name} {item.strength} {item.form}
      </div>
      <div className="text-sm mt-1">Qty: {item.quantity}</div>
      <div className="text-sm mt-1 italic">{item.sig}</div>
      <div className="text-xs text-muted-foreground mt-2">
        For: {consult.patientName} · Duration {item.duration}
      </div>
      {(packDetails?.batch || packDetails?.expiry) && (
        <div className="text-xs text-muted-foreground mt-1">
          {packDetails.batch ? `Batch ${packDetails.batch}` : null}
          {packDetails.batch && packDetails.expiry ? " · " : null}
          {packDetails.expiry
            ? `Exp ${formatExpiryDisplay(packDetails.expiry)}`
            : null}
        </div>
      )}
      {item.notes && (
        <div className="text-xs text-muted-foreground mt-1">
          Note: {item.notes}
        </div>
      )}
      <div className="text-[10px] mt-3 border-t border-border pt-2 text-muted-foreground">
        {CAUTION}
      </div>
    </div>
  );
}

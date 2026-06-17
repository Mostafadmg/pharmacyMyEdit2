import { cn } from "@/lib/utils";
import {
  PMR_STATUS_LABELS,
  pmrStatusTone,
  type PmrWorkflowStatus,
} from "@/lib/pmrStatus";

export function PmrStatusBadge({ status }: { status: PmrWorkflowStatus }) {
  return (
    <span className={cn("pmr-status-pill", pmrStatusTone(status))}>
      {PMR_STATUS_LABELS[status]}
    </span>
  );
}

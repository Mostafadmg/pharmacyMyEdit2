import { Link } from "wouter";
import type { Consultation } from "@workspace/api-client-react";
import { ChevronRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PmrStatusBadge } from "@/components/PmrStatusBadge";
import { usePatientsContext } from "@/context/PatientsContext";
import type { PmrWorkflowStatus } from "@/lib/pmrStatus";

export function DispensingRow({ consultation }: { consultation: Consultation }) {
  const { getStatus } = usePatientsContext();
  const status = getStatus(consultation);

  return (
    <Link href={`/prescription/${consultation.id}`}>
      <div
        className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
        data-testid={`row-dispensing-${consultation.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="pmr-display-sm truncate">{consultation.patientName}</div>
          <div className="pmr-meta truncate text-xs">
            {consultation.conditionName} · Ref{" "}
            {consultation.consultationNumber ?? consultation.id.slice(0, 8)}
          </div>
        </div>
        <PmrStatusBadge status={status} />
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          PDF
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

export function DispensingList({
  filter,
  emptyMessage,
}: {
  filter?: PmrWorkflowStatus | "active" | "board";
  emptyMessage: string;
}) {
  const { approved, approvedLoading, getStatus } = usePatientsContext();

  const rows = approved.filter((c) => {
    const status = getStatus(c);
    if (filter === "board") {
      return (
        status === "inbox" ||
        status === "awaiting_check" ||
        status === "pick" ||
        status === "parked" ||
        status === "label" ||
        status === "pack"
      );
    }
    if (filter === "active") return status !== "completed";
    if (filter) return status === filter;
    return true;
  });

  return (
    <Card className="overflow-hidden divide-y divide-border">
      {approvedLoading ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          Loading queue…
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        rows.map((c) => <DispensingRow key={c.id} consultation={c} />)
      )}
    </Card>
  );
}

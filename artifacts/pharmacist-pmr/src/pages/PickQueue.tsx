import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ClipboardList, Printer, ScanLine } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { usePatientsContext } from "@/context/PatientsContext";
import { useToast } from "@/hooks/use-toast";
import {
  medicationPickLine,
  PMR_STATUS_LABELS,
  resolvePmrStatus,
} from "@/lib/pmrStatus";
import { postPmrPickingLabel } from "@/lib/pmrWorkflowApi";
import { printPickingLabelHtml } from "@/lib/pickingLabelPrint";

export function PickQueue() {
  const { approved, approvedLoading, refreshApproved, getStatus } =
    usePatientsContext();
  const { toast } = useToast();
  const [printingId, setPrintingId] = useState<string | null>(null);

  const pickQueue = useMemo(
    () =>
      approved.filter((c) => {
        const status = getStatus(c);
        return status === "pick" || c.pmrWorkflowStatus === "pick";
      }),
    [approved, getStatus],
  );

  async function printPickingLabel(c: Consultation) {
    setPrintingId(c.id);
    try {
      const res = await postPmrPickingLabel(c.id);
      await printPickingLabelHtml(res.html);
      toast({
        title: "Picking ticket sent to printer",
        description: `${res.pickingLabelCode} — moved to Label on the board`,
      });
      refreshApproved();
    } catch (err) {
      toast({
        title: "Print failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setPrintingId(null);
    }
  }

  return (
    <div className="pmr-page-inner max-w-4xl">
      <div className="pmr-hero flex items-start justify-between gap-4">
        <div>
          <h1 className="pmr-page-title flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Pick queue
          </h1>
          <p className="pmr-page-subtitle">
            Print a picking ticket with patient and medication details, collect
            stock, then scan the barcode anywhere in the app.
          </p>
        </div>
        <Link
          href="/labelling"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0 mt-1"
        >
          <ScanLine className="h-3.5 w-3.5" />
          Labelling bench
        </Link>
      </div>

      {approvedLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : pickQueue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No prescriptions ready to pick.
          </p>
          <Link href="/queue" className="text-sm text-primary hover:underline mt-2 inline-block">
            Back to prescription board
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {pickQueue.map((c) => {
            const items = c.prescriptionItems ?? [];
            const status = resolvePmrStatus(c);
            const medLine = medicationPickLine(c);
            return (
              <li
                key={c.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm hover:border-primary/25 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-bold text-primary">
                      {c.patientName}
                    </p>
                    {medLine && (
                      <p className="text-sm text-foreground/90 mt-1">{medLine}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      Ref {c.consultationNumber ?? c.id.slice(0, 8)}
                      {c.pickingLabelCode ? ` · ${c.pickingLabelCode}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full shrink-0 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
                    {PMR_STATUS_LABELS[status]}
                  </span>
                </div>
                {items.length > 1 && (
                  <ul className="mt-3 space-y-1 border-t border-border/50 pt-3">
                    {items.map((it, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex justify-between gap-2">
                        <span>
                          {it.name} {it.strength}
                        </span>
                        <span className="font-semibold text-foreground shrink-0">
                          Qty {it.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    type="button"
                    size="sm"
                    disabled={printingId === c.id}
                    onClick={() => void printPickingLabel(c)}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    {printingId === c.id ? "Printing…" : "Print picking ticket"}
                  </Button>
                  <Link href={`/labelling/${c.id}`}>
                    <Button type="button" size="sm" variant="outline">
                      Open labelling
                    </Button>
                  </Link>
                  <Link href={`/queue?select=${encodeURIComponent(c.id)}`}>
                    <Button type="button" size="sm" variant="ghost" className="text-muted-foreground">
                      View on board
                    </Button>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

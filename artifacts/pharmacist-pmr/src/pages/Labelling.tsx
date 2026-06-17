import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import type { Consultation, PrescriptionItem } from "@workspace/api-client-react";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanPanel } from "@/components/BarcodeScanPanel";
import { usePatientsContext } from "@/context/PatientsContext";
import { useToast } from "@/hooks/use-toast";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { printConsultationLabels } from "@/lib/labelPrint";
import {
  getConsultationByPickCode,
  patchPmrWorkflow,
  postPmrDispatch,
  postPmrVerifyItem,
} from "@/lib/pmrWorkflowApi";
import { cn } from "@/lib/utils";

function verifiedIndexesFromConsultation(c: Consultation): Set<number> {
  const items = c.pickVerifiedItems ?? [];
  return new Set(items.map((v) => v.itemIndex));
}

export function LabellingLanding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);

  const resolveCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      setLoading(true);
      try {
        const c = await getConsultationByPickCode(trimmed);
        await patchPmrWorkflow(c.id, "labelling");
        navigate(`/labelling/${c.id}`);
      } catch (err) {
        toast({
          title: "Pick label not recognised",
          description: err instanceof Error ? err.message : "Try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [navigate, toast],
  );

  useBarcodeScanner({
    enabled: !loading,
    onScan: (code) => {
      if (code.toUpperCase().startsWith("PICK-")) {
        void resolveCode(code);
      }
    },
  });

  return (
    <div className="pmr-page-inner max-w-lg mx-auto">
      <Link
        href="/queue"
        className="pmr-back mb-5 inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Board
      </Link>
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-primary/[0.06] px-6 py-8 text-center border-b border-border">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <ScanLine className="h-8 w-8" />
          </div>
          <h1 className="pmr-page-title text-xl">Labelling bench</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Scan a picking ticket barcode (PICK-…) or enter the code below. Works
            from anywhere in the app when using a USB scanner.
          </p>
        </div>
        <form
          className="p-6 flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void resolveCode(manualCode);
          }}
        >
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="PICK-CON-…"
            className="font-mono text-sm h-11"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !manualCode.trim()} className="h-11 px-6">
            {loading ? "Opening…" : "Open session"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function LabellingSession() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [, navigate] = useLocation();
  const { approved, approvedLoading, refreshApproved } = usePatientsContext();
  const { toast } = useToast();
  const [verifiedIndexes, setVerifiedIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [dispatching, setDispatching] = useState(false);

  const consultation = useMemo(
    () => approved.find((c) => c.id === id) ?? null,
    [approved, id],
  );

  const items = consultation?.prescriptionItems ?? [];

  useEffect(() => {
    if (!consultation) return;
    setVerifiedIndexes(verifiedIndexesFromConsultation(consultation));
  }, [consultation]);

  useEffect(() => {
    const next = items.findIndex((_, idx) => !verifiedIndexes.has(idx));
    if (next >= 0) setActiveIndex(next);
  }, [items, verifiedIndexes]);

  const allVerified =
    items.length > 0 && items.every((_, idx) => verifiedIndexes.has(idx));

  const verifiedCount = verifiedIndexes.size;
  const progressPct =
    items.length > 0 ? Math.round((verifiedCount / items.length) * 100) : 0;

  async function onVerified(result: {
    barcode: string;
    itemIndex: number;
  }) {
    if (!consultation) return;
    try {
      const res = await postPmrVerifyItem(consultation.id, {
        barcode: result.barcode,
        itemIndex: result.itemIndex,
      });
      if (!res.match) {
        toast({
          title: "Wrong item scanned",
          description: res.scannedProduct
            ? `Scanned ${res.scannedProduct}${res.expectedProduct ? ` — expected ${res.expectedProduct}` : ""}`
            : "Barcode not in catalogue",
          variant: "destructive",
        });
        return;
      }
      setVerifiedIndexes(
        new Set(res.pickVerifiedItems.map((v) => v.itemIndex)),
      );
      const item = items[res.itemIndex ?? result.itemIndex];
      if (item) {
        await printConsultationLabels(
          { ...consultation, prescriptionItems: [item] },
          { silent: true },
        );
      }
      toast({ title: "Verified", description: res.scannedProduct ?? undefined });
      refreshApproved();
    } catch (err) {
      toast({
        title: "Verify failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  }

  async function onPackage() {
    if (!consultation) return;
    setDispatching(true);
    try {
      await patchPmrWorkflow(consultation.id, "pack");
      toast({ title: "Moved to Pack" });
      refreshApproved();
    } catch (err) {
      toast({
        title: "Could not update status",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setDispatching(false);
    }
  }

  async function onDispatch() {
    if (!consultation) return;
    setDispatching(true);
    try {
      await postPmrDispatch(consultation.id);
      toast({ title: "Dispatched", description: "Prescription closed." });
      refreshApproved();
      navigate("/queue");
    } catch (err) {
      toast({
        title: "Dispatch failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setDispatching(false);
    }
  }

  if (approvedLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading session…</div>
    );
  }

  if (!consultation) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">Prescription not found.</p>
        <Link href="/labelling" className="text-sm text-primary hover:underline">
          Scan pick label
        </Link>
      </div>
    );
  }

  const activeItem: PrescriptionItem | undefined = items[activeIndex];

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/queue"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Board
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">
            Labelling — {consultation.patientName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-muted-foreground font-mono">
              {consultation.pickingLabelCode ?? "No pick code"}
            </p>
            <span className="text-[10px] font-semibold text-primary tabular-nums">
              {verifiedCount}/{items.length} verified
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full max-w-[200px] rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">
        <aside className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
            Prescription lines
          </p>
          {items.map((item, idx) => {
            const verified = verifiedIndexes.has(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "w-full text-left rounded-lg border px-2.5 py-2 text-xs transition-colors",
                  verified
                    ? "border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
                    : idx === activeIndex
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2">
                  {verified ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-current shrink-0 opacity-40" />
                  )}
                  <span className="font-medium truncate">
                    {item.name} {item.strength}
                  </span>
                </div>
                <p className="pl-5 mt-0.5 opacity-80">Qty {item.quantity}</p>
              </button>
            );
          })}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeItem && !verifiedIndexes.has(activeIndex) && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-primary tracking-wide">
                Scan this pack
              </p>
              <p className="text-lg font-semibold mt-1">
                {activeItem.name} {activeItem.strength}
              </p>
              <p className="text-4xl font-bold tabular-nums text-primary mt-2">
                {activeItem.quantity}
              </p>
            </div>
          )}

          <BarcodeScanPanel
            items={items}
            verifiedIndexes={verifiedIndexes}
            onVerified={(r) => void onVerified(r)}
            disabled={allVerified}
          />

          {allVerified && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                All lines verified. Package for dispatch or hand out when ready.
              </p>
            </div>
          )}
        </main>
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-3 flex flex-wrap gap-2 justify-end bg-card/80">
        <Link href="/queue">
          <Button type="button" variant="outline" size="sm">
            Save & exit
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!allVerified || dispatching}
          onClick={() => void onPackage()}
        >
          <Package className="h-3.5 w-3.5 mr-1.5" />
          Package now
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!allVerified || dispatching}
          onClick={() => void onDispatch()}
        >
          Hand out / dispatch
        </Button>
      </footer>
    </div>
  );
}

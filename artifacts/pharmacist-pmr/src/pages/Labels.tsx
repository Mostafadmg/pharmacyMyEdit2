import { useEffect, useState } from "react";

import { Printer, Tag } from "lucide-react";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { PmrPageTitle, PmrShell } from "@/components/pmr";

import { DispensingLabelCard } from "@/components/DispensingLabelCard";

import { usePatientsContext } from "@/context/PatientsContext";

import { markLabelPrinted } from "@/lib/pmrStatus";

import { useToast } from "@/hooks/use-toast";

import type { PrescriptionItem } from "@workspace/api-client-react";
import { printConsultationLabels } from "@/lib/labelPrint";

import { isDesktopApp, type EdmPmrPrinter } from "@/lib/electronBridge";



export function Labels() {

  const { approved, getStatus } = usePatientsContext();

  const { toast } = useToast();

  const labelReady = approved.filter((c) => {
    const s = getStatus(c);
    return s === "pick" || s === "label" || s === "parked";
  });

  const [selected, setSelected] = useState<string | null>(null);

  const [printing, setPrinting] = useState(false);

  const [printers, setPrinters] = useState<EdmPmrPrinter[]>([]);

  const [printerName, setPrinterName] = useState("");

  const consult = labelReady.find((c) => c.id === selected) ?? null;



  useEffect(() => {

    if (!isDesktopApp() || !window.edmPmr) return;

    void window.edmPmr.listPrinters().then((list) => {

      setPrinters(list);

      const def = list.find((p) => p.isDefault);

      if (def) setPrinterName(def.name);

    });

  }, []);



  function markLabelled() {
    if (!consult) return;
    markLabelPrinted(consult.id);
    toast({ title: "Moved to Label", description: consult.patientName });
  }



  async function handlePrint() {

    if (!consult) return;

    setPrinting(true);

    try {

      const mode = await printConsultationLabels(consult, {
        deviceName: printerName || undefined,
        silent: isDesktopApp(),
      });
      markLabelPrinted(consult.id);
      toast({

        title: "Labels sent to printer",

        description:

          mode === "electron"

            ? `Printed via ${printerName || "default printer"}`

            : "Browser print dialog opened",

      });

    } catch (err) {

      toast({

        title: "Print failed",

        description: err instanceof Error ? err.message : "Unknown error",

        variant: "destructive",

      });

    } finally {

      setPrinting(false);

    }

  }



  return (

    <PmrShell className="max-w-[1100px]">

      <PmrPageTitle

        title="Dispensing labels"

        subtitle="Generate BNF-compliant cautionary and advisory labels for clinically checked prescriptions."

      />



      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">

        <Card className="divide-y divide-border max-h-[70vh] overflow-y-auto">

          <div className="px-4 py-3 pmr-label-caps bg-accent/50 border-b border-border">

            Clinically checked · pick a prescription

          </div>

          {labelReady.map((c) => (

            <button

              key={c.id}

              type="button"

              onClick={() => setSelected(c.id)}

              data-testid={`select-label-${c.id}`}

              className={`w-full text-left px-4 py-3 hover:bg-muted/40 ${

                selected === c.id ? "bg-primary/5 border-l-2 border-primary" : ""

              }`}

            >

              <div className="pmr-display-sm truncate">{c.patientName}</div>

              <div className="text-xs text-muted-foreground truncate">

                {c.conditionName}

              </div>

            </button>

          ))}

          {labelReady.length === 0 && (

            <div className="px-4 py-8 text-center text-sm text-muted-foreground">

              Complete clinical check first — nothing ready to label.

            </div>

          )}

        </Card>



        <Card className="p-6">

          {!consult ? (

            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-16">

              <Tag className="h-10 w-10 mb-3 opacity-50" />

              Select a prescription to preview its labels.

            </div>

          ) : (

            <div>

              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">

                <h2 className="pmr-display-sm text-lg">

                  Labels for {consult.patientName}

                </h2>

                <div className="flex gap-2 flex-wrap items-center">

                  {isDesktopApp() && printers.length > 0 && (

                    <select

                      value={printerName}

                      onChange={(e) => setPrinterName(e.target.value)}

                      className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"

                      aria-label="Label printer"

                    >

                      {printers.map((p) => (

                        <option key={p.name} value={p.name}>

                          {p.displayName || p.name}

                          {p.isDefault ? " (default)" : ""}

                        </option>

                      ))}

                    </select>

                  )}

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={markLabelled}

                    data-testid="button-mark-labelled"

                  >

                    Mark labelled

                  </Button>

                  <Button

                    size="sm"

                    onClick={() => void handlePrint()}

                    disabled={printing}

                    data-testid="button-print-label"

                  >

                    <Printer className="h-4 w-4 mr-2" />

                    {printing ? "Printing…" : "Print"}

                  </Button>

                </div>

              </div>

              <div className="space-y-3">

                {(consult.prescriptionItems ?? []).map((it: PrescriptionItem, i: number) => (

                  <DispensingLabelCard

                    key={i}

                    consult={consult}

                    item={it}

                    index={i}

                  />

                ))}

                {(consult.prescriptionItems ?? []).length === 0 && (

                  <p className="text-sm text-muted-foreground">

                    No prescription items recorded.

                  </p>

                )}

              </div>

            </div>

          )}

        </Card>

      </div>

    </PmrShell>

  );

}


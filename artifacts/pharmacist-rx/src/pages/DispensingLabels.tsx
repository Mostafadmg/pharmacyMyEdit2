import { useState } from "react";
import { Printer, Tag } from "lucide-react";
import { useListConsultations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RxPageTitle, RxShell } from "@/components/rx";

export function DispensingLabels() {
  const { data } = useListConsultations({ status: "approved", limit: 60 });
  const [selected, setSelected] = useState<string | null>(null);
  const consult = (data?.consultations ?? []).find((c) => c.id === selected) ?? null;

  return (
    <RxShell className="max-w-[1100px]">
      <RxPageTitle
        title="Dispensing Labels"
        subtitle="Generate BNF-compliant cautionary and advisory labels for any approved consultation."
      />

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <Card className="divide-y divide-border max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 rx-label-caps bg-rx-approve-surface/80 border-b border-border">
            Approved · pick a consultation
          </div>
          {(data?.consultations ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              data-testid={`select-label-${c.id}`}
              className={`w-full text-left px-4 py-3 hover:bg-muted/40 ${
                selected === c.id ? "bg-primary/5 border-l-2 border-primary" : ""
              }`}
            >
              <div className="rx-display-sm truncate">{c.patientName}</div>
              <div className="text-xs text-muted-foreground truncate">
                {c.conditionName}
              </div>
            </button>
          ))}
          {(data?.consultations ?? []).length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Approve a consultation first.
            </div>
          )}
        </Card>

        <Card className="p-6">
          {!consult ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-16">
              <Tag className="h-10 w-10 mb-3 opacity-50" />
              Select an approved consultation to preview its labels.
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="rx-display-sm text-lg">
                  Labels for {consult.patientName}
                </h2>
                <Button
                  onClick={() => window.print()}
                  size="sm"
                  data-testid="button-print-label"
                >
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              </div>
              <div className="space-y-3">
                {(consult.prescriptionItems ?? []).map((it, i) => (
                  <div
                    key={i}
                    className="border-2 border-dashed border-border rounded-md p-4 bg-card"
                    data-testid={`label-${i}`}
                  >
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      PharmaCare Pharmacy · GPhC 9011223
                    </div>
                    <div className="font-semibold mt-1">
                      {it.name} {it.strength} {it.form}
                    </div>
                    <div className="text-sm mt-1">Qty: {it.quantity}</div>
                    <div className="text-sm mt-1 italic">{it.sig}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      For: {consult.patientName} · Duration {it.duration}
                    </div>
                    {it.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Note: {it.notes}
                      </div>
                    )}
                    <div className="text-[10px] mt-3 border-t border-border pt-2 text-muted-foreground">
                      Keep out of sight and reach of children. Read the leaflet provided with this medicine.
                    </div>
                  </div>
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
    </RxShell>
  );
}

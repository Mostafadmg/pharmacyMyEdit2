import { Link } from "wouter";
import { FileText, Download } from "lucide-react";
import { useListConsultations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RxPageTitle, RxShell } from "@/components/rx";

export function Prescriptions() {
  const { data, isLoading } = useListConsultations({ status: "approved", limit: 100 });
  const rows = data?.consultations ?? [];

  return (
    <RxShell className="max-w-[1200px]">
      <RxPageTitle
        title="Prescriptions Issued"
        subtitle="Branded PDFs for every approved consultation, available to dispense."
      />
      <Card className="divide-y divide-emerald-100 overflow-hidden">
        {isLoading && (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No prescriptions issued yet.
          </div>
        )}
        {rows.map((c) => (
          <div
            key={c.id}
            className="px-5 py-4 flex items-center gap-4 hover:bg-rx-approve-surface/30 transition-colors"
            data-testid={`row-prescription-${c.id}`}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="rx-display-sm truncate">{c.patientName}</div>
              <div className="rx-meta truncate text-xs">
                {c.conditionName} · Issued {c.reviewedAt
                  ? new Date(c.reviewedAt).toLocaleDateString("en-GB")
                  : "—"}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {c.prescriptionItems?.length ?? 0} items
            </Badge>
            <Link href={`/orders/${c.id}`}>
              <button className="text-sm text-primary hover:underline">View</button>
            </Link>
            <a
              href={`/api/consultations/${c.id}/prescription.pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-primary"
              data-testid={`link-pdf-${c.id}`}
            >
              <Download className="h-4 w-4" /> PDF
            </a>
          </div>
        ))}
      </Card>
    </RxShell>
  );
}

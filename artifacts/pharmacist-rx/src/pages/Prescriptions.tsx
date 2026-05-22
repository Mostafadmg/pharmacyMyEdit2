import { Link } from "wouter";
import { FileText, Download } from "lucide-react";
import { useListConsultations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Prescriptions() {
  const { data, isLoading } = useListConsultations({ status: "approved", limit: 100 });
  const rows = data?.consultations ?? [];

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          Prescriptions Issued
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Branded PDFs for every approved consultation, available to dispense.
        </p>
      </div>
      <Card className="divide-y divide-border">
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
            className="px-5 py-4 flex items-center gap-4"
            data-testid={`row-prescription-${c.id}`}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.patientName}</div>
              <div className="text-xs text-muted-foreground truncate">
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
    </div>
  );
}

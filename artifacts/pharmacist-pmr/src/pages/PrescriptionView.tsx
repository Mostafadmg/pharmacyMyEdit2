import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, ScanLine, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PmrShell } from "@/components/pmr";
import { PmrStatusBadge } from "@/components/PmrStatusBadge";
import { usePatientsContext } from "@/context/PatientsContext";
import {
  isClinicalQueue,
  isRxClinicallyPreChecked,
} from "@/lib/pmrStatus";
import { postPmrDispatch } from "@/lib/pmrWorkflowApi";
import { prescriptionPdfUrl } from "@/lib/pharmacistSession";
import { useToast } from "@/hooks/use-toast";

export function PrescriptionView({ id }: { id: string }) {
  const { approved, getStatus, refreshApproved } = usePatientsContext();
  const { toast } = useToast();
  const consult = approved.find((c) => c.id === id);
  const status = consult ? getStatus(consult) : null;
  const pdfUrl = prescriptionPdfUrl(id);

  if (!consult) {
    return (
      <PmrShell className="max-w-[1200px]">
        <Link href="/queue" className="pmr-back mb-5 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to board
        </Link>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Prescription not found. It may not be approved in the Rx portal yet.
        </Card>
      </PmrShell>
    );
  }

  async function dispatch() {
    try {
      await postPmrDispatch(consult!.id);
      toast({ title: "Marked complete" });
      refreshApproved();
    } catch (err) {
      toast({
        title: "Dispatch failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  }

  return (
    <PmrShell className="max-w-[1200px]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <Link href="/queue" className="pmr-back inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to board
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in new tab
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={pdfUrl} download>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </a>
          </Button>
        </div>
      </div>

      <Card className="p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="pmr-page-title">{consult.patientName}</h1>
            <p className="pmr-meta mt-1">
              {consult.conditionName} · Ref{" "}
              {consult.consultationNumber ?? consult.id}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {consult.patientEmail}
              {consult.patientAge ? ` · Age ${consult.patientAge}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {status && <PmrStatusBadge status={status} />}
            {status &&
              isClinicalQueue(status) &&
              !isRxClinicallyPreChecked(consult) && (
              <Link href={`/clinical-check/${consult.id}`}>
                <Button data-testid="button-clinical-check">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Open clinical check
                </Button>
              </Link>
            )}
            {status === "pick" && (
              <Link href={`/labelling/${consult.id}`}>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-1" />
                  Go to labelling
                </Button>
              </Link>
            )}
            {(status === "pick" || status === "label") && (
              <Link href={`/labelling/${consult.id}`}>
                <Button variant="outline" size="sm">
                  <ScanLine className="h-4 w-4 mr-1" />
                  Scan & verify
                </Button>
              </Link>
            )}
            {status === "pack" && (
              <Button size="sm" onClick={dispatch}>
                Hand out / dispatch
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
          <p className="text-sm font-semibold">Prescription (A4 PDF from Rx portal)</p>
          <span className="text-xs text-muted-foreground">
            {(consult.prescriptionItems ?? []).length} item(s)
          </span>
        </div>
        <div className="bg-[#525659] p-4 sm:p-6 flex justify-center min-h-[70vh]">
          <iframe
            title={`Prescription for ${consult.patientName}`}
            src={pdfUrl}
            className="w-full max-w-[210mm] h-[min(297mm,75vh)] bg-white shadow-2xl rounded-sm border-0"
            data-testid="prescription-pdf-frame"
          />
        </div>
      </Card>
    </PmrShell>
  );
}

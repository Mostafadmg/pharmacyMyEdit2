import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import type { Consultation } from "@workspace/api-client-react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  Inbox,
  List,
  MessageSquare,
  Minus,
  Package,
  PauseCircle,
  Pill,
  Plus,
  Printer,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildPrescriptionTags,
  dispensingPeriodLabel,
  footerStatusMessage,
  formatDrawerLongDate,
  hasDisplayValue,
  isInboxStatus,
  isRxClinicallyPreChecked,
  patientAddressOrUndefined,
  prescriptionSourceCode,
  prescriptionTypeLabel,
  treatmentTypeLabel,
  type PmrWorkflowStatus,
} from "@/lib/pmrStatus";
import { printPickingLabelHtml } from "@/lib/pickingLabelPrint";
import {
  patchPmrWorkflow,
  postPmrPickingLabel,
} from "@/lib/pmrWorkflowApi";
import { prescriptionPdfUrl } from "@/lib/pharmacistSession";
import { Button } from "@/components/ui/button";
import { usePatientsContext } from "@/context/PatientsContext";
import { useToast } from "@/hooks/use-toast";

type WorkflowStep = {
  id: string;
  label: string;
  shortLabel: string;
  icon: typeof Pill;
};

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "inbox", label: "Inbox", shortLabel: "Inbox", icon: Inbox },
  { id: "parked", label: "Parked", shortLabel: "Parked", icon: PauseCircle },
  { id: "pick", label: "Ready to pick", shortLabel: "Pick", icon: ClipboardList },
  { id: "label", label: "Ready to label", shortLabel: "Label", icon: Tag },
  { id: "pack", label: "Ready to package", shortLabel: "Pack", icon: Package },
  { id: "complete", label: "Complete", shortLabel: "Done", icon: Check },
];

const DRAWER_W = "min(calc(100vw - 2.25rem), 430px)";
const PREVIEW_W = "min(56vw, 520px)";

const PDF_ZOOM_MIN = 50;
const PDF_ZOOM_MAX = 200;
const PDF_ZOOM_STEP = 10;
const PDF_ZOOM_DEFAULT = 100;

const TAG_DOT_STYLES: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-sky-500",
  purple: "bg-violet-500",
  orange: "bg-amber-500",
};

function statusToStepIndex(status: PmrWorkflowStatus): number {
  switch (status) {
    case "awaiting_check":
    case "inbox":
      return 0;
    case "parked":
      return 1;
    case "pick":
      return 2;
    case "label":
      return 3;
    case "pack":
      return 4;
    case "completed":
      return 5;
    default:
      return 0;
  }
}

function patientInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function consultationRef(c: Consultation): string {
  const ref = c.consultationNumber;
  return ref ?? c.id.slice(0, 8);
}

function CompactStepper({
  status,
  onResumeParked,
}: {
  status: PmrWorkflowStatus;
  onResumeParked: () => void;
}) {
  const currentIndex = statusToStepIndex(status);
  const isParked = status === "parked";

  return (
    <div className="px-3 py-2.5 border-b border-border/50">
      {isParked && (
        <div className="mb-2 flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50/80 px-2 py-1.5 dark:border-amber-800/40 dark:bg-amber-950/25">
          <PauseCircle className="h-3 w-3 text-amber-600 shrink-0" />
          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-200 flex-1">
            Parked
          </span>
          <button
            type="button"
            onClick={onResumeParked}
            className="text-[9px] font-semibold text-amber-700 hover:underline dark:text-amber-300"
          >
            Resume
          </button>
        </div>
      )}

      <div
        className="grid grid-cols-6 gap-0.5"
        role="list"
        aria-label="Dispensing progress"
      >
        {WORKFLOW_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex && !isParked;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              role="listitem"
              title={step.label}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md py-1",
                current && "bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                  current && "border-primary bg-primary text-primary-foreground shadow-sm",
                  done && "border-primary/40 bg-primary/5 text-primary",
                  !current && !done && "border-border/80 bg-muted/30 text-muted-foreground/60",
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </span>
              <span
                className={cn(
                  "text-[8px] font-semibold leading-none truncate w-full text-center",
                  current ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground/55",
                )}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailField({
  label,
  children,
  hideWhenEmpty,
}: {
  label: string;
  children: React.ReactNode;
  hideWhenEmpty?: boolean;
}) {
  const text =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : null;
  if (hideWhenEmpty && text !== null && !hasDisplayValue(text)) return null;

  return (
    <div className="py-2 border-b border-border/25 last:border-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/75 mb-0.5">
        {label}
      </dt>
      <dd className="text-[12px] text-foreground leading-relaxed">{children}</dd>
    </div>
  );
}

function MedicationRow({
  item,
}: {
  item: NonNullable<Consultation["prescriptionItems"]>[number];
  index: number;
}) {
  const subtitle = [item.strength, item.form].filter((p) => p?.trim()).join(" · ");
  const hasSig = hasDisplayValue(item.sig);

  return (
    <div className="border-b border-border/25 last:border-0 bg-card even:bg-muted/15">
      <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 items-start">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground leading-snug">
            {item.name}
          </p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          {hasSig && (
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {item.sig}
            </p>
          )}
        </div>
        {hasDisplayValue(item.quantity) && (
          <p className="text-[12px] font-bold text-primary tabular-nums shrink-0">
            {item.quantity}
          </p>
        )}
      </div>
    </div>
  );
}

function CollapseRow({
  icon: Icon,
  label,
  count,
  open,
  onToggle,
  children,
  accent = false,
}: {
  icon: typeof FileText;
  label: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-border/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/25 transition-colors"
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            accent ? "text-primary" : "text-muted-foreground",
          )}
        />
        <span
          className={cn(
            "flex-1 text-[12px] font-medium truncate",
            accent ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </span>
        {count !== undefined && (
          <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
        {children !== undefined &&
          (open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ))}
      </button>
      {open && children && <div className="px-3 pb-2.5 pl-8">{children}</div>}
    </div>
  );
}

export function PrescriptionBoardDrawer({
  consultation,
  status,
  open,
  onClose,
}: {
  consultation: Consultation | null;
  status: PmrWorkflowStatus | null;
  open: boolean;
  onClose: () => void;
}) {
  const [imagesOpen, setImagesOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(PDF_ZOOM_DEFAULT);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const { refreshApproved } = usePatientsContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!open) {
      setImagesOpen(false);
      setDetailsOpen(true);
      setCommentsOpen(false);
      setPdfZoom(PDF_ZOOM_DEFAULT);
    }
  }, [open]);

  const clampPdfZoom = useCallback(
    (value: number) => Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, value)),
    [],
  );

  const handlePdfZoomWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? PDF_ZOOM_STEP : -PDF_ZOOM_STEP;
      setPdfZoom((z) => clampPdfZoom(z + delta));
    },
    [clampPdfZoom],
  );

  useEffect(() => {
    const el = pdfPreviewRef.current;
    if (!open || !imagesOpen || !el) return;
    el.addEventListener("wheel", handlePdfZoomWheel, { passive: false });
    return () => el.removeEventListener("wheel", handlePdfZoomWheel);
  }, [open, imagesOpen, handlePdfZoomWheel]);

  const zoomOut = useCallback(() => {
    setPdfZoom((z) => clampPdfZoom(z - PDF_ZOOM_STEP));
  }, [clampPdfZoom]);

  const zoomIn = useCallback(() => {
    setPdfZoom((z) => clampPdfZoom(z + PDF_ZOOM_STEP));
  }, [clampPdfZoom]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const rxPreChecked = consultation ? isRxClinicallyPreChecked(consultation) : false;
  const footerStatus = status ? footerStatusMessage(status) : null;
  const prescriptionTags = useMemo(
    () => (consultation ? buildPrescriptionTags(consultation) : []),
    [consultation],
  );

  if (!open || !consultation || !status || typeof document === "undefined") return null;

  const pdfUrl = prescriptionPdfUrl(consultation.id);
  const items = consultation.prescriptionItems ?? [];
  const ref = consultationRef(consultation);
  const receivedOn = formatDrawerLongDate(
    consultation.reviewedAt ?? consultation.createdAt,
  );
  const source = prescriptionSourceCode(consultation);
  const treatmentType = treatmentTypeLabel(consultation);
  const rxTags = prescriptionTags;
  const patientAddress = patientAddressOrUndefined(consultation);
  const dispensingPeriod = dispensingPeriodLabel(consultation);
  const gpSurgery = consultation.gpSurgery?.trim();

  async function resumeFromParked() {
    try {
      await patchPmrWorkflow(consultation!.id, "pick");
      toast({ title: "Resumed", description: "Moved to Pick" });
      refreshApproved();
    } catch (err) {
      toast({
        title: "Could not resume",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  }

  async function copyPrescriptionId() {
    try {
      await navigator.clipboard.writeText(ref);
      toast({ title: "Copied", description: "Prescription ID copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  function printPrescription() {
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  async function handleClinicalCheck() {
    if (!consultation) return;
    if (rxPreChecked) {
      setPrimaryLoading(true);
      try {
        await patchPmrWorkflow(consultation.id, "pick");
        toast({ title: "Ready to pick", description: "Pre-checked in Rx portal" });
        refreshApproved();
        onClose();
      } catch (err) {
        toast({
          title: "Could not process",
          description: err instanceof Error ? err.message : "Try again",
          variant: "destructive",
        });
      } finally {
        setPrimaryLoading(false);
      }
      return;
    }
    navigate(`/clinical-check/${consultation.id}`);
    onClose();
  }

  async function handlePrintPickingTicket() {
    if (!consultation) return;
    setPrimaryLoading(true);
    try {
      const res = await postPmrPickingLabel(consultation.id);
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
      setPrimaryLoading(false);
    }
  }

  function handleContinueLabelling() {
    if (!consultation) return;
    navigate(`/labelling/${consultation.id}`);
    onClose();
  }

  async function handlePackage() {
    if (!consultation) return;
    setPrimaryLoading(true);
    try {
      await patchPmrWorkflow(consultation.id, "pack");
      toast({ title: "Ready to package", description: "Moved to Pack" });
      refreshApproved();
      navigate(`/labelling/${consultation.id}`);
      onClose();
    } catch (err) {
      toast({
        title: "Could not update",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setPrimaryLoading(false);
    }
  }

  type PrimaryAction =
    | { label: string; onClick: () => void | Promise<void>; testId: string }
    | null;

  const primaryAction: PrimaryAction = (() => {
    if (isInboxStatus(status)) {
      return {
        label: rxPreChecked ? "Move to pick" : "Clinical check",
        onClick: handleClinicalCheck,
        testId: "drawer-process-btn",
      };
    }
    if (status === "pick") {
      return {
        label: primaryLoading ? "Printing…" : "Print picking ticket",
        onClick: handlePrintPickingTicket,
        testId: "drawer-print-pick-btn",
      };
    }
    if (status === "label") {
      return {
        label: "Continue labelling",
        onClick: handleContinueLabelling,
        testId: "drawer-label-btn",
      };
    }
    if (status === "pack") {
      return {
        label: "Package",
        onClick: handlePackage,
        testId: "drawer-pack-btn",
      };
    }
    if (status === "parked") {
      return {
        label: "Resume",
        onClick: resumeFromParked,
        testId: "drawer-resume-btn",
      };
    }
    return null;
  })();
  const commentCount = consultation.pharmacistNote?.trim() ? 1 : 0;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-200"
        aria-label="Close patient drawer"
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex",
          "animate-in slide-in-from-right duration-250 ease-out",
          "shadow-[-4px_0_24px_rgba(0,0,0,0.08)]",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`Patient — ${consultation.patientName}`}
        data-testid="prescription-board-drawer"
      >
        {/* Prescription preview */}
        <div
          className="h-full bg-background border-r border-border/60 overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{ width: imagesOpen ? PREVIEW_W : 0 }}
        >
          <div className="h-full flex flex-col" style={{ width: PREVIEW_W }}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/60 bg-card shrink-0">
              <Link
                href={`/prescription/${consultation.id}`}
                className="text-[11px] font-semibold text-primary hover:underline shrink-0"
              >
                Full details
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={pdfZoom <= PDF_ZOOM_MIN}
                  className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Zoom out"
                  data-testid="drawer-pdf-zoom-out"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span
                  className="min-w-[2.25rem] text-center text-[10px] font-medium tabular-nums text-muted-foreground"
                  data-testid="drawer-pdf-zoom-level"
                >
                  {pdfZoom}%
                </span>
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={pdfZoom >= PDF_ZOOM_MAX}
                  className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Zoom in"
                  data-testid="drawer-pdf-zoom-in"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
                PDF
              </a>
            </div>
            <div
              ref={pdfPreviewRef}
              className="flex-1 bg-[#525659] p-2 min-h-0 overflow-auto"
              data-testid="drawer-pdf-preview"
            >
              <div
                className="bg-white rounded-sm"
                style={{
                  width: `${pdfZoom}%`,
                  height: `${pdfZoom}%`,
                  minWidth: "100%",
                  minHeight: "100%",
                }}
              >
                <iframe
                  title={`Prescription — ${consultation.patientName}`}
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  data-testid="drawer-prescription-pdf"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images tab */}
        <button
          type="button"
          onClick={() => setImagesOpen((v) => !v)}
          className={cn(
            "shrink-0 w-7 flex items-center justify-center border-y border-l border-border/60",
            "text-[9px] font-semibold text-primary/80 tracking-wide",
            "bg-[var(--edm-mint)]/30 hover:bg-[var(--edm-mint)]/55 transition-colors",
            "dark:bg-primary/15 dark:text-[var(--edm-mint)]/90",
            imagesOpen && "bg-[var(--edm-mint)]/60 dark:bg-primary/25",
          )}
          aria-expanded={imagesOpen}
          aria-label="Toggle prescription images"
          data-testid="drawer-prescription-images-tab"
        >
          <span
            className="select-none opacity-80"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Prescription images
          </span>
        </button>

        {/* Main panel */}
        <div
          className="h-full bg-card flex flex-col border-l border-border/60"
          style={{ width: DRAWER_W }}
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Patient header */}
            <div className="border-b border-border/50">
              <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
                <div className="h-10 w-10 rounded-full bg-muted text-foreground flex items-center justify-center text-[12px] font-bold shrink-0">
                  {patientInitials(consultation.patientName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[13px] font-semibold text-primary leading-tight">
                    {consultation.patientName}
                    <span className="text-foreground font-normal">
                      {", "}
                      Age {consultation.patientAge}
                    </span>
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Last known exemption: Not known
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="px-3 pb-2 text-[10px] text-muted-foreground leading-relaxed">
                {patientAddress ?? `Age ${consultation.patientAge}`}
              </p>

              <div className="px-3 pb-2.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded border border-dashed border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  disabled
                  title="Coming soon"
                >
                  + Add tag
                </button>
              </div>
            </div>

            <CompactStepper status={status} onResumeParked={resumeFromParked} />

            {/* Prescription details */}
            <div className="border-b border-border/40">
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left bg-primary/[0.06] hover:bg-primary/[0.09] transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="flex-1 text-[12px] font-semibold text-primary">
                  Prescription details
                </span>
                {detailsOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </button>

              {detailsOpen && (
                <div className="px-3 pb-3">
                  <dl className="grid grid-cols-2 gap-x-4">
                    <DetailField label="Prescription ID">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-mono text-[11px] break-all">{ref}</span>
                        <button
                          type="button"
                          onClick={copyPrescriptionId}
                          className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10"
                          aria-label="Copy prescription ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    </DetailField>
                    <DetailField label="Received">{receivedOn}</DetailField>
                    <DetailField label="Source">{source}</DetailField>
                    {hasDisplayValue(dispensingPeriod) && (
                      <DetailField label="Dispensing period" hideWhenEmpty>
                        {dispensingPeriod}
                      </DetailField>
                    )}
                    <DetailField label="Prescription type">
                      {prescriptionTypeLabel(consultation)}
                    </DetailField>
                    <DetailField label="Treatment type">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          treatmentType === "Acute"
                            ? "bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/50"
                            : "bg-[var(--edm-mint)]/50 text-primary border border-primary/20 dark:bg-primary/15 dark:text-[var(--edm-mint)]",
                        )}
                      >
                        {treatmentType}
                      </span>
                    </DetailField>
                    {hasDisplayValue(gpSurgery) && (
                      <DetailField label="GP surgery">{gpSurgery}</DetailField>
                    )}
                  </dl>

                  {rxTags.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rxTags.map((tag) => (
                          <span
                            key={tag.label}
                            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-foreground"
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                TAG_DOT_STYLES[tag.variant],
                              )}
                            />
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Medication list */}
            {items.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-muted-foreground border-b border-border/40">
                No prescribed items.
              </div>
            ) : (
              <div className="border-b border-border/40 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-3 py-1.5">
                  <span>Medicine</span>
                  <span>Qty</span>
                </div>
                {items.map((item, i) => (
                  <MedicationRow key={`${item.name}-${i}`} item={item} index={i} />
                ))}
              </div>
            )}

            {/* Comments */}
            <CollapseRow
              icon={List}
              label="Comments"
              count={commentCount}
              open={commentsOpen}
              onToggle={() => setCommentsOpen((v) => !v)}
              accent
            >
              {consultation.pharmacistNote?.trim() ? (
                <div className="rounded-md bg-muted/40 px-2.5 py-2 mb-2">
                  <p className="text-[10px] text-foreground leading-relaxed flex gap-1.5">
                    <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                    {consultation.pharmacistNote}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground mb-2">No comments yet.</p>
              )}
              <div className="rounded-md border border-border/50 bg-background px-2 py-1.5">
                <input
                  type="text"
                  readOnly
                  placeholder="Write your comment here…"
                  className="w-full text-[11px] bg-transparent outline-none text-muted-foreground placeholder:text-muted-foreground/60"
                  aria-label="Comment input (read-only)"
                />
              </div>
            </CollapseRow>
          </div>

          {/* Footer action bar */}
          <div className="shrink-0 border-t border-border/60 bg-card">
            {footerStatus && (
              <div
                className={cn(
                  "px-3 py-1.5 text-center text-[11px] font-semibold text-white",
                  status === "pick"
                    ? "bg-emerald-600"
                    : status === "parked"
                      ? "bg-amber-600"
                      : "bg-primary",
                )}
                data-testid="drawer-status-strip"
              >
                {footerStatus}
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={printPrescription}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                aria-label="Print prescription"
                data-testid="drawer-print-btn"
              >
                <Printer className="h-4 w-4" />
              </button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-[11px] font-semibold"
                onClick={onClose}
                data-testid="drawer-return-btn"
              >
                Return
              </Button>

              <div className="flex-1" />

              {primaryAction && (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-4 text-[11px] font-semibold"
                  onClick={() => void primaryAction.onClick()}
                  disabled={primaryLoading}
                  data-testid={primaryAction.testId}
                >
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

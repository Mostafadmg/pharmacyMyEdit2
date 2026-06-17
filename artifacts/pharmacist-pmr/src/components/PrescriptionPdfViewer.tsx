import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  MoreVertical,
  Printer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PDF_ZOOM_MIN = 50;
const PDF_ZOOM_MAX = 200;
const PDF_ZOOM_STEP = 10;
const PDF_ZOOM_DEFAULT = 100;

type PrescriptionPdfViewerProps = {
  pdfUrl: string;
  embedUrl: string;
  title?: string;
  headerLabel?: string;
  headerSubtitle?: string;
  statusLabel?: string;
  className?: string;
  testId?: string;
};

type LoadState = "loading" | "ready" | "error";

export function PrescriptionPdfViewer({
  pdfUrl,
  embedUrl,
  title = "Prescription PDF",
  headerLabel = "Prescription",
  headerSubtitle,
  statusLabel = "Awaiting check",
  className,
  testId = "prescription-pdf-viewer",
}: PrescriptionPdfViewerProps) {
  const [pdfZoom, setPdfZoom] = useState(PDF_ZOOM_DEFAULT);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfFetchUrl = embedUrl.split("#")[0] ?? pdfUrl;

  const clampPdfZoom = useCallback(
    (value: number) => Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, value)),
    [],
  );

  const zoomIn = useCallback(() => {
    setPdfZoom((z) => clampPdfZoom(z + PDF_ZOOM_STEP));
  }, [clampPdfZoom]);

  const zoomOut = useCallback(() => {
    setPdfZoom((z) => clampPdfZoom(z - PDF_ZOOM_STEP));
  }, [clampPdfZoom]);

  const handlePdfZoomWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? PDF_ZOOM_STEP : -PDF_ZOOM_STEP;
      setPdfZoom((z) => clampPdfZoom(z + delta));
    },
    [clampPdfZoom],
  );

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    el.addEventListener("wheel", handlePdfZoomWheel, { passive: false });
    return () => el.removeEventListener("wheel", handlePdfZoomWheel);
  }, [handlePdfZoomWheel, loadState]);

  useEffect(() => {
    let cancelled = false;

    async function verifyPdf() {
      setLoadState("loading");
      try {
        const res = await fetch(pdfFetchUrl);
        const contentType = res.headers.get("content-type") ?? "";
        if (
          !res.ok ||
          contentType.includes("application/json") ||
          contentType.includes("text/html")
        ) {
          if (!cancelled) setLoadState("error");
          return;
        }
        if (!cancelled) setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }

    void verifyPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfFetchUrl]);

  function printPdf() {
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  function openPdf() {
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  function downloadPdf() {
    const anchor = document.createElement("a");
    anchor.href = pdfUrl;
    anchor.download = "";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  }

  return (
    <div
      className={cn(
        "relative flex flex-col min-h-0 min-w-0 h-full rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden",
        className,
      )}
      data-testid={testId}
    >
      <div className="shrink-0 flex items-center gap-3 border-b border-border/50 bg-card px-3 py-2.5 sm:px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {headerLabel}
          </p>
          {headerSubtitle ? (
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              {headerSubtitle}
            </p>
          ) : null}
        </div>
        {statusLabel ? (
          <span className="hidden sm:inline-flex shrink-0 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/35 dark:text-amber-200">
            {statusLabel}
          </span>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Prescription PDF options"
              data-testid={`${testId}-menu-trigger`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem
              onSelect={zoomIn}
              disabled={pdfZoom >= PDF_ZOOM_MAX || loadState !== "ready"}
              data-testid={`${testId}-zoom-in`}
            >
              <ZoomIn className="mr-2 h-4 w-4" />
              Zoom in
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {pdfZoom}%
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={zoomOut}
              disabled={pdfZoom <= PDF_ZOOM_MIN || loadState !== "ready"}
              data-testid={`${testId}-zoom-out`}
            >
              <ZoomOut className="mr-2 h-4 w-4" />
              Zoom out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={printPdf} data-testid={`${testId}-print`}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={openPdf} data-testid={`${testId}-open`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={downloadPdf} data-testid={`${testId}-download`}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={previewRef}
        className="flex-1 min-h-0 overflow-auto bg-muted/20 p-3 sm:p-4"
        data-testid={`${testId}-preview`}
      >
        {loadState === "loading" ? (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/80">
            <p className="text-sm text-muted-foreground">Loading prescription…</p>
          </div>
        ) : loadState === "error" ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-background px-6 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Prescription preview unavailable
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
              No PDF is attached for this consultation yet. Use the clinical
              details on the right, or try opening the PDF directly.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={openPdf}
            >
              Try opening PDF
            </Button>
          </div>
        ) : (
          <div
            className="mx-auto rounded-lg border border-border/50 bg-white shadow-sm"
            style={{
              width: `${pdfZoom}%`,
              minWidth: "100%",
            }}
          >
            <iframe
              title={title}
              src={embedUrl}
              className="block w-full min-h-[280px] lg:min-h-[calc(100vh-12rem)] border-0 bg-white"
              data-testid={`${testId}-frame`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

type PatientDocUpload = {
  id: string;
  dataUrl: string;
  uploadedAt: string;
};

function formatUploadTime(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientDocumentViewer({
  consultationId,
  docId,
  docTitle,
  open,
  onOpenChange,
}: {
  consultationId: string;
  docId: string;
  docTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<PatientDocUpload[]>([]);
  const [reviewStatus, setReviewStatus] = useState<string | undefined>();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) {
      setUploads([]);
      setError(null);
      setIndex(0);
      setZoom(1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void apiFetch<{
      uploads?: PatientDocUpload[];
      dataUrl: string;
      uploadedAt?: string;
      reviewStatus?: string;
    }>(
      `/api/patient/consultations/${consultationId}/documents/${encodeURIComponent(docId)}`,
      { auth: "patient" },
    )
      .then((data) => {
        if (cancelled) return;
        const list =
          data.uploads?.length ?
            data.uploads
          : data.dataUrl ?
            [
              {
                id: "legacy",
                dataUrl: data.dataUrl,
                uploadedAt: data.uploadedAt ?? new Date().toISOString(),
              },
            ]
          : [];
        setUploads(list);
        setReviewStatus(data.reviewStatus);
        setIndex(Math.max(0, list.length - 1));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load document.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, consultationId, docId]);

  const current = uploads[index];
  const isVideo =
    current?.dataUrl.startsWith("data:video") ||
    /\.(mp4|webm|mov)/i.test(current?.dataUrl ?? "");
  const isPdf =
    current?.dataUrl.startsWith("data:application/pdf") ||
    current?.dataUrl.includes("application/pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,48rem)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="pr-8">{docTitle}</DialogTitle>
          {uploads.length > 1 ? (
            <p className="text-xs text-muted-foreground">
              Document {index + 1} of {uploads.length}
            </p>
          ) : null}
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Loading your upload…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive px-5 py-4">{error}</p>
        ) : current ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {uploads.length > 1 ? (
              <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={index <= 0}
                  aria-label="Previous document"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={index >= uploads.length - 1}
                  aria-label="Next document"
                  onClick={() =>
                    setIndex((i) => Math.min(uploads.length - 1, i + 1))
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <span className="text-xs font-medium text-muted-foreground">
                  {index + 1} / {uploads.length}
                </span>
              </div>
            ) : null}
            <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border px-4 py-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-label="Zoom out"
                disabled={zoom <= 0.5}
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-label="Zoom in"
                disabled={zoom >= 3}
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4 touch-pan-x touch-pan-y">
              <div
                className="mx-auto flex min-h-[min(50vh,24rem)] min-w-full items-center justify-center"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                }}
              >
                <div className="w-full space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Uploaded {formatUploadTime(current.uploadedAt)}
                    {reviewStatus === "verified"
                      ? " · Verified by pharmacist"
                      : reviewStatus === "rejected"
                        ? " · Rejected — please upload again"
                        : " · Awaiting pharmacist review"}
                  </p>
                  {isPdf ? (
                    <a
                      href={current.dataUrl}
                      download={`${docId}-${index + 1}.pdf`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  ) : isVideo ? (
                    <video
                      src={current.dataUrl}
                      controls
                      className="w-full max-h-[min(72vh,40rem)] rounded-xl border border-border bg-black"
                    />
                  ) : (
                    <img
                      src={current.dataUrl}
                      alt={docTitle}
                      className="w-full max-h-[min(72vh,40rem)] object-contain rounded-xl border border-border bg-muted/30"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

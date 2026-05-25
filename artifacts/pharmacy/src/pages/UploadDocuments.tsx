import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Upload, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { EvidenceCriteriaList } from "@/components/EvidenceCriteriaList";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  EVIDENCE_SLOT_META,
  patientUploadSlots,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";

export default function UploadDocuments() {
  const { id: consultationId } = useParams<{ id: string }>();
  const [location] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null);

  const slotFromQuery = useMemo(() => {
    const q = location.includes("?") ? location.split("?")[1] : "";
    const params = new URLSearchParams(q);
    const slot = params.get("slot") ?? "";
    const ids = patientUploadSlots(answers ?? {});
    return ids.includes(slot as EvidenceSlotId)
      ? (slot as EvidenceSlotId)
      : (ids[0] ?? "weight-scale-video");
  }, [location, answers]);

  const slotMeta = EVIDENCE_SLOT_META[slotFromQuery];
  const portalSlots = useMemo(
    () => patientUploadSlots(answers ?? {}),
    [answers],
  );

  const [, navigate] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      toast.error("Please sign in to upload documents.");
      navigate("/my-account/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!consultationId) return;
    void apiFetch<{ answers?: Record<string, unknown> }>(
      `/api/consultations/${consultationId}`,
      { auth: "patient" },
    )
      .then((c) => setAnswers((c.answers ?? {}) as Record<string, unknown>))
      .catch(() => setAnswers({}));
  }, [consultationId]);

  const onFile = async (file: File | undefined) => {
    if (!file || !consultationId) return;
    const maxMb = slotMeta.maxMb;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File must be under ${maxMb} MB.`);
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") throw new Error("Could not read file");
        await apiFetch(`/api/consultations/${consultationId}/patient-documents`, {
          method: "POST",
          auth: "patient",
          body: JSON.stringify({
            docId: slotFromQuery,
            dataUrl,
            messageBody: `Uploaded a new ${slotMeta.title}.`,
          }),
        });
        setDone(true);
        toast.success("Document uploaded — your pharmacist will review it.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Upload failed. Try again.",
        );
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-10">
        <Link
          href="/my-consultations"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My consultations
        </Link>

        <h1 className="mt-6 font-serif text-3xl text-secondary">
          Upload document
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Your pharmacist asked for a new{" "}
          <strong>{slotMeta.title}</strong>. Please follow the criteria below
          so we can review your order without delay.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <p className="mt-3 font-semibold text-emerald-900">Upload received</p>
            <p className="mt-1 text-sm text-emerald-800">
              We will review your file and message you if we need anything else.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/my-consultations">Return to consultations</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-secondary">
              {slotMeta.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{slotMeta.summary}</p>
            <EvidenceCriteriaList slotId={slotFromQuery} />

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm text-foreground">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>
                {slotMeta.isVideo
                  ? "Please upload a live video (not a screenshot). "
                  : null}
                Max file size {slotMeta.maxMb} MB. Accepted:{" "}
                {slotMeta.isVideo ? "video or clear photo" : "images, video, or PDF"}.
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept={slotMeta.acceptMime}
              capture={slotMeta.isVideo ? "environment" : undefined}
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />

            <Button
              type="button"
              className="mt-6 w-full h-12 text-base font-semibold"
              disabled={uploading || !consultationId}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-5 w-5" />
              {uploading
                ? "Uploading…"
                : slotMeta.isVideo
                  ? `Choose ${slotMeta.title} video`
                  : `Choose ${slotMeta.title}`}
            </Button>

            {portalSlots.length > 1 ? (
              <p className="mt-4 text-xs text-center text-muted-foreground">
                Upload a different document:{" "}
                {portalSlots.map((id) => (
                  <Link
                    key={id}
                    href={`/upload-documents/${consultationId}?slot=${id}`}
                    className={cn(
                      "font-medium hover:underline mr-2",
                      id === slotFromQuery
                        ? "text-stone-500 pointer-events-none"
                        : "text-emerald-700",
                    )}
                  >
                    {EVIDENCE_SLOT_META[id].title}
                  </Link>
                ))}
              </p>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  EVIDENCE_SLOT_META,
  isEvidenceSlotId,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";

export function InlineDocumentUploadButton({
  consultationId,
  docId,
  label,
  onSuccess,
}: {
  consultationId: string;
  docId: string;
  label: string;
  onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!isEvidenceSlotId(docId)) return null;

  const slotMeta = EVIDENCE_SLOT_META[docId as EvidenceSlotId];

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > slotMeta.maxMb * 1024 * 1024) {
      toast.error(`File must be under ${slotMeta.maxMb} MB.`);
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
            docId,
            dataUrl,
            messageBody: `Uploaded a new ${slotMeta.title}.`,
          }),
        });
        toast.success(`${slotMeta.title} uploaded — your pharmacist will review it.`);
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Upload failed. Try again.",
        );
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Could not read file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
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
        size="sm"
        className="rounded-lg bg-primary font-bold text-primary-foreground hover:bg-primary/90"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        {uploading ? "Uploading…" : label}
      </Button>
    </>
  );
}

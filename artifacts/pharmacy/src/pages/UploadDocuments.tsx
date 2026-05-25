import { useEffect, useMemo } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { isEvidenceSlotId } from "@workspace/evidence-slots";
import { buildConsultationDocumentFocusPath } from "@/lib/consultationDocumentFocus";

/** Legacy route — redirects to My Consultations with document slot focus. */
export default function UploadDocuments() {
  const { id: consultationId } = useParams<{ id: string }>();
  const search = useSearch();
  const [, navigate] = useLocation();

  const focusSlot = useMemo(() => {
    const slot = new URLSearchParams(search).get("slot") ?? "";
    return isEvidenceSlotId(slot) ? slot : undefined;
  }, [search]);

  useEffect(() => {
    if (!consultationId) {
      navigate("/my-consultations", { replace: true });
      return;
    }
    navigate(
      buildConsultationDocumentFocusPath(consultationId, focusSlot),
      { replace: true },
    );
  }, [consultationId, focusSlot, navigate]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
      Opening your consultation…
    </div>
  );
}

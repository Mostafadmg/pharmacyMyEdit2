import { isEvidenceSlotId } from "@workspace/evidence-slots";

/** Patient portal deep link: My Consultations order + optional document slot focus. */
export function buildConsultationDocumentFocusPath(
  consultationId: string,
  focusSlot?: string,
): string {
  const params = new URLSearchParams();
  params.set("consultationId", consultationId);
  if (focusSlot && isEvidenceSlotId(focusSlot)) {
    params.set("focusSlot", focusSlot);
  }
  return `/my-consultations?${params.toString()}`;
}

export function patientDocSlotElementId(slotId: string): string {
  return `patient-doc-slot-${slotId}`;
}

export type ConsultationDocumentFocus = {
  consultationId?: string;
  focusSlot?: string;
};

export function parseConsultationDocumentFocus(
  search: string,
): ConsultationDocumentFocus {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const consultationId = params.get("consultationId") ?? undefined;
  const focusSlot =
    params.get("focusSlot") ?? params.get("slot") ?? undefined;
  return {
    consultationId: consultationId ?? undefined,
    focusSlot:
      focusSlot && isEvidenceSlotId(focusSlot) ? focusSlot : undefined,
  };
}

/** Map legacy `/upload-documents/:id?slot=` links to My Consultations focus URLs. */
export function normalizePatientDocumentLink(
  link: string | null | undefined,
): string | null {
  if (!link?.trim()) return null;
  const trimmed = link.trim();

  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "http://local");
    const uploadMatch = url.pathname.match(
      /^\/upload-documents\/([^/]+)\/?$/,
    );
    if (uploadMatch) {
      const slot = url.searchParams.get("slot") ?? undefined;
      return buildConsultationDocumentFocusPath(uploadMatch[1], slot ?? undefined);
    }
    if (url.pathname === "/my-consultations") {
      const consultationId = url.searchParams.get("consultationId");
      if (consultationId) {
        const slot =
          url.searchParams.get("focusSlot") ??
          url.searchParams.get("slot") ??
          undefined;
        return buildConsultationDocumentFocusPath(
          consultationId,
          slot ?? undefined,
        );
      }
    }
  } catch {
    /* fall through */
  }

  const relMatch = trimmed.match(
    /^\/upload-documents\/([^/?]+)(?:\?(.*))?$/,
  );
  if (relMatch) {
    const qs = relMatch[2] ? new URLSearchParams(relMatch[2]) : new URLSearchParams();
    const slot = qs.get("slot") ?? undefined;
    return buildConsultationDocumentFocusPath(relMatch[1], slot ?? undefined);
  }

  return trimmed;
}

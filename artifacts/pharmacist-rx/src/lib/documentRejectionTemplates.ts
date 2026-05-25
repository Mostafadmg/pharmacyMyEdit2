import { apiFetch } from "@/lib/api";
import type { EvidenceSlotId } from "@/lib/prescriptionEvidenceSlots";

export type DocumentRejectionTemplate = {
  id: string;
  title: string;
  docSlotIds: string[];
  emailSubject: string;
  emailBody: string;
};

export const TEMPLATES_CHANGED_EVENT = "pharmacare:document-rejection-templates-changed";

let cachedTemplates: DocumentRejectionTemplate[] | null = null;

export async function fetchDocumentRejectionTemplates(): Promise<
  DocumentRejectionTemplate[]
> {
  const data = await apiFetch<{ templates: DocumentRejectionTemplate[] }>(
    "/api/pharmacist-settings/document-rejection-templates",
  );
  cachedTemplates = data.templates;
  return data.templates;
}

export async function saveDocumentRejectionTemplates(
  templates: DocumentRejectionTemplate[],
): Promise<DocumentRejectionTemplate[]> {
  const data = await apiFetch<{ templates: DocumentRejectionTemplate[] }>(
    "/api/pharmacist-settings/document-rejection-templates",
    {
      method: "PUT",
      body: JSON.stringify({ templates }),
    },
  );
  cachedTemplates = data.templates;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TEMPLATES_CHANGED_EVENT));
  }
  return data.templates;
}

export function getCachedDocumentRejectionTemplates(): DocumentRejectionTemplate[] {
  return cachedTemplates ?? [];
}

export function templatesForSlot(
  templates: DocumentRejectionTemplate[],
  slotId: EvidenceSlotId,
): DocumentRejectionTemplate[] {
  return templates.filter(
    (t) =>
      t.docSlotIds.length === 0 || t.docSlotIds.includes(slotId),
  );
}

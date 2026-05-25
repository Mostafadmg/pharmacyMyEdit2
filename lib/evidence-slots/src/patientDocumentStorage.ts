function newUploadId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type PatientDocumentUpload = {
  id: string;
  dataUrl: string;
  uploadedAt: string;
};

/** Stored per slot: legacy single data URL or upload array. */
export type PatientDocumentSlotValue =
  | string
  | PatientDocumentUpload[];

export type PatientDocumentsMap = Partial<
  Record<string, PatientDocumentSlotValue>
>;

export function slotHasUploads(
  value: PatientDocumentSlotValue | undefined | null,
): boolean {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return value.some((u) => u.dataUrl.trim().length > 0);
}

export function normalizeSlotUploads(
  value: PatientDocumentSlotValue | undefined | null,
  fallbackUploadedAt?: string,
): PatientDocumentUpload[] {
  if (!value) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return [
      {
        id: "legacy",
        dataUrl: trimmed,
        uploadedAt: fallbackUploadedAt ?? new Date(0).toISOString(),
      },
    ];
  }
  return value.filter((u) => u.dataUrl.trim().length > 0);
}

export function latestSlotUpload(
  value: PatientDocumentSlotValue | undefined | null,
  fallbackUploadedAt?: string,
): PatientDocumentUpload | null {
  const uploads = normalizeSlotUploads(value, fallbackUploadedAt);
  return uploads.length > 0 ? uploads[uploads.length - 1]! : null;
}

export function appendSlotUpload(
  docs: PatientDocumentsMap,
  docId: string,
  dataUrl: string,
  uploadedAt?: string,
  uploadedAtMap?: Record<string, string>,
): { docs: PatientDocumentsMap; uploadedAt: string } {
  const now = uploadedAt ?? new Date().toISOString();
  const existing = normalizeSlotUploads(
    docs[docId],
    uploadedAtMap?.[docId],
  );
  const entry: PatientDocumentUpload = {
    id: newUploadId(),
    dataUrl,
    uploadedAt: now,
  };
  return {
    docs: {
      ...docs,
      [docId]: [...existing, entry],
    },
    uploadedAt: now,
  };
}

export function getSlotUploadsFromAnswers(
  answers: Record<string, unknown>,
  docId: string,
): PatientDocumentUpload[] {
  const docs = (answers.patient_documents ?? {}) as PatientDocumentsMap;
  const uploadedAtMap = (answers.patient_documents_uploaded_at ?? {}) as Record<
    string,
    string
  >;
  return normalizeSlotUploads(docs[docId], uploadedAtMap[docId]);
}

export function patientDocumentsHasAnyUpload(
  docs: PatientDocumentsMap | undefined | null,
): boolean {
  if (!docs || typeof docs !== "object" || Array.isArray(docs)) return false;
  return Object.values(docs).some((v) => slotHasUploads(v));
}

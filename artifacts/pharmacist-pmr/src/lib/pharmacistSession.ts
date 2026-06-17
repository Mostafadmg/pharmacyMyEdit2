export function getPharmacistName(): string {
  try {
    return localStorage.getItem("pharmacist_name")?.trim() || "Pharmacist";
  } catch {
    return "Pharmacist";
  }
}

export function getPharmacistToken(): string | null {
  try {
    return localStorage.getItem("pharmacist_token");
  } catch {
    return null;
  }
}

export function clearPharmacistSession(): void {
  try {
    localStorage.removeItem("pharmacist_token");
    localStorage.removeItem("pharmacist_name");
    localStorage.removeItem("pharmacist_role");
  } catch {
    /* ignore */
  }
}

export function prescriptionPdfUrl(consultationId: string): string {
  const token = getPharmacistToken();
  const path = `/api/consultations/${encodeURIComponent(consultationId)}/prescription.pdf`;
  if (!token) return path;
  return `${path}?token=${encodeURIComponent(token)}`;
}

/** PDF URL for iframe embed — hides Chrome's built-in viewer toolbar. */
export function prescriptionPdfEmbedUrl(consultationId: string): string {
  return `${prescriptionPdfUrl(consultationId)}#toolbar=0&navpanes=0`;
}

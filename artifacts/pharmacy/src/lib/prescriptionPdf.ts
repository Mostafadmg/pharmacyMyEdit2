import { apiUrl } from "@/lib/api";

export function prescriptionPdfUrl(consultationId: string): string {
  const token = localStorage.getItem("patient_token") ?? "";
  return apiUrl(
    `/api/consultations/${encodeURIComponent(consultationId)}/prescription.pdf?token=${encodeURIComponent(token)}`,
  );
}

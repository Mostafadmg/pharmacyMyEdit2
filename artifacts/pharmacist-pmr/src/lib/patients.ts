export type PatientRow = {
  email: string;
  name: string;
  patientId: string | null;
  pmrNumber: string | null;
  dateOfBirth: string | null;
  consultationCount: number;
  lastConsultationAt: string | null;
};

export function filterPatients(
  patients: PatientRow[],
  query: string,
  limit = 8,
): PatientRow[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  return patients
    .filter((p) => {
      const hay = [p.name, p.email, p.pmrNumber ?? "", p.dateOfBirth ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    })
    .slice(0, limit);
}

export function patientHref(email: string): string {
  return `/patients/${encodeURIComponent(email)}`;
}

export function formatDob(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB");
}

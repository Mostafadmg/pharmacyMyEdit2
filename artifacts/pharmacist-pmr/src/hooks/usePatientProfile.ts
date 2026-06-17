import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Consultation } from "@workspace/api-client-react";

export type PatientProfileData = {
  profile: {
    email: string;
    name: string | null;
    pmrNumber?: string | null;
    dateOfBirth?: string | null;
    totalConsultations: number;
    approvedCount: number;
    totalSpendPence?: number;
    topConditions?: Array<{ name: string; count: number }>;
  };
  consultations: Consultation[];
  recentMessages?: Array<{
    id: string;
    body: string;
    createdAt: string;
    senderRole?: string | null;
  }>;
};

export function usePatientProfile(email: string | null | undefined) {
  const [data, setData] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email?.trim()) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void apiFetch<PatientProfileData>(
      `/api/pharmacist/patients/${encodeURIComponent(email)}/profile`,
    )
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load patient");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  return { data, loading, error };
}

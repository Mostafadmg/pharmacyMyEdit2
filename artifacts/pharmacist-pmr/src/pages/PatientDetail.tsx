import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Mail, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PmrShell } from "@/components/pmr";
import { PmrStatusBadge } from "@/components/PmrStatusBadge";
import { apiFetch } from "@/lib/api";
import { formatDob } from "@/lib/patients";
import { usePatientsContext } from "@/context/PatientsContext";
import type { Consultation } from "@workspace/api-client-react";

type ProfileResponse = {
  profile: {
    email: string;
    name: string | null;
    pmrNumber?: string | null;
    dateOfBirth?: string | null;
    totalConsultations: number;
    approvedCount: number;
  };
  consultations: Consultation[];
};

export function PatientDetail({ email }: { email: string }) {
  const { getStatus } = usePatientsContext();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    void apiFetch<ProfileResponse>(
      `/api/pharmacist/patients/${encodeURIComponent(email)}/profile`,
    )
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load patient"),
      )
      .finally(() => setLoading(false));
  }, [email]);

  const profile = data?.profile;
  const consultations = (data?.consultations ?? []).filter(
    (c) => c.status === "approved",
  );
  const displayName = profile?.name ?? email;

  return (
    <PmrShell className="max-w-[1200px]">
      <Link href="/patients" className="pmr-back mb-5 inline-flex">
        <ArrowLeft className="h-4 w-4" />
        All patients
      </Link>

      {loading ? (
        <Card className="px-6 py-14 text-center text-sm text-muted-foreground">
          Loading patient record…
        </Card>
      ) : error ? (
        <Card className="px-6 py-14 text-center text-sm text-destructive">
          {error}
        </Card>
      ) : (
        <>
          <Card className="p-6 mb-5">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="pmr-page-title">{displayName}</h1>
                <p className="pmr-meta mt-1">
                  {profile?.pmrNumber ?? "No PMR"} · DOB{" "}
                  {formatDob(profile?.dateOfBirth ?? null)}
                </p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                </p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b border-border pmr-label-caps">
              Approved prescriptions ({consultations.length})
            </div>
            {consultations.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No approved prescriptions for this patient yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {consultations.map((c) => (
                  <Link key={c.id} href={`/dispensing/${c.id}`}>
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="pmr-display-sm truncate">
                          {c.conditionName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.reviewedAt
                            ? new Date(c.reviewedAt).toLocaleDateString("en-GB")
                            : "—"}{" "}
                          · {c.prescriptionItems?.length ?? 0} items
                        </div>
                      </div>
                      <PmrStatusBadge status={getStatus(c)} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </PmrShell>
  );
}

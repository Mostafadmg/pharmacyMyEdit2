import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, Search, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RxPageTitle, RxShell } from "@/components/rx";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type PatientRow = {
  email: string;
  name: string;
  patientId: string | null;
  pmrNumber: string | null;
  dateOfBirth: string | null;
  consultationCount: number;
  lastConsultationAt: string | null;
  lastConsultationId: string | null;
  lastConsultationNumber: string | null;
  duplicateWarning: boolean;
  duplicateOf: {
    email: string;
    name: string;
    patientId: string | null;
    pmrNumber: string | null;
  } | null;
  possibleDuplicates: Array<{
    email: string;
    name: string;
    patientId: string | null;
    pmrNumber: string | null;
  }>;
};

function formatLastConsultation(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

function patientHref(email: string): string {
  return `/patients/${encodeURIComponent(email)}`;
}

export function Patients() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ patients: PatientRow[] }>("/api/pharmacist/patients")
      .then((data) => setPatients(data.patients ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load patients"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((p) => {
      const hay = [
        p.name,
        p.email,
        p.pmrNumber ?? "",
        p.duplicateOf?.email ?? "",
        p.duplicateOf?.pmrNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [patients, q]);

  const duplicateCount = patients.filter((p) => p.duplicateWarning).length;

  return (
    <RxShell className="max-w-[1200px]">
      <RxPageTitle
        title="Patients"
        subtitle="Every patient who has submitted a consultation. Open a record for full PMR history."
      />

      {duplicateCount > 0 ? (
        <Card className="mb-4 border-rx-cs-border bg-rx-cs-surface/60 px-4 py-3 text-sm text-rx-cs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>{duplicateCount}</strong> possible duplicate patient
              {duplicateCount === 1 ? "" : "s"} detected (same name and date of
              birth, different email). Review the recommended primary PMR before
              prescribing.
            </p>
          </div>
        </Card>
      ) : null}

      <Card className="mb-4 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patients…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            data-testid="input-patient-search"
          />
        </div>
      </Card>

      <Card className="overflow-hidden divide-y divide-border">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Loading patients…
          </div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-destructive">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No patients yet.
          </div>
        ) : (
          filtered.map((p) => (
            <Link
              key={p.email}
              href={patientHref(p.email)}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset",
                p.duplicateWarning && "bg-rx-cs-surface/30 hover:bg-rx-cs-surface/50",
              )}
              data-testid={`row-patient-${p.email}`}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  p.duplicateWarning
                    ? "bg-rx-cs-surface text-rx-cs"
                    : "bg-accent text-primary",
                )}
              >
                <User className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-base font-semibold text-foreground">
                    {p.name}
                  </span>
                  {p.duplicateWarning ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rx-cs-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rx-cs">
                      <AlertTriangle className="h-3 w-3" />
                      Possible duplicate
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                {p.duplicateOf ? (
                  <p className="mt-1 truncate text-xs text-rx-cs">
                    Likely duplicate of {p.duplicateOf.name}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {p.consultationCount}{" "}
                  {p.consultationCount === 1 ? "consultation" : "consultations"}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  Last: {formatLastConsultation(p.lastConsultationAt)}
                </p>
              </div>
            </Link>
          ))
        )}
      </Card>
    </RxShell>
  );
}

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PmrPageTitle, PmrShell } from "@/components/pmr";
import { usePatientsContext } from "@/context/PatientsContext";
import { formatDob, patientHref } from "@/lib/patients";

export function Patients() {
  const { patients, patientsLoading } = usePatientsContext();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((p) => {
      const hay = [p.name, p.email, p.pmrNumber ?? "", p.dateOfBirth ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [patients, q]);

  return (
    <PmrShell className="max-w-[1200px]">
      <PmrPageTitle
        title="Patients"
        subtitle="Every patient with a PMR record. Use the header search for quick access."
      />

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
        {patientsLoading ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Loading patients…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No patients found.
          </div>
        ) : (
          filtered.map((p) => (
            <Link key={p.email} href={patientHref(p.email)}>
              <div
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                data-testid={`row-patient-${p.email}`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="pmr-display-sm truncate">{p.name}</div>
                  <div className="pmr-meta truncate text-xs">
                    {p.pmrNumber ?? "No PMR"} · DOB {formatDob(p.dateOfBirth)}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.email}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {p.consultationCount} consultation
                  {p.consultationCount === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))
        )}
      </Card>
    </PmrShell>
  );
}

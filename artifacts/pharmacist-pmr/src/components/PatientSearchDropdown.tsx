import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatientsContext } from "@/context/PatientsContext";
import {
  filterPatients,
  formatDob,
  patientHref,
} from "@/lib/patients";

export function PatientSearchDropdown({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [, navigate] = useLocation();
  const { patients } = usePatientsContext();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(
    () => filterPatients(patients, query, 8),
    [patients, query],
  );

  const showDropdown = open && query.trim().length >= 2;

  function selectPatient(email: string) {
    setQuery("");
    setOpen(false);
    navigate(patientHref(email));
  }

  return (
    <div className={cn("relative w-full", compact ? "max-w-md" : "max-w-2xl", className)}>
      <div
        className={cn(
          "flex items-center w-full bg-muted/40 border border-border/70",
          compact
            ? "gap-2 rounded-lg px-2.5 py-1 h-8"
            : "gap-3 rounded-full px-5 py-2.5 shadow-sm bg-card",
        )}
      >
        <Search
          className={cn(
            "text-muted-foreground shrink-0",
            compact ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          type="search"
          placeholder={
            compact
              ? "Search patients…"
              : "Search patients by name, email, or PMR number…"
          }
          className={cn(
            "bg-transparent outline-none flex-1 placeholder:text-muted-foreground min-w-0",
            compact ? "text-[11px]" : "text-sm",
          )}
          data-testid="input-patient-global-search"
          autoComplete="off"
        />
        <kbd
          className={cn(
            "hidden lg:inline-flex items-center text-muted-foreground bg-muted/80 border border-border/70 rounded font-mono shrink-0",
            compact ? "text-[9px] px-1 py-px" : "text-[10px] px-1.5 py-0.5",
          )}
        >
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 overflow-hidden border border-border bg-card shadow-lg",
            compact
              ? "top-[calc(100%+0.35rem)] rounded-lg"
              : "top-[calc(100%+0.5rem)] rounded-2xl shadow-xl",
          )}
          data-testid="patient-search-dropdown"
        >
          {matches.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No patients match &ldquo;{query.trim()}&rdquo;
            </div>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto p-1.5">
              {matches.map((p) => (
                <li key={p.email}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--edm-mint)]/40"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectPatient(p.email)}
                    data-testid={`patient-search-result-${p.email}`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="pmr-display-sm truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.pmrNumber ?? "No PMR"}{" "}
                        · DOB {formatDob(p.dateOfBirth)}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {p.email}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";

export type InteractionWarning = {
  id: string;
  drugA: string;
  drugB: string;
  severity: "contraindicated" | "major" | "moderate" | "minor";
  mechanism: string;
  advice: string;
  source: string;
};

export type InteractionState = {
  warnings: InteractionWarning[];
  blocking: boolean;
  loading: boolean;
};

const SEVERITY_STYLE: Record<InteractionWarning["severity"], { bg: string; border: string; text: string; icon: typeof AlertTriangle; label: string }> = {
  contraindicated: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-900", icon: ShieldAlert, label: "CONTRAINDICATED" },
  major: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-900", icon: AlertTriangle, label: "MAJOR" },
  moderate: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", icon: AlertTriangle, label: "MODERATE" },
  minor: { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-900", icon: Info, label: "MINOR" },
};

interface Props {
  itemNames: string[];
  patientMedications?: string[];
  onChange?: (state: InteractionState) => void;
}

export function useDrugInteractions({ itemNames, patientMedications }: Omit<Props, "onChange">): InteractionState {
  const [state, setState] = useState<InteractionState>({ warnings: [], blocking: false, loading: false });

  useEffect(() => {
    const names = itemNames.filter((n) => n && n.trim().length > 0);
    if (names.length === 0) {
      setState({ warnings: [], blocking: false, loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    const handle = setTimeout(async () => {
      try {
        const json = await apiFetch<{ warnings: InteractionWarning[]; blocking: boolean }>(
          "/api/pharmacist/drug-interactions/check",
          {
            method: "POST",
            auth: "pharmacist",
            body: JSON.stringify({
              items: names.map((name) => ({ name })),
              patientMedications: patientMedications ?? [],
            }),
          },
        );
        if (cancelled) return;
        setState({ warnings: json.warnings, blocking: json.blocking, loading: false });
      } catch {
        if (cancelled) return;
        setState({ warnings: [], blocking: false, loading: false });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [itemNames.join("|"), (patientMedications ?? []).join("|")]);

  return state;
}

export default function DrugInteractionPanel({ itemNames, patientMedications, onChange }: Props) {
  const state = useDrugInteractions({ itemNames, patientMedications });

  useEffect(() => {
    onChange?.(state);
  }, [state.warnings.length, state.blocking, state.loading]);

  if (state.loading && state.warnings.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Checking for drug interactions…
      </div>
    );
  }

  if (state.warnings.length === 0) {
    if (itemNames.filter((n) => n.trim()).length === 0) return null;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        No known interactions in BNF dataset for the prescribed combination.
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="drug-interactions-panel">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" /> Drug interaction screening
        <span className="ml-auto text-[10px] text-muted-foreground/70">Source: BNF</span>
      </div>
      {state.warnings.map((w) => {
        const s = SEVERITY_STYLE[w.severity];
        const Icon = s.icon;
        return (
          <div
            key={w.id}
            className={`rounded-xl border ${s.border} ${s.bg} p-3`}
            data-testid={`interaction-${w.severity}`}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className={`inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${s.text}`}>
                <Icon className="w-4 h-4" />
                {s.label}
              </div>
              <div className={`text-sm font-semibold ${s.text}`}>
                {w.drugA} <span className="opacity-60">+</span> {w.drugB}
              </div>
            </div>
            <p className={`text-xs ${s.text} opacity-90`}>
              <span className="font-semibold">Mechanism:</span> {w.mechanism}
            </p>
            <p className={`text-xs ${s.text} opacity-90 mt-1`}>
              <span className="font-semibold">Advice:</span> {w.advice}
            </p>
          </div>
        );
      })}
    </div>
  );
}

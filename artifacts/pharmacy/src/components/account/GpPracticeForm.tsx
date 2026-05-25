import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, Loader2, PenLine, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type GpDetailsForm = {
  surgeryName: string;
  doctorName: string;
  phone: string;
  addressLine1: string;
  postcode: string;
  odsCode?: string;
};

type GpPracticeSummary = {
  odsCode: string;
  name: string;
  postcode: string;
  status: string;
};

type GpPracticeDetail = GpPracticeSummary & {
  phone: string | null;
  singleLine: string;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function GpPracticeForm({
  value,
  onChange,
}: {
  value: GpDetailsForm;
  onChange: (patch: Partial<GpDetailsForm>) => void;
}) {
  const [manual, setManual] = useState(Boolean(value.surgeryName && !value.odsCode));
  const [gpQuery, setGpQuery] = useState(value.surgeryName);
  const debouncedGp = useDebouncedValue(gpQuery, 320);
  const [gpResults, setGpResults] = useState<GpPracticeSummary[]>([]);
  const [gpOpen, setGpOpen] = useState(false);
  const [gpLoading, setGpLoading] = useState(false);
  const [gpError, setGpError] = useState("");
  const [gpSelected, setGpSelected] = useState<GpPracticeDetail | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGpQuery(value.surgeryName);
    setManual(Boolean(value.surgeryName && !value.odsCode));
    if (!value.odsCode) {
      setGpSelected(null);
      return;
    }
    let cancelled = false;
    void fetch(`/api/gp-practices/${encodeURIComponent(value.odsCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { practice?: GpPracticeDetail } | null) => {
        if (!cancelled && data?.practice) setGpSelected(data.practice);
      })
      .catch(() => {
        if (!cancelled) setGpSelected(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value.odsCode, value.surgeryName]);

  useEffect(() => {
    if (manual) {
      setGpResults([]);
      return;
    }
    const q = debouncedGp.trim();
    if (q.length < 2) {
      setGpResults([]);
      setGpError("");
      return;
    }
    let cancelled = false;
    setGpLoading(true);
    setGpError("");
    fetch(`/api/gp-practices/search?q=${encodeURIComponent(q)}&limit=20`)
      .then(async (res) => {
        const data = (await res.json()) as {
          results?: GpPracticeSummary[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Search failed");
        return data.results ?? [];
      })
      .then((results) => {
        if (!cancelled) {
          setGpResults(results);
          setGpOpen(results.length > 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setGpResults([]);
          setGpError(
            err instanceof Error ? err.message : "Could not search NHS register",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setGpLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedGp, manual]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setGpOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function selectPractice(summary: GpPracticeSummary) {
    setGpOpen(false);
    setGpQuery(summary.name);
    setGpLoading(true);
    setGpError("");
    try {
      const res = await fetch(
        `/api/gp-practices/${encodeURIComponent(summary.odsCode)}`,
      );
      const data = (await res.json()) as {
        practice?: GpPracticeDetail;
        error?: string;
      };
      if (!res.ok || !data.practice) {
        throw new Error(data.error ?? "Could not load practice details");
      }
      const p = data.practice;
      setGpSelected(p);
      onChange({
        surgeryName: p.name,
        addressLine1: p.singleLine || value.addressLine1,
        postcode: p.postcode || value.postcode,
        phone: p.phone || value.phone,
        odsCode: p.odsCode,
      });
      setManual(false);
    } catch (err) {
      setGpError(err instanceof Error ? err.message : "Lookup failed");
      onChange({
        surgeryName: summary.name,
        odsCode: summary.odsCode,
      });
    } finally {
      setGpLoading(false);
    }
  }

  function enableManual() {
    setManual(true);
    setGpOpen(false);
    setGpResults([]);
    setGpSelected(null);
    onChange({ odsCode: "" });
  }

  function enableSearch() {
    setManual(false);
    setGpQuery(value.surgeryName);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={enableSearch}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            !manual
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30",
          )}
        >
          <Search className="h-3.5 w-3.5" />
          Search NHS register
        </button>
        <button
          type="button"
          onClick={enableManual}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            manual
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30",
          )}
        >
          <PenLine className="h-3.5 w-3.5" />
          Enter manually
        </button>
      </div>

      {!manual ? (
        <div className="relative" ref={listRef}>
          <Label htmlFor="gp-search">Find your GP surgery</Label>
          <div className="relative mt-1.5">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="gp-search"
              value={gpQuery}
              onChange={(e) => {
                setGpQuery(e.target.value);
                setGpOpen(true);
                setGpError("");
              }}
              onFocus={() => gpResults.length > 0 && setGpOpen(true)}
              placeholder="Practice name or postcode, e.g. Riverside Medical"
              className="pl-10 pr-10"
              data-testid="input-gp-search"
            />
            {gpLoading ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Search the NHS directory. Can&apos;t find your surgery? Use{" "}
            <button
              type="button"
              className="text-primary font-medium underline-offset-2 hover:underline"
              onClick={enableManual}
            >
              enter manually
            </button>
            .
          </p>
          {gpError ? (
            <p className="text-xs text-destructive mt-2">{gpError}</p>
          ) : null}
          {gpOpen && gpResults.length > 0 ? (
            <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
              <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                NHS GP practices
              </p>
              {gpResults.map((r) => (
                <button
                  key={r.odsCode}
                  type="button"
                  className="w-full text-left px-3 py-3 hover:bg-muted/60 border-b border-border last:border-0"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void selectPractice(r)}
                >
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    ODS {r.odsCode}
                    {r.postcode ? ` · ${r.postcode}` : ""}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
          {gpSelected ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm">
              <p className="font-medium text-secondary">{gpSelected.name}</p>
              {gpSelected.singleLine ? (
                <p className="text-xs text-muted-foreground mt-1">{gpSelected.singleLine}</p>
              ) : null}
              {gpSelected.phone ? (
                <p className="text-xs text-muted-foreground mt-1">{gpSelected.phone}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "grid sm:grid-cols-2 gap-4",
          !manual && gpSelected && "pt-2 border-t border-border/60",
        )}
      >
        <div className="sm:col-span-2">
          <Label htmlFor="surgery">Surgery name</Label>
          <Input
            id="surgery"
            value={value.surgeryName}
            onChange={(e) => {
              const v = e.target.value;
              setGpQuery(v);
              onChange({
                surgeryName: v,
                ...(manual ? { odsCode: "" } : {}),
              });
            }}
            className="mt-1.5"
            data-testid="input-surgery"
          />
        </div>
        <div>
          <Label htmlFor="doctor">Doctor&apos;s name</Label>
          <Input
            id="doctor"
            value={value.doctorName}
            onChange={(e) => onChange({ doctorName: e.target.value })}
            placeholder="e.g. Dr Smith"
            className="mt-1.5"
            data-testid="input-doctor"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="mt-1.5"
            data-testid="input-phone"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="addr">Address</Label>
          <Input
            id="addr"
            value={value.addressLine1}
            onChange={(e) => onChange({ addressLine1: e.target.value })}
            className="mt-1.5"
            data-testid="input-address"
          />
        </div>
        <div>
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            value={value.postcode}
            onChange={(e) => onChange({ postcode: e.target.value })}
            className="mt-1.5 uppercase"
            data-testid="input-postcode"
          />
        </div>
      </div>
      {value.odsCode && !manual ? (
        <p className="text-[11px] text-muted-foreground">
          Linked to NHS register (ODS {value.odsCode}). Edit fields above if anything
          needs correcting.
        </p>
      ) : null}
    </div>
  );
}

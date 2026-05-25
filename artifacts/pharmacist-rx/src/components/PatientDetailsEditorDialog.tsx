import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Pencil,
  PenLine,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateField } from "@/components/DateField";
import { toIsoDate } from "@workspace/date-picker";
import { cn } from "@/lib/utils";
import {
  dobPartsToIso,
  isoToDobParts,
  type PatientProfileState,
  PROFILE_FIELD_META,
} from "@/lib/patientProfile";

type GpPracticeSummary = {
  odsCode: string;
  name: string;
  postcode: string;
  status: string;
};

type GpPracticeDetail = GpPracticeSummary & {
  addressLines: string[];
  town: string;
  county: string;
  country: string;
  phone: string | null;
  singleLine: string;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-1">
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rx-approve-surface text-primary ring-1 ring-emerald-100">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function EditorSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/90 bg-card p-4 sm:p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CollapsibleEditorSection({
  open,
  onOpenChange,
  icon: Icon,
  title,
  subtitle,
  summary,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <EditorSection className="p-0 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-3 p-4 sm:p-5 text-left hover:bg-muted/50/80 transition-colors"
          >
            {Icon && (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rx-approve-surface text-primary ring-1 ring-emerald-100">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </div>
              {subtitle && !open && (
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-1">
                  {subtitle}
                </p>
              )}
              {!open && summary && (
                <p className="mt-1.5 text-xs font-medium text-muted-foreground truncate">
                  {summary}
                </p>
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-border">
            {open && subtitle && (
              <p className="pt-4 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
            <div className={cn(open && subtitle ? "mt-4" : "pt-4")}>{children}</div>
          </div>
        </CollapsibleContent>
      </EditorSection>
    </Collapsible>
  );
}

function ChangedBadge() {
  return (
    <span className="text-[10px] font-semibold text-amber-700 bg-rx-cs-surface px-1.5 py-0.5 rounded-full border border-border">
      changed
    </span>
  );
}

function FieldLabel({
  label,
  changed,
}: {
  label: string;
  changed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mb-1.5">
      {label}
      {changed && <ChangedBadge />}
    </span>
  );
}

function inputCls(changed: boolean) {
  return cn(
    "w-full rounded-xl border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground",
    changed
      ? "border-amber-300 ring-2 ring-amber-100"
      : "border-border focus:border-emerald-400 focus:ring-2 focus:ring-primary/20",
  );
}

function selectCls(changed: boolean) {
  return cn(inputCls(changed), "appearance-none cursor-pointer");
}

export function PatientDetailsEditorDialog({
  open,
  onOpenChange,
  profile,
  draft,
  setDraft,
  saving,
  pendingChanges,
  onSave,
  patientAge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: PatientProfileState;
  draft: PatientProfileState;
  setDraft: React.Dispatch<React.SetStateAction<PatientProfileState>>;
  saving: boolean;
  pendingChanges: (typeof PROFILE_FIELD_META)[number][];
  onSave: () => void;
  patientAge?: number | null;
}) {
  const [gpManual, setGpManual] = useState(false);
  const [gpQuery, setGpQuery] = useState("");
  const [gpResults, setGpResults] = useState<GpPracticeSummary[]>([]);
  const [gpLoading, setGpLoading] = useState(false);
  const [gpError, setGpError] = useState("");
  const [gpOpen, setGpOpen] = useState(false);
  const [gpSelected, setGpSelected] = useState<GpPracticeDetail | null>(null);
  const gpListRef = useRef<HTMLDivElement>(null);

  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [postcodeSuggestions, setPostcodeSuggestions] = useState<string[]>([]);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [postcodeError, setPostcodeError] = useState("");
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [addressSectionOpen, setAddressSectionOpen] = useState(false);
  const [gpSectionOpen, setGpSectionOpen] = useState(false);

  const debouncedGp = useDebouncedValue(gpQuery, 320);
  const debouncedPostcode = useDebouncedValue(postcodeQuery, 280);

  const isChanged = useCallback(
    (key: keyof PatientProfileState) => draft[key] !== profile[key],
    [draft, profile],
  );

  useEffect(() => {
    if (!open) return;
    setAddressSectionOpen(false);
    setGpSectionOpen(false);
    setGpQuery(draft.gpSurgery || "");
    setPostcodeQuery(draft.postcode || "");
    setGpManual(Boolean(draft.gpSurgery && !draft.gpOdsCode));
    if (draft.gpOdsCode) {
      void fetch(`/api/gp-practices/${encodeURIComponent(draft.gpOdsCode)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { practice?: GpPracticeDetail } | null) => {
          if (data?.practice) setGpSelected(data.practice);
        })
        .catch(() => setGpSelected(null));
    } else {
      setGpSelected(null);
    }
  }, [open, draft.gpSurgery, draft.gpOdsCode, draft.postcode, draft.addressLine1, draft.addressLine2]);

  useEffect(() => {
    if (!open || gpManual) {
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
  }, [debouncedGp, gpManual, open]);

  useEffect(() => {
    if (!open) return;
    const q = debouncedPostcode.trim().replace(/\s+/g, "");
    if (q.length < 2) {
      setPostcodeSuggestions([]);
      return;
    }
    let cancelled = false;
    setPostcodeLoading(true);
    setPostcodeError("");
    fetch(`/api/postcodes/autocomplete?q=${encodeURIComponent(q)}&limit=8`)
      .then(async (res) => {
        const data = (await res.json()) as {
          suggestions?: string[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Autocomplete failed");
        return data.suggestions ?? [];
      })
      .then((suggestions) => {
        if (!cancelled) {
          setPostcodeSuggestions(suggestions);
          setPostcodeOpen(suggestions.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setPostcodeSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setPostcodeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedPostcode, open]);

  const selectGpPractice = async (summary: GpPracticeSummary) => {
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
      setDraft((cur) => ({
        ...cur,
        gpSurgery: p.name,
        gpAddress: p.singleLine || cur.gpAddress,
        gpOdsCode: p.odsCode,
      }));
      setGpManual(false);
    } catch (err) {
      setGpError(err instanceof Error ? err.message : "Lookup failed");
      setDraft((cur) => ({
        ...cur,
        gpSurgery: summary.name,
        gpOdsCode: summary.odsCode,
      }));
    } finally {
      setGpLoading(false);
    }
  };

  const resolvePostcode = async (raw: string) => {
    const pc = raw.trim();
    if (!pc) return;
    setPostcodeLoading(true);
    setPostcodeError("");
    setPostcodeOpen(false);
    try {
      const compact = pc.replace(/\s+/g, "");
      const res = await fetch(
        `/api/postcodes/resolve/${encodeURIComponent(compact)}`,
      );
      const data = (await res.json()) as {
        postcode?: string;
        city?: string;
        county?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Postcode not found");
      }
      setDraft((cur) => ({
        ...cur,
        postcode: data.postcode ?? pc,
        city: cur.city || data.city || "",
        county: cur.county || data.county || "",
      }));
      setPostcodeQuery(data.postcode ?? pc);
    } catch (err) {
      setPostcodeError(
        err instanceof Error
          ? err.message
          : "Postcode not found — enter address manually",
      );
    } finally {
      setPostcodeLoading(false);
    }
  };

  const addressSummary =
    [draft.addressLine1, draft.city, draft.postcode].filter(Boolean).join(", ") ||
    "No address on file";

  const gpSummary =
    [draft.gpSurgery, draft.gpDoctorName ? `Dr ${draft.gpDoctorName}` : ""]
      .filter(Boolean)
      .join(" · ") || "No GP on file";

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        elevated
        className="!flex max-h-[min(92dvh,56rem)] w-[calc(100vw-1.5rem)] max-w-3xl !flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl sm:max-w-4xl"
      >
        <div className="shrink-0 border-b border-border bg-card px-5 py-4 sm:px-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2.5 font-serif text-base font-semibold text-secondary">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Pencil className="h-4 w-4" />
              </span>
              Edit patient details
            </DialogTitle>
            <p className="text-xs text-muted-foreground pl-10">
              Expand delivery or GP sections to update those details.
            </p>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-5 py-4 sm:px-6 space-y-3">
          <EditorSection className="p-4 sm:p-4">
            <SectionHeader
              icon={UserRound}
              title="Identity"
              subtitle="Legal name as shown on the prescription and patient record."
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  ["firstName", "First name"],
                  ["middleName", "Middle name"],
                  ["surname", "Surname"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  <FieldLabel label={label} changed={isChanged(key)} />
                  <input
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((cur) => ({ ...cur, [key]: e.target.value }))
                    }
                    placeholder={label}
                    className={inputCls(isChanged(key))}
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <DateField
                compact
                label="Date of birth"
                value={dobPartsToIso(
                  draft.dobDay,
                  draft.dobMonth,
                  draft.dobYear,
                )}
                max={toIsoDate(new Date())}
                min="1920-01-01"
                onChange={(iso) => {
                  const parts = isoToDobParts(iso);
                  setDraft((cur) => ({
                    ...cur,
                    dobDay: parts.dobDay,
                    dobMonth: parts.dobMonth,
                    dobYear: parts.dobYear,
                  }));
                }}
              />
              {patientAge != null && !draft.dobYear && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Recorded age: {patientAge} years
                </p>
              )}
            </div>
          </EditorSection>

          <EditorSection className="p-4 sm:p-4">
            <SectionHeader
              title="Contact"
              subtitle="Phone and email for delivery updates and clinical correspondence."
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  ["phone", "Phone", "tel"],
                  ["email", "Email", "email"],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key}>
                  <FieldLabel label={label} changed={isChanged(key)} />
                  <input
                    type={type}
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((cur) => ({ ...cur, [key]: e.target.value }))
                    }
                    placeholder={label}
                    className={inputCls(isChanged(key))}
                  />
                </label>
              ))}
            </div>
          </EditorSection>

          <CollapsibleEditorSection
            open={addressSectionOpen}
            onOpenChange={setAddressSectionOpen}
            icon={MapPin}
            title="Delivery address"
            subtitle="UK postcode lookup, then street details — or enter manually."
            summary={addressSummary}
          >
            <div className="rounded-xl border border-border bg-rx-approve-surface/40 p-4">
              <p className="text-xs font-medium text-emerald-900 mb-3">
                Postcode lookup — suggestions appear as you type
              </p>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={postcodeQuery}
                      onChange={(e) => {
                        setPostcodeQuery(e.target.value);
                        setPostcodeError("");
                        setPostcodeOpen(true);
                      }}
                      onFocus={() =>
                        postcodeSuggestions.length > 0 && setPostcodeOpen(true)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void resolvePostcode(postcodeQuery);
                        }
                      }}
                      placeholder="Type postcode, e.g. SW1A"
                      className="w-full rounded-xl border border-border bg-card pl-3 pr-10 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-primary/20"
                      autoComplete="postal-code"
                    />
                    {postcodeLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void resolvePostcode(postcodeQuery)}
                    disabled={postcodeLoading}
                    className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-[42px] px-4"
                  >
                    <Search className="h-4 w-4 mr-1.5" />
                    Apply
                  </Button>
                </div>
                {postcodeOpen && postcodeSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {postcodeSuggestions.map((pc) => (
                      <button
                        key={pc}
                        type="button"
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-rx-approve-surface border-b border-border last:border-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => void resolvePostcode(pc)}
                      >
                        {pc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {postcodeError && (
                <p className="text-xs text-rose-600 mt-2">{postcodeError}</p>
              )}
              {draft.postcode && !postcodeError && (
                <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Postcode: {draft.postcode}
                  {draft.city ? ` · ${draft.city}` : ""}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
                <label className="block">
                  <FieldLabel
                    label="Address line 1"
                    changed={isChanged("addressLine1")}
                  />
                  <input
                    value={draft.addressLine1}
                    onChange={(e) =>
                      setDraft((cur) => ({
                        ...cur,
                        addressLine1: e.target.value,
                      }))
                    }
                    placeholder="House number and street"
                    className={inputCls(isChanged("addressLine1"))}
                  />
                </label>
                <label className="block">
                  <FieldLabel
                    label="Address line 2 (optional)"
                    changed={isChanged("addressLine2")}
                  />
                  <input
                    value={draft.addressLine2}
                    onChange={(e) =>
                      setDraft((cur) => ({
                        ...cur,
                        addressLine2: e.target.value,
                      }))
                    }
                    placeholder="Flat, building, etc."
                    className={inputCls(isChanged("addressLine2"))}
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      ["city", "City / town"],
                      ["county", "County"],
                      ["postcode", "Postcode"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key}>
                      <FieldLabel label={label} changed={isChanged(key)} />
                      <input
                        value={draft[key]}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((cur) => ({ ...cur, [key]: v }));
                          if (key === "postcode") setPostcodeQuery(v);
                        }}
                        placeholder={label}
                        className={inputCls(isChanged(key))}
                      />
                    </label>
                  ))}
                </div>
              </div>
          </CollapsibleEditorSection>

          <CollapsibleEditorSection
            open={gpSectionOpen}
            onOpenChange={setGpSectionOpen}
            icon={Stethoscope}
            title="GP practice"
            subtitle="NHS register search or manual entry."
            summary={gpSummary}
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setGpManual(false);
                  setGpOpen(true);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                  !gpManual
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-card text-muted-foreground border-border hover:border-border",
                )}
              >
                <Search className="inline h-3 w-3 mr-1" />
                Search NHS register
              </button>
              <button
                type="button"
                onClick={() => {
                  setGpManual(true);
                  setGpResults([]);
                  setGpOpen(false);
                  setDraft((cur) => ({ ...cur, gpOdsCode: "" }));
                  setGpSelected(null);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                  gpManual
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-card text-muted-foreground border-border hover:border-border",
                )}
              >
                <PenLine className="inline h-3 w-3 mr-1" />
                Enter manually
              </button>
            </div>

            {!gpManual && (
              <div className="mt-3 relative" ref={gpListRef}>
                <FieldLabel label="Find GP practice" />
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={gpQuery}
                    onChange={(e) => {
                      setGpQuery(e.target.value);
                      setGpOpen(true);
                      setGpError("");
                    }}
                    onFocus={() => gpResults.length > 0 && setGpOpen(true)}
                    placeholder="Practice name or postcode, e.g. Riverside Medical"
                    className="w-full rounded-xl border border-border bg-card pl-10 pr-10 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-primary/20"
                  />
                  {gpLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {gpError && (
                  <p className="text-xs text-rose-600 mt-2">{gpError}</p>
                )}
                {gpOpen && gpResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
                    <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                      NHS GP practices
                    </p>
                    {gpResults.map((r) => (
                      <button
                        key={r.odsCode}
                        type="button"
                        className="w-full text-left px-3 py-3 hover:bg-rx-approve-surface border-b border-border last:border-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => void selectGpPractice(r)}
                      >
                        <div className="text-sm font-medium text-foreground">
                          {r.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ODS {r.odsCode}
                          {r.postcode ? ` · ${r.postcode}` : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {gpSelected && (
                  <div className="mt-3 rounded-xl border border-border bg-rx-approve-surface/50 p-3 text-sm">
                    <p className="font-medium text-emerald-900">{gpSelected.name}</p>
                    <p className="text-xs text-emerald-800/80 mt-1">
                      {gpSelected.singleLine || "Address on file"}
                    </p>
                    {gpSelected.phone && (
                      <p className="text-xs text-muted-foreground mt-1">{gpSelected.phone}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={cn("space-y-3", !gpManual ? "mt-3 pt-3 border-t border-border" : "mt-3")}>
              <label className="block">
                <FieldLabel
                  label="Doctor's name (optional)"
                  changed={isChanged("gpDoctorName")}
                />
                <input
                  value={draft.gpDoctorName}
                  onChange={(e) =>
                    setDraft((cur) => ({ ...cur, gpDoctorName: e.target.value }))
                  }
                  placeholder="e.g. Dr Smith"
                  className={inputCls(isChanged("gpDoctorName"))}
                />
              </label>
              <label className="block">
                <FieldLabel
                  label="GP surgery / practice name"
                  changed={isChanged("gpSurgery")}
                />
                <input
                  value={draft.gpSurgery}
                  onChange={(e) => {
                    setGpQuery(e.target.value);
                    setDraft((cur) => ({
                      ...cur,
                      gpSurgery: e.target.value,
                      gpOdsCode: gpManual ? cur.gpOdsCode : "",
                    }));
                  }}
                  placeholder="Practice name"
                  className={inputCls(isChanged("gpSurgery"))}
                />
              </label>
              <label className="block">
                <FieldLabel label="GP address" changed={isChanged("gpAddress")} />
                <textarea
                  value={draft.gpAddress}
                  onChange={(e) =>
                    setDraft((cur) => ({ ...cur, gpAddress: e.target.value }))
                  }
                  placeholder="Full practice address"
                  rows={3}
                  className={cn(inputCls(isChanged("gpAddress")), "min-h-[96px] resize-y")}
                />
              </label>
              {draft.gpOdsCode && (
                <p className="text-[11px] text-muted-foreground">
                  NHS ODS code:{" "}
                  <span className="font-mono text-foreground">{draft.gpOdsCode}</span>
                </p>
              )}
            </div>
          </CollapsibleEditorSection>

          {pendingChanges.length > 0 && (
            <div className="rounded-xl border border-border bg-rx-cs-surface/90 p-3">
              <p className="text-xs font-semibold text-amber-900 mb-2">
                {pendingChanges.length} change{pendingChanges.length > 1 ? "s" : ""}{" "}
                will be audited on save
              </p>
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {pendingChanges.map((f) => (
                  <li
                    key={f.key}
                    className="text-[11px] text-amber-950 flex flex-wrap items-center gap-1"
                  >
                    <span className="font-semibold">{f.label}:</span>
                    <span className="line-through text-rose-700/90">
                      {profile[f.key] || "—"}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-emerald-800 font-medium">
                      {draft[f.key] || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-muted/40 px-5 py-3 gap-3 sm:px-6 sm:py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-full border-border bg-card text-primary hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || pendingChanges.length === 0}
            className="rounded-full min-w-[140px] px-5"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
              </>
            ) : pendingChanges.length === 0 ? (
              "No changes"
            ) : (
              `Save ${pendingChanges.length} change${pendingChanges.length > 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

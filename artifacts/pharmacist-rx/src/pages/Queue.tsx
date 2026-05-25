import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Clock, Search, Download } from "lucide-react";
import {
  useListConsultations,
  type Consultation,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { RxPageTitle, RxShell } from "@/components/rx";
import { cn } from "@/lib/utils";
import {
  getActiveWaitTags,
  hasWaitTagKind,
  WAIT_TAG_META,
} from "@/lib/orderWaitingTags";
import { getDisplayOrderTags } from "@/lib/orderTags";
import {
  buildOrderDetailHref,
  filterQueueConsultations,
  getQueueCategory,
  parseQueueContextFromSearch,
  QUEUE_CATEGORY_LABELS,
  type CsWaitSubFilter,
  type QueueCategory,
  type QueueContext,
  type TypeFilter,
} from "@/lib/queueFilters";
import { hasAutoComplexRiskFlags } from "@/lib/autoComplexPatient";

const CATEGORY_FILTERS: {
  id: QueueCategory;
  label: string;
  accent: string;
  countClass: string;
}[] = (
  [
    "all",
    "needs_approval",
    "cs_hold",
    "prescriber_hold",
    "re_review",
    "clinical_check",
    "urgent_approval",
    "urgent_dispatch",
  ] as const
).map((id) => ({
  id,
  label: QUEUE_CATEGORY_LABELS[id],
  accent:
    id === "urgent_approval"
      ? "text-rose-600"
      : id === "prescriber_hold"
        ? "text-muted-foreground"
        : id === "all"
          ? "text-foreground"
          : "text-muted-foreground",
  countClass:
    id === "urgent_approval" || id === "urgent_dispatch" || id === "prescriber_hold"
      ? "bg-rose-100 text-rose-700"
      : id === "all"
        ? "bg-muted text-foreground"
        : "bg-muted text-foreground",
}));

const TYPE_FILTERS: { id: TypeFilter; label: string; tint: string }[] = [
  { id: "all", label: "All", tint: "bg-muted text-foreground" },
  {
    id: "new_starter",
    label: "New Starter",
    tint: "bg-accent text-primary",
  },
  { id: "transfer", label: "Transfer", tint: "bg-violet-500/10 text-violet-700 dark:text-violet-200" },
  {
    id: "simple_repeat",
    label: "Simple Repeat",
    tint: "bg-sky-500/10 text-sky-700 dark:text-sky-200",
  },
  {
    id: "complex",
    label: "Complex",
    tint: "bg-rose-500/10 text-rose-800 dark:text-rose-200",
  },
];

function computeAgeBucketCounts(rows: Consultation[]): Record<string, number> {
  const counts: Record<string, number> = {
    "Awaiting Review": 0,
    "0-3 days": 0,
    "3-7 days": 0,
    "7+ days": 0,
    "Auto-flagged": 0,
    Urgent: 0,
  };
  for (const c of rows) {
    const d = daysSince(c.createdAt);
    if (c.status === "pending") counts["Awaiting Review"]++;
    if (d <= 3) counts["0-3 days"]++;
    else if (d <= 7) counts["3-7 days"]++;
    else counts["7+ days"]++;
    if (c.hasRedFlag) counts["Auto-flagged"]++;
    if (d > 10) counts["Urgent"]++;
  }
  return counts;
}

function getType(c: Consultation): {
  label: string;
  tint: string;
  rowBg: string;
} {
  if (c.previousConsultationId) {
    if (c.status === "patient_responded" || c.status === "more_info_needed") {
      return {
        label: "Transfer",
        tint: "bg-violet-100 text-violet-700",
        rowBg: "bg-[#FFFBEB]",
      };
    }
    return {
      label: "Simple Repeat",
      tint: "bg-blue-100 text-blue-700",
      rowBg: "bg-muted/40",
    };
  }
  return {
    label: "New Starter",
    tint: "bg-[#E7F4D5] text-[#0E3D2D]",
    rowBg: "bg-card",
  };
}

function computeCategoryCounts(rows: Consultation[]): Record<QueueCategory, number> {
  const counts: Record<QueueCategory, number> = {
    all: rows.length,
    needs_approval: 0,
    cs_hold: 0,
    prescriber_hold: 0,
    re_review: 0,
    clinical_check: 0,
    urgent_approval: 0,
    urgent_dispatch: 0,
  };

  for (const row of rows) {
    counts[getQueueCategory(row)] += 1;
  }

  return counts;
}

function computeCsSubFilterCounts(
  rows: Consultation[],
): Record<CsWaitSubFilter, number> {
  const csRows = rows.filter((c) => getQueueCategory(c) === "cs_hold");
  return {
    all: csRows.length,
    pending_customer_response: csRows.filter((c) =>
      hasWaitTagKind(c, "pending_customer_response"),
    ).length,
    pending_document_upload: csRows.filter((c) =>
      hasWaitTagKind(c, "pending_document_upload"),
    ).length,
  };
}

const CS_SUB_FILTERS: { id: CsWaitSubFilter; label: string }[] = [
  { id: "all", label: "All CS holds" },
  {
    id: "pending_customer_response",
    label: WAIT_TAG_META.pending_customer_response.label,
  },
  {
    id: "pending_document_upload",
    label: WAIT_TAG_META.pending_document_upload.label,
  },
];

function deriveDob(age: number): string {
  const year = new Date().getFullYear() - age;
  return `1 Jan ${year}`;
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function ageBucketPill(days: number): { label: string; cls: string } {
  if (days <= 3)
    return { label: `${days}d ago`, cls: "bg-[#E7F4D5] text-[#0E3D2D]" };
  if (days <= 7)
    return { label: `${days}d ago`, cls: "bg-amber-100 text-amber-700" };
  return { label: `${days}d ago`, cls: "bg-red-100 text-red-700" };
}

function medicationFor(c: Consultation): {
  primary: string;
  tag: string;
  tagCls: string;
} {
  if (c.conditionName.toLowerCase().includes("weight")) {
    return {
      primary: "Mounjaro Injectable Pen 2.5mg (Weeks 1-4)",
      tag: "Mounjaro",
      tagCls: "bg-violet-100 text-violet-700",
    };
  }
  return {
    primary: c.conditionName,
    tag: c.conditionName.slice(0, 8),
    tagCls: "bg-muted text-muted-foreground",
  };
}

function queueContextFromFilters(
  categoryFilter: QueueCategory,
  typeFilter: TypeFilter,
  csSubFilter: CsWaitSubFilter,
  search: string,
): QueueContext {
  return {
    category: categoryFilter,
    typeFilter,
    csSubFilter,
    search,
  };
}

export function Queue() {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("queueSearch") ?? params.get("search") ?? "";
  });
  const [categoryFilter, setCategoryFilter] = useState<QueueCategory>(() => {
    if (typeof window === "undefined") return "all";
    const ctx = parseQueueContextFromSearch(window.location.search);
    return ctx?.category ?? "all";
  });
  const [csSubFilter, setCsSubFilter] = useState<CsWaitSubFilter>(() => {
    if (typeof window === "undefined") return "all";
    const ctx = parseQueueContextFromSearch(window.location.search);
    return ctx?.csSubFilter ?? "all";
  });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() => {
    if (typeof window === "undefined") return "all";
    const ctx = parseQueueContextFromSearch(window.location.search);
    return ctx?.typeFilter ?? "all";
  });

  const { data, isLoading } = useListConsultations({ limit: 200 });

  const allRows = data?.consultations ?? [];
  const categoryCounts = useMemo(() => computeCategoryCounts(allRows), [allRows]);

  useEffect(() => {
    const [, query = ""] = location.split("?");
    const params = new URLSearchParams(query);
    setSearch(params.get("queueSearch") ?? params.get("search") ?? "");
    const ctx = parseQueueContextFromSearch(query);
    if (ctx) {
      setCategoryFilter(ctx.category);
      setTypeFilter(ctx.typeFilter);
      setCsSubFilter(ctx.csSubFilter);
    }
  }, [location]);

  const queueCtx = queueContextFromFilters(
    categoryFilter,
    typeFilter,
    csSubFilter,
    search,
  );

  const rows = filterQueueConsultations(allRows, queueCtx);

  const ageBucketCounts = computeAgeBucketCounts(rows);
  const csSubCounts = useMemo(
    () => computeCsSubFilterCounts(allRows),
    [allRows],
  );

  useEffect(() => {
    if (categoryFilter !== "cs_hold") setCsSubFilter("all");
  }, [categoryFilter]);

  return (
    <RxShell wide className="max-w-[118rem]">
      <RxPageTitle
        title="Prescription Queue"
        subtitle="Active orders awaiting clinical decisions"
        action={
          <button
            type="button"
            className="rx-btn-outline"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

        <div className="rx-surface bg-linear-to-r from-rx-cs-surface to-card border-border p-4 mb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-amber-900">
              Chargeback risk monitoring — review orders approaching the 14-day
              dispute window.
            </div>
          </div>
          <button
            type="button"
            className="bg-rx-cs-surface0 hover:bg-amber-600 text-white text-xs font-semibold rounded-full px-4 py-1.5 shrink-0 shadow-sm"
          >
            Review now
          </button>
        </div>

        <div className="rx-surface px-3 sm:px-4 pt-3 mb-4">
          <div className="flex items-end gap-6 overflow-x-auto scrollbar-none">
            {CATEGORY_FILTERS.map((cat) => {
              const active = categoryFilter === cat.id;
              const count = categoryCounts[cat.id];
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "relative pb-3 text-sm font-semibold whitespace-nowrap transition-colors",
                    active ? "text-foreground" : cat.accent,
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{cat.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-8 h-7 rounded-full px-2 text-xs font-bold",
                        active ? "bg-rose-100 text-rose-700" : cat.countClass,
                      )}
                    >
                      {count}
                    </span>
                  </span>
                  {active && (
                    <span className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {categoryFilter === "cs_hold" && (
          <div className="rx-surface mb-4 px-3 sm:px-4 py-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Waiting on patient
            </div>
            <div className="flex flex-wrap gap-2">
              {CS_SUB_FILTERS.map((filter) => {
                const active = csSubFilter === filter.id;
                const count = csSubCounts[filter.id];
                const meta =
                  filter.id === "all"
                    ? null
                    : WAIT_TAG_META[filter.id as CustomerWaitTagKind];
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setCsSubFilter(filter.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? meta
                          ? meta.queueCls + " ring-2 ring-primary/15"
                          : "border-border bg-muted text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {filter.label}
                    <span className="rounded-full bg-primary-foreground/70 px-1.5 py-0.5 text-[10px] font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mr-1">
              Type
            </span>
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                data-testid={`filter-type-${t.id}`}
                className={cn(
                  "px-3 py-1 text-xs rounded-full font-medium border border-transparent shadow-sm",
                  typeFilter === t.id
                    ? "ring-2 ring-emerald-200 opacity-100 " + t.tint
                    : t.tint + " opacity-80 hover:opacity-100",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-3">
            {(
              [
                "Awaiting Review",
                "0-3 days",
                "3-7 days",
                "7+ days",
                "Auto-flagged",
                "Urgent",
              ] as const
            ).map((label) => {
              const count = ageBucketCounts[label] ?? 0;
              return (
                <button
                  key={label}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-muted text-foreground hover:bg-muted shadow-sm"
                >
                  {label}
                  {count > 0 && (
                    <span className="inline-flex items-center justify-center text-[10px] font-semibold rounded-full bg-primary-foreground text-muted-foreground h-4 min-w-4 px-1 shadow-sm">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border flex-wrap">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Order age
            </span>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              className="px-3 py-1.5 text-xs rounded-full border border-border bg-card outline-none shadow-sm"
            />
            <span className="text-muted-foreground text-xs">→</span>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              className="px-3 py-1.5 text-xs rounded-full border border-border bg-card outline-none shadow-sm"
            />
            <div className="ml-auto flex items-center gap-2 bg-rx-approve-surface rounded-full px-3 py-1.5 min-w-65 border border-border shadow-sm">
              <Search className="h-4 w-4 text-emerald-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by orders, patients…"
                className="bg-transparent outline-none text-xs flex-1 placeholder:text-muted-foreground"
                data-testid="input-queue-search"
              />
            </div>
          </div>
        </Card>

      <div className="mt-2">
        <Card className="p-0 rounded-2xl border-border shadow-sm bg-card/95 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-295">
              <div className="grid grid-cols-[40px_110px_90px_1.4fr_110px_1.8fr_140px_120px_120px_110px] gap-3 px-4 py-3 bg-linear-to-r from-muted/50 to-muted/30 border-b border-border text-[10px] uppercase tracking-wide font-semibold text-muted-foreground sticky top-0 z-10">
                <div>
                  <input type="checkbox" className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                </div>
                <div>Type</div>
                <div>Order</div>
                <div>Patient</div>
                <div>DOB</div>
                <div>Medication</div>
                <div>Order age</div>
                <div>Waiting on</div>
                <div>Chargeback</div>
                <div>In-window</div>
              </div>
              {isLoading && (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Loading consultations…
                </div>
              )}
              {!isLoading && rows.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No orders match the current filters.
                </div>
              )}
              {rows.map((c) => (
                <QueueRow
                  key={c.id}
                  c={c}
                  onOpen={() =>
                    navigate(buildOrderDetailHref(c.id, queueCtx))
                  }
                />
              ))}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-4 mb-8 text-xs text-muted-foreground">
          <div>
            Showing {rows.length} of {data?.consultations.length ?? 0} orders
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                className={cn(
                  "h-7 w-7 rounded-md text-xs font-medium",
                  p === 1
                    ? "bg-primary text-white"
                    : "bg-card border border-border text-foreground hover:bg-muted/50",
                )}
              >
                {p}
              </button>
            ))}
            <span className="px-1 text-muted-foreground">…</span>
            <button className="h-7 w-7 rounded-md text-xs font-medium bg-card border border-border text-foreground hover:bg-muted/50">
              10
            </button>
            <button className="h-7 px-2 rounded-md text-xs font-medium bg-card border border-border text-foreground hover:bg-muted/50">
              ›
            </button>
          </div>
        </div>
      </div>
    </RxShell>
  );
}

function QueueRow({ c, onOpen }: { c: Consultation; onOpen: () => void }) {
  const type = getType(c);
  const dob = deriveDob(c.patientAge);
  const days = daysSince(c.createdAt);
  const bucket = ageBucketPill(days);
  const med = medicationFor(c);
  const initials = c.patientName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  const orderRef = "#" + c.id.slice(-5);
  const waitTags = getDisplayOrderTags(c);
  const chargeback =
    days >= 10
      ? { label: "At risk", cls: "bg-red-100 text-red-700" }
      : { label: "In-window", cls: "bg-[#E7F4D5] text-[#0E3D2D]" };

  return (
    <div
      onClick={onOpen}
      className={cn(
        "grid grid-cols-[40px_110px_90px_1.4fr_110px_1.8fr_140px_120px_120px_110px] gap-3 px-4 py-3 items-center border-b border-border cursor-pointer hover:bg-muted/50/80",
        type.rowBg,
      )}
      data-testid={`row-consultation-${c.id}`}
    >
      <div>
        <input
          type="checkbox"
          className="rounded border-border"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full",
            type.tint,
          )}
        >
          {type.label}
        </span>
        {hasAutoComplexRiskFlags(c) && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-3 w-3" />
            Complex
          </span>
        )}
      </div>
      <div className="rx-ref-sm">{orderRef}</div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-8 w-8 rounded-full bg-[#D9F0C8] text-[#0E3D2D] flex items-center justify-center text-[11px] font-semibold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="rx-display-sm truncate">{c.patientName}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {c.patientAge}y · {c.patientSex}
          </div>
        </div>
      </div>
      <div className="text-xs text-foreground">{dob}</div>
      <div className="min-w-0">
        <div className="text-xs text-foreground truncate">{med.primary}</div>
        <span
          className={cn(
            "inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            med.tagCls,
          )}
        >
          {med.tag}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
            bucket.cls,
          )}
        >
          {bucket.label}
        </span>
      </div>
      <div className="min-w-0 space-y-1">
        {waitTags.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">—</span>
        ) : (
          waitTags.slice(0, 2).map((tag) => (
            <span
              key={tag.key}
              title={tag.detail}
              className={cn(
                "inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                tag.pillCls,
              )}
            >
              {tag.label}
            </span>
          ))
        )}
      </div>
      <div>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
            chargeback.cls,
          )}
        >
          {chargeback.label}
        </span>
      </div>
      <div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
          Eligible
        </span>
      </div>
    </div>
  );
}

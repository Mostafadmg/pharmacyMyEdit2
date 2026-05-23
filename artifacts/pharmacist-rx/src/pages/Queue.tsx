import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Clock, Search, Download } from "lucide-react";
import {
  useListConsultations,
  type Consultation,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "new_starter" | "transfer" | "simple_repeat";

const TYPE_FILTERS: { id: TypeFilter; label: string; tint: string }[] = [
  { id: "all", label: "All", tint: "bg-stone-100 text-stone-700" },
  {
    id: "new_starter",
    label: "New Starter",
    tint: "bg-accent text-primary",
  },
  { id: "transfer", label: "Transfer", tint: "bg-violet-50 text-violet-700" },
  {
    id: "simple_repeat",
    label: "Simple Repeat",
    tint: "bg-blue-50 text-blue-700",
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
      rowBg: "bg-stone-50",
    };
  }
  return {
    label: "New Starter",
    tint: "bg-[#E7F4D5] text-[#0E3D2D]",
    rowBg: "bg-white",
  };
}

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
    tagCls: "bg-stone-100 text-stone-600",
  };
}

export function Queue() {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("search") ?? "";
  });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { data, isLoading } = useListConsultations({ limit: 100 });

  const allRows = data?.consultations ?? [];

  useEffect(() => {
    const [, query = ""] = location.split("?");
    setSearch(new URLSearchParams(query).get("search") ?? "");
  }, [location]);

  const rows = allRows.filter((c) => {
    if (search) {
      const hay =
        `${c.patientName} ${c.patientEmail} ${c.conditionName} ${c.id}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    if (typeFilter !== "all") {
      const t = getType(c).label.toLowerCase().replace(/\s+/g, "_");
      if (typeFilter === "new_starter" && t !== "new_starter") return false;
      if (typeFilter === "transfer" && t !== "transfer") return false;
      if (typeFilter === "simple_repeat" && t !== "simple_repeat") return false;
    }
    return true;
  });

  const ageBucketCounts = computeAgeBucketCounts(rows);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-390 mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">
              Prescription Queue
            </h1>
            <p className="text-sm text-stone-500 mt-1 max-w-2xl">
              Active orders awaiting clinical decisions
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-full border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="rounded-2xl bg-linear-to-r from-amber-50 to-white border border-amber-200 p-4 mt-4 flex items-center gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-amber-900">
              Chargeback risk monitoring — review orders approaching the 14-day
              dispute window.
            </div>
          </div>
          <button
            type="button"
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-full px-4 py-1.5 shrink-0 shadow-sm"
          >
            Review now
          </button>
        </div>

        <Card className="p-4 mt-4 rounded-2xl border-emerald-100 shadow-sm bg-white/95 backdrop-blur">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wide text-stone-500 font-semibold mr-1">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 shadow-sm"
                >
                  {label}
                  {count > 0 && (
                    <span className="inline-flex items-center justify-center text-[10px] font-semibold rounded-full bg-white text-stone-600 h-4 min-w-4 px-1 shadow-sm">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-stone-100 flex-wrap">
            <span className="text-[11px] uppercase tracking-wide text-stone-500 font-semibold">
              Order age
            </span>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              className="px-3 py-1.5 text-xs rounded-full border border-stone-200 bg-white outline-none shadow-sm"
            />
            <span className="text-stone-400 text-xs">→</span>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              className="px-3 py-1.5 text-xs rounded-full border border-stone-200 bg-white outline-none shadow-sm"
            />
            <div className="ml-auto flex items-center gap-2 bg-emerald-50 rounded-full px-3 py-1.5 min-w-65 border border-emerald-100 shadow-sm">
              <Search className="h-4 w-4 text-emerald-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by orders, patients…"
                className="bg-transparent outline-none text-xs flex-1 placeholder:text-stone-400"
                data-testid="input-queue-search"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-390 mx-auto px-4 sm:px-6 mt-2">
        <Card className="p-0 rounded-2xl border-emerald-100 shadow-sm bg-white/95 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-295">
              <div className="grid grid-cols-[40px_110px_90px_1.4fr_110px_1.8fr_140px_120px_120px_110px] gap-3 px-4 py-3 bg-linear-to-r from-emerald-50 to-stone-50 border-b border-emerald-100 text-[10px] uppercase tracking-wide font-semibold text-stone-500 sticky top-0 z-10">
                <div>
                  <input type="checkbox" className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" />
                </div>
                <div>Type</div>
                <div>Order</div>
                <div>Patient</div>
                <div>DOB</div>
                <div>Medication</div>
                <div>Order age</div>
                <div>Re-upload</div>
                <div>Chargeback</div>
                <div>In-window</div>
              </div>
              {isLoading && (
                <div className="px-5 py-10 text-center text-sm text-stone-500">
                  Loading consultations…
                </div>
              )}
              {!isLoading && rows.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-stone-500">
                  No orders match the current filters.
                </div>
              )}
              {rows.map((c) => (
                <QueueRow
                  key={c.id}
                  c={c}
                  onOpen={() => navigate(`/orders/${c.id}`)}
                />
              ))}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-4 mb-8 text-xs text-stone-600">
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
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50",
                )}
              >
                {p}
              </button>
            ))}
            <span className="px-1 text-stone-400">…</span>
            <button className="h-7 w-7 rounded-md text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50">
              10
            </button>
            <button className="h-7 px-2 rounded-md text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const reUpload = c.hasPhoto
    ? { label: "Verified", cls: "bg-[#E7F4D5] text-[#0E3D2D]" }
    : { label: "Pending", cls: "bg-amber-100 text-amber-700" };
  const chargeback =
    days >= 10
      ? { label: "At risk", cls: "bg-red-100 text-red-700" }
      : { label: "In-window", cls: "bg-[#E7F4D5] text-[#0E3D2D]" };

  return (
    <div
      onClick={onOpen}
      className={cn(
        "grid grid-cols-[40px_110px_90px_1.4fr_110px_1.8fr_140px_120px_120px_110px] gap-3 px-4 py-3 items-center border-b border-stone-100 cursor-pointer hover:bg-stone-50/80",
        type.rowBg,
      )}
      data-testid={`row-consultation-${c.id}`}
    >
      <div>
        <input
          type="checkbox"
          className="rounded border-stone-300"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full",
            type.tint,
          )}
        >
          {type.label}
        </span>
      </div>
      <div className="text-xs text-blue-600 underline">{orderRef}</div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-8 w-8 rounded-full bg-[#D9F0C8] text-[#0E3D2D] flex items-center justify-center text-[11px] font-semibold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-stone-900 truncate">
            {c.patientName}
          </div>
          <div className="text-[11px] text-stone-500 truncate">
            {c.patientAge}y · {c.patientSex}
          </div>
        </div>
      </div>
      <div className="text-xs text-stone-700">{dob}</div>
      <div className="min-w-0">
        <div className="text-xs text-stone-800 truncate">{med.primary}</div>
        <span
          className={cn(
            "inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            med.tagCls,
          )}
        >
          {med.tag}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
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
      <div>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
            reUpload.cls,
          )}
        >
          {reUpload.label}
        </span>
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

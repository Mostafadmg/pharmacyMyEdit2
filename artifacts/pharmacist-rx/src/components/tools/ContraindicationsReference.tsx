import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Search, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTRA_STATUS_META,
  MG_CONTRA_DATA,
  type ContraKbItem,
  type ContraStatus,
  type ContraSubTab,
  type ContraTopTab,
} from "@/components/tools/contraData";

/* ============================================================================
   Contraindications Reference — tabbed clinical decision support.
   Top tabs → sub-tabs (or Knowledge Base category pills) → decision cards,
   with a cross-tab global search. (React port of the MediGuard popout.)
   ============================================================================ */

const STATUS_BADGE: Record<ContraStatus, string> = {
  reject: "bg-linear-to-b from-red-500 to-red-600 text-white",
  follow_sop: "bg-linear-to-b from-violet-500 to-violet-700 text-white",
  escalate: "bg-linear-to-b from-orange-500 to-orange-600 text-white",
  prescribe: "bg-linear-to-b from-green-500 to-green-600 text-white",
};

function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      out.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }
    if (idx > i) out.push(<Fragment key={key++}>{text.slice(i, idx)}</Fragment>);
    out.push(
      <mark key={key++} className="rounded-sm bg-amber-200/80 px-0.5 text-amber-950 dark:bg-amber-400/25 dark:text-amber-100">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  return <>{out}</>;
}

function subHaystack(sub: ContraSubTab): string {
  const flat = (v?: string | string[]) =>
    Array.isArray(v) ? v.join(" • ") : v ?? "";
  const sectionsText = (sub.sections ?? [])
    .map((s) => {
      const parts = [s.title];
      if (s.items) parts.push(s.items.join(" • "));
      (s.subSections ?? []).forEach((ss) => {
        parts.push(ss.title);
        parts.push(ss.items.join(" • "));
      });
      return parts.join(" • ");
    })
    .join(" • ");
  return [
    sub.label,
    sub.title,
    sub.action,
    sub.actionNote,
    sub.safeIf,
    sub.alsoKnownAs,
    sub.rationale,
    sub.note,
    sub.exclusion,
    sub.specialConsideration ? `${sub.specialConsideration.label}: ${sub.specialConsideration.body}` : "",
    sub.ifNeeded,
    sub.questionToAsk,
    flat(sub.rejectIf),
    flat(sub.prescribeIf),
    (sub.conditions ?? []).join(" • "),
    sub.conditionsLabel,
    sectionsText,
  ]
    .filter(Boolean)
    .join(" • ");
}

function makeSnippet(text: string, q: string, radius = 60): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text.length > radius * 2 ? text.slice(0, radius * 2) + "…" : text;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius * 1.5);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

/* ───────────────────────── decision card pieces ───────────────────────── */

function DecisionList({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((v) => (
          <li key={v} className="relative pl-3.5 leading-snug before:absolute before:left-0 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-current">
            {v}
          </li>
        ))}
      </ul>
    );
  }
  return <span>{value}</span>;
}

function SubDetail({ sub }: { sub: ContraSubTab }) {
  const actionBtn =
    sub.actionStyle === "hold"
      ? "bg-linear-to-b from-amber-400 to-amber-500"
      : sub.actionStyle === "info"
        ? "bg-linear-to-b from-violet-500 to-violet-700 normal-case"
        : "bg-linear-to-b from-red-500 to-red-600";
  const noteCls =
    sub.actionNoteStyle === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
      : sub.actionNoteStyle === "neutral"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800";

  return (
    <div className="space-y-3 text-[12px] text-foreground">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 text-base">
          {sub.icon}
        </div>
        <div className="border-b-2 border-primary/40 pb-0.5 text-[14px] font-bold text-foreground">
          {sub.title ?? sub.label}
        </div>
      </div>

      {sub.action || sub.actionNote ? (
        <div className="flex flex-wrap items-center gap-2">
          {sub.action ? (
            <span
              className={cn(
                "rounded-md px-3.5 py-2 text-[12px] font-extrabold uppercase tracking-wide text-white shadow",
                actionBtn,
              )}
            >
              {sub.action}
            </span>
          ) : null}
          {sub.actionNote ? (
            <span className={cn("rounded-md border px-2.5 py-1.5 text-[11px] font-bold", noteCls)}>
              {sub.actionNote}
            </span>
          ) : null}
        </div>
      ) : null}

      {sub.exclusion ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <span className="font-extrabold text-red-600 dark:text-red-400">⚠ Exclusion:</span>
          <span>{sub.exclusion}</span>
        </div>
      ) : null}

      {sub.questionToAsk ? (
        <div className="rounded-lg border-l-[3px] border-violet-500 bg-violet-50/80 px-3 py-2.5 dark:border-violet-600 dark:bg-violet-950/40">
          <div className="font-bold text-violet-700 dark:text-violet-300">❓ Question to ask:</div>
          <div className="italic text-foreground">&ldquo;{sub.questionToAsk}&rdquo;</div>
        </div>
      ) : null}

      {sub.specialConsideration ? (
        <div className="rounded-lg border-l-[3px] border-amber-500 bg-amber-50 px-3 py-2.5 dark:border-amber-600 dark:bg-amber-950/40">
          <div className="font-bold text-amber-700 dark:text-amber-300">{sub.specialConsideration.label}</div>
          <div className="text-foreground">{sub.specialConsideration.body}</div>
        </div>
      ) : null}

      {sub.rejectIf ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-red-600 dark:text-red-400">
            REJECT if:
          </div>
          <DecisionList value={sub.rejectIf} />
        </div>
      ) : null}

      {sub.prescribeIf ? (
        <div className="rounded-lg border border-green-400 bg-emerald-50 px-3 py-2.5 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            PRESCRIBE if:
          </div>
          <DecisionList value={sub.prescribeIf} />
        </div>
      ) : null}

      {sub.alsoKnownAs ? (
        <Callout label="📘 Also known as:" tone="info">
          {sub.alsoKnownAs}
        </Callout>
      ) : null}

      {sub.safeIf ? (
        <Callout label="✓ Safe to Prescribe:" tone="safe">
          {sub.safeIf}
        </Callout>
      ) : null}

      {sub.conditions?.length ? (
        <div>
          <div
            className={cn(
              "mb-2 text-[12px] font-extrabold uppercase tracking-wide",
              sub.conditionsLabelStyle === "info"
                ? "text-blue-600 dark:text-blue-400"
                : sub.conditionsLabelStyle === "neutral"
                  ? "text-muted-foreground"
                  : "text-red-600 dark:text-red-400",
            )}
          >
            {sub.conditionsLabelStyle === "info" || sub.conditionsLabelStyle === "neutral" ? "" : "⚠ "}
            {sub.conditionsLabel ?? "Conditions:"}
          </div>
          <div className="space-y-1.5">
            {sub.conditions.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-red-500"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {sub.sections?.map((sec) => (
        <div key={sec.title}>
          <div className="my-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {sec.title}
          </div>
          {sec.subSections?.length
            ? sec.subSections.map((ss) => (
                <div key={ss.title}>
                  <div className="my-1.5 text-[12px] font-bold text-red-600 dark:text-red-400">{ss.title}</div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {ss.items.map((it) => (
                      <div key={it} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-red-500">
                        {it}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : sec.items?.length
              ? (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {sec.items.map((it) => (
                    <div key={it} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-red-500">
                      {it}
                    </div>
                  ))}
                </div>
              )
              : null}
        </div>
      ))}

      {sub.rationale ? <Callout label="Rationale:">{sub.rationale}</Callout> : null}
      {sub.ifNeeded ? (
        <Callout label="If needed:" tone="info">
          {sub.ifNeeded}
        </Callout>
      ) : null}
      {sub.note ? (
        <Callout label="Note:" tone="info">
          {sub.note}
        </Callout>
      ) : null}
    </div>
  );
}

function Callout({
  label,
  tone = "warn",
  children,
}: {
  label: string;
  tone?: "warn" | "info" | "safe";
  children: ReactNode;
}) {
  const border =
    tone === "info" ? "border-blue-500" : tone === "safe" ? "border-green-500" : "border-amber-500";
  const labelCls =
    tone === "info"
      ? "text-blue-600 dark:text-blue-400"
      : tone === "safe"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-amber-700 dark:text-amber-300";
  const bg =
    tone === "safe"
      ? "bg-emerald-50 dark:bg-emerald-950/40"
      : tone === "info"
        ? "bg-blue-50/80 dark:bg-blue-950/35"
        : "bg-amber-50/80 dark:bg-amber-950/35";
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border-l-[3px] px-3 py-2.5", border, bg)}>
      <span className={cn("shrink-0 font-bold", labelCls)}>{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

/* ───────────────────────────── component ───────────────────────────── */

export function ContraindicationsReference({
  collapsible = false,
  embedded = false,
}: {
  collapsible?: boolean;
  embedded?: boolean;
}) {
  const tabs = MG_CONTRA_DATA.topTabs;
  const [open, setOpen] = useState(!collapsible);
  const [topId, setTopId] = useState(tabs[0]!.id);
  const [subId, setSubId] = useState<string | null>(tabs[0]!.subTabs[0]?.id ?? null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"global" | "local">("global");

  const top = tabs.find((t) => t.id === topId)!;
  const q = query.trim().toLowerCase();
  const globalActive = scope === "global" && q.length > 0;

  const selectTop = (t: ContraTopTab) => {
    setTopId(t.id);
    setSubId(t.subTabs[0]?.id ?? null);
    setCategory("All");
  };

  const goTo = (targetTopId: string, targetSubId?: string) => {
    const t = tabs.find((x) => x.id === targetTopId);
    if (!t) return;
    setTopId(targetTopId);
    if (t.view === "list") {
      setCategory("All");
      setScope("local"); // keep query highlighted in the list
    } else if (targetSubId) {
      setSubId(targetSubId);
      setQuery("");
      setScope("global");
    }
  };

  // Global cross-tab search results.
  const globalResults = useMemo(() => {
    if (!globalActive) return [];
    return tabs
      .map((t) => {
        if (t.view === "list") {
          const conds = (t.conditions ?? []).filter((c) =>
            `${c.name} ${c.desc} ${c.note ?? ""} ${c.cat} ${CONTRA_STATUS_META[c.status].label}`
              .toLowerCase()
              .includes(q),
          );
          return { top: t, conds, subs: [] as ContraSubTab[] };
        }
        const subs = t.subTabs.filter((s) => subHaystack(s).toLowerCase().includes(q));
        return { top: t, conds: [], subs };
      })
      .filter((r) => r.conds.length || r.subs.length);
  }, [globalActive, q, tabs]);

  const totalMatches = globalResults.reduce(
    (n, r) => n + r.conds.length + r.subs.length,
    0,
  );

  const visibleSubs = useMemo(
    () => (top.view === "list" ? [] : top.subTabs.filter((s) => !q || subHaystack(s).toLowerCase().includes(q))),
    [top, q],
  );
  const activeSub =
    top.view === "list"
      ? null
      : top.subTabs.find((s) => s.id === subId) ?? visibleSubs[0] ?? null;

  // Knowledge Base list rows (query ignores category to surface every match).
  const kbRows = useMemo(() => {
    if (top.view !== "list") return [];
    const all = top.conditions ?? [];
    if (q) {
      return all.filter((c) =>
        `${c.name} ${c.desc} ${c.note ?? ""} ${c.cat} ${CONTRA_STATUS_META[c.status].label}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (category !== "All") return all.filter((c) => c.cat === category);
    return all;
  }, [top, q, category]);

  const constrained = embedded || collapsible;

  const body = (
    <div
      className={cn(
        "flex flex-col bg-card text-foreground",
        constrained && "h-full min-h-0 flex-1",
      )}
    >
      {/* Top tabs */}
      <div className="shrink-0 flex flex-wrap gap-2 border-b border-border bg-muted/30 px-3 pt-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTop(t)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
              t.id === topId
                ? "border-transparent text-white shadow"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            style={t.id === topId ? { backgroundColor: t.colorDark } : undefined}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-border bg-muted/20 px-2.5 py-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setScope("global");
            }}
            placeholder="Search conditions, medications, keywords…"
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-7 pr-3 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </div>

      {/* Sub tabs / category pills */}
      {!globalActive ? (
        <div className="shrink-0 flex flex-wrap gap-2 border-b border-border bg-muted/20 px-3 pb-3 pt-2">
          {top.view === "list"
            ? ["All", ...(top.categories ?? [])].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    cat === category
                      ? "border-transparent text-white shadow"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  style={cat === category ? { backgroundColor: top.colorDark } : undefined}
                >
                  {cat}
                </button>
              ))
            : visibleSubs.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubId(s.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    s.id === (activeSub?.id ?? subId)
                      ? "border-transparent text-white shadow"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  style={s.id === (activeSub?.id ?? subId) ? { backgroundColor: top.colorDark } : undefined}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
        </div>
      ) : null}

      {/* Content */}
      <div
        className={cn(
          "bg-background px-4 py-4",
          constrained
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "max-h-[min(60dvh,32rem)] overflow-y-auto overscroll-contain",
        )}
      >
        {globalActive ? (
          <GlobalResults
            results={globalResults}
            total={totalMatches}
            q={q}
            onGo={goTo}
          />
        ) : top.view === "list" ? (
          <KnowledgeList rows={kbRows} q={q} category={category} total={top.conditions?.length ?? 0} categories={top.categories ?? []} />
        ) : activeSub ? (
          <SubDetail sub={activeSub} />
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {q ? `No matches for "${query}" in ${top.label}.` : "No content available."}
          </div>
        )}
      </div>
    </div>
  );

  if (!collapsible) return body;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-border bg-primary/5 px-3.5 py-2.5 text-[13px] font-semibold text-foreground"
      >
        <span className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-red-600" />
          Contraindications Reference
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="flex max-h-[min(70dvh,38rem)] flex-col overflow-hidden">
          {body}
        </div>
      ) : null}
    </div>
  );
}

function KnowledgeList({
  rows,
  q,
  category,
  total,
  categories,
}: {
  rows: ContraKbItem[];
  q: string;
  category: string;
  total: number;
  categories: string[];
}) {
  const count =
    q !== ""
      ? `${rows.length} of ${total} match "${q}"`
      : category !== "All"
        ? `${rows.length} condition${rows.length === 1 ? "" : "s"} in ${category}`
        : `Showing ${rows.length} conditions`;

  if (rows.length === 0) {
    return (
      <div>
        <div className="pb-2 text-[12px] text-muted-foreground">{count}</div>
        <div className="py-6 text-center text-sm text-muted-foreground">No matching conditions.</div>
      </div>
    );
  }

  const order = q ? categories : category === "All" ? categories : [category];

  return (
    <div>
      <div className="pb-2 text-[12px] text-muted-foreground">{count}</div>
      {order.map((cat) => {
        const items = rows.filter((r) => r.cat === cat);
        if (!items.length) return null;
        return (
          <div key={cat}>
            <div className="mb-2 mt-4 inline-block rounded-md border-l-[3px] border-emerald-500 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {cat}
            </div>
            {items.map((c) => (
              <div
                key={c.name}
                className="my-1.5 flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-foreground">{highlight(c.name, q)}</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{highlight(c.desc, q)}</div>
                  {c.note ? (
                    <div className="mt-1.5 rounded-md border-l-2 border-border bg-muted/40 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      📝 {highlight(c.note, q)}
                    </div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide",
                    STATUS_BADGE[c.status],
                  )}
                >
                  {CONTRA_STATUS_META[c.status].icon} {CONTRA_STATUS_META[c.status].label}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function GlobalResults({
  results,
  total,
  q,
  onGo,
}: {
  results: { top: ContraTopTab; conds: ContraKbItem[]; subs: ContraSubTab[] }[];
  total: number;
  q: string;
  onGo: (topId: string, subId?: string) => void;
}) {
  if (total === 0) {
    return (
      <div>
        <div className="pb-2 text-[12px] text-muted-foreground">
          <strong className="text-foreground">0</strong> matches for &ldquo;{q}&rdquo; across all tabs
        </div>
        <div className="py-6 text-center text-sm text-muted-foreground">
          Nothing matched. Search covers every condition, medication, rationale and note across all tabs.
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="pb-2 text-[12px] text-muted-foreground">
        <strong className="text-foreground">{total}</strong> match{total === 1 ? "" : "es"} for &ldquo;{q}&rdquo; across all tabs
      </div>
      {results.map((r) => (
        <div key={r.top.id} className="mb-4">
          <div
            className="mb-2 flex items-center gap-2 rounded-lg border-l-[3px] bg-muted/30 px-3 py-2 text-[12px] font-extrabold uppercase tracking-wide text-foreground"
            style={{ borderLeftColor: r.top.color }}
          >
            <span className="text-base">{r.top.icon}</span>
            <span className="flex-1">{r.top.label}</span>
            <span className="rounded-full px-2 py-0.5 text-[11px] text-white" style={{ backgroundColor: r.top.color }}>
              {r.conds.length + r.subs.length}
            </span>
          </div>
          {r.conds.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onGo(r.top.id)}
              className="mb-1.5 flex w-full items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-sm hover:border-primary/30 hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-foreground">
                  {highlight(c.name, q)}{" "}
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">{c.cat}</span>
                </div>
                <div className="line-clamp-2 text-[12px] text-muted-foreground">{highlight(c.desc, q)}</div>
              </div>
              <span className={cn("shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold uppercase", STATUS_BADGE[c.status])}>
                {CONTRA_STATUS_META[c.status].icon} {CONTRA_STATUS_META[c.status].label}
              </span>
            </button>
          ))}
          {r.subs.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onGo(r.top.id, s.id)}
              className="mb-1.5 flex w-full items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-sm hover:border-primary/30 hover:bg-muted/40"
            >
              <div className="text-lg leading-tight">{s.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-foreground">{highlight(s.label, q)}</div>
                <div className="line-clamp-2 text-[12px] text-muted-foreground">
                  {highlight(makeSnippet(subHaystack(s), q), q)}
                </div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

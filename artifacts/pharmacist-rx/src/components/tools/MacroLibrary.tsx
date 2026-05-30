import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, Mail, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPharmacistName } from "@/lib/pharmacistSession";
import {
  EMAIL_MACROS,
  MACRO_CATEGORIES,
  frameMacroEmail,
  type EmailMacro,
  type MacroCategory,
} from "@/components/tools/macroLibraryData";

/* ============================================================================
   Email Macros Library — searchable, category-filtered accordion.
   Each macro is collapsed by default; opening reveals an editable email with
   the patient-name greeting at the top and the prescriber's name as the
   sign-off at the bottom.
   ============================================================================ */

const FILTERS: ("All" | MacroCategory)[] = ["All", ...MACRO_CATEGORIES];

export function MacroLibrary({
  collapsible = false,
  embedded = false,
}: {
  collapsible?: boolean;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | MacroCategory>("All");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const username = getPharmacistName();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EMAIL_MACROS.filter((m) => {
      const matchesCategory = category === "All" || m.category === category;
      const matchesQuery =
        !q ||
        [m.name, m.description, m.content, m.category]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const toggleMacro = (m: EmailMacro) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) {
        next.delete(m.id);
      } else {
        next.add(m.id);
        setDrafts((d) =>
          d[m.id] != null ? d : { ...d, [m.id]: frameMacroEmail(m.content, username) },
        );
      }
      return next;
    });
  };

  const copyDraft = async (m: EmailMacro) => {
    const text = drafts[m.id] ?? frameMacroEmail(m.content, username);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* clipboard unavailable */
      }
      document.body.removeChild(ta);
    }
    setCopiedId(m.id);
    window.setTimeout(
      () => setCopiedId((cur) => (cur === m.id ? null : cur)),
      1500,
    );
  };

  const toolbar = (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gallbladder, pregnancy, PUE, titration, rejection..."
          className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-xs text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setCategory(f)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors",
              category === f
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Macro library ({filtered.length})
      </div>
    </>
  );

  const macroList = (
    <div className="grid gap-2">
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-3 text-xs text-muted-foreground">
          No macros match your search.
        </div>
      ) : (
        filtered.map((m) => {
          const isOpen = openIds.has(m.id);
          return (
            <div
              key={m.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-card shadow-sm",
                isOpen ? "border-violet-400 ring-1 ring-violet-200" : "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => toggleMacro(m)}
                className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left"
                aria-expanded={isOpen}
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-bold leading-snug text-foreground">
                    {m.name}
                  </div>
                  <div className="text-[11px] leading-snug text-muted-foreground">
                    {m.description}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {m.category}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-violet-500 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </div>
              </button>

              {isOpen ? (
                <div className="border-t border-border bg-muted/20 p-2.5">
                  <textarea
                    value={drafts[m.id] ?? frameMacroEmail(m.content, username)}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [m.id]: e.target.value }))
                    }
                    spellCheck
                    className="min-h-40 max-h-48 w-full resize-y rounded-lg border border-border bg-card p-3 text-[12px] leading-relaxed text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void copyDraft(m)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );

  const constrained = embedded || collapsible;

  const body = constrained ? (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 bg-muted/20 p-3.5 pb-2">{toolbar}</div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 px-3.5 pb-3.5">
        {macroList}
      </div>
    </div>
  ) : (
    <div className="space-y-3 bg-muted/20 p-3.5">
      {toolbar}
      {macroList}
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
          <Mail className="h-4 w-4 text-violet-600" />
          Email Macros Library
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="flex max-h-[min(70dvh,38rem)] flex-col overflow-hidden">
          {body}
        </div>
      ) : null}
    </div>
  );
}

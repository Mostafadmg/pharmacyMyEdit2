import { useMemo, useState } from "react";
import { Mail, Search, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
   Macro composer — a large modal that pairs a searchable macro library with
   an editable message composer and a Send action. Picking a macro loads it
   (subject stripped, patient name filled, prescriber sign-off) into the
   composer where it can be edited before sending.
   ============================================================================ */

const FILTERS: ("All" | MacroCategory)[] = ["All", ...MACRO_CATEGORIES];

export function MacroComposerDialog({
  open,
  onOpenChange,
  patientName,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  onSend: (text: string) => void | Promise<void>;
}) {
  const username = getPharmacistName();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | MacroCategory>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

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

  const loadMacro = (m: EmailMacro) => {
    setSelectedId(m.id);
    setDraft(frameMacroEmail(m.content, username, patientName));
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft("");
      setSelectedId(null);
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92dvh,52rem)] w-[min(96vw,68rem)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border bg-primary/5 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Mail className="h-5 w-5 text-violet-600" />
            Email Macros
          </DialogTitle>
          <DialogDescription>
            Pick a macro, edit the message for {patientName}, then send.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* Macro list */}
          <div className="flex min-h-0 flex-col border-b border-border bg-muted/20 md:border-b-0 md:border-r">
            <div className="space-y-2 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search macros…"
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
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors",
                      category === f
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-card p-3 text-xs text-muted-foreground">
                  No macros match your search.
                </div>
              ) : (
                filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => loadMacro(m)}
                    className={cn(
                      "w-full rounded-xl border bg-card p-2.5 text-left shadow-sm transition-all hover:-translate-y-px hover:border-primary/30 hover:shadow-md",
                      selectedId === m.id
                        ? "border-violet-400 ring-1 ring-violet-200"
                        : "border-border",
                    )}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="text-[12px] font-bold leading-snug text-foreground">
                        {m.name}
                      </div>
                      <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {m.category}
                      </span>
                    </div>
                    <div className="text-[11px] leading-snug text-muted-foreground">
                      {m.description}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="flex min-h-0 flex-col p-4">
            <label className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Message to {patientName}
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Select a macro on the left to load a template, or type your own message…"
              className="min-h-0 flex-1 resize-none rounded-xl border border-border bg-card p-3.5 text-[13px] leading-relaxed text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!draft.trim() || sending}
                onClick={() => void send()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

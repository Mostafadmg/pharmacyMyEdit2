import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search, FileText, User, ShoppingBag, Activity, MessageSquare, Package, BarChart3, Stethoscope } from "lucide-react";
import { apiFetch } from "@/lib/api";

type SearchResult = {
  consultations: Array<{ id: string; patientName: string; patientEmail: string; conditionName: string; status: string }>;
  patients: Array<{ id: string; name: string; email: string }>;
  orders: Array<{ id: string; patientName: string; status: string; totalGbp: number }>;
};

type CommandItem = {
  id: string;
  group: "Consultations" | "Patients" | "Orders" | "Navigate";
  icon: typeof Search;
  label: string;
  hint?: string;
  href: string;
};

const NAV_ITEMS: CommandItem[] = [
  { id: "nav-queue", group: "Navigate", icon: Activity, label: "Consultation queue", href: "/dashboard" },
  { id: "nav-patients", group: "Navigate", icon: User, label: "All patients", href: "/dashboard/patients" },
  { id: "nav-messages", group: "Navigate", icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { id: "nav-orders", group: "Navigate", icon: ShoppingBag, label: "Shop orders", href: "/dashboard/orders" },
  { id: "nav-products", group: "Navigate", icon: Package, label: "Products & inventory", href: "/dashboard/products" },
  { id: "nav-conditions", group: "Navigate", icon: Stethoscope, label: "Conditions catalogue", href: "/dashboard/conditions" },
  { id: "nav-analytics", group: "Navigate", icon: BarChart3, label: "Analytics dashboard", href: "/dashboard/analytics" },
];

export default function CommandPalette() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ consultations: [], patients: [], orders: [] });
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults({ consultations: [], patients: [], orders: [] });
      return;
    }
    const t = setTimeout(async () => {
      try {
        const json = await apiFetch<SearchResult>(
          `/api/pharmacist/search?q=${encodeURIComponent(query.trim())}`,
          { auth: "pharmacist" },
        );
        setResults(json);
        setActiveIdx(0);
      } catch {
        setResults({ consultations: [], patients: [], orders: [] });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  const items: CommandItem[] = (() => {
    if (query.trim().length < 2) {
      return NAV_ITEMS;
    }
    const list: CommandItem[] = [];
    for (const c of results.consultations) {
      list.push({
        id: `c-${c.id}`,
        group: "Consultations",
        icon: FileText,
        label: `${c.patientName} — ${c.conditionName}`,
        hint: c.status,
        href: `/dashboard/consultation/${c.id}`,
      });
    }
    for (const p of results.patients) {
      list.push({
        id: `p-${p.id}`,
        group: "Patients",
        icon: User,
        label: p.name,
        hint: p.email,
        href: `/dashboard/patients/${encodeURIComponent(p.email)}`,
      });
    }
    for (const o of results.orders) {
      list.push({
        id: `o-${o.id}`,
        group: "Orders",
        icon: ShoppingBag,
        label: `${o.patientName} — £${(o.totalGbp / 100).toFixed(2)}`,
        hint: `${o.status} · ${o.id.slice(0, 8)}`,
        href: `/dashboard/orders/${o.id}`,
      });
    }
    if (list.length === 0) {
      return NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));
    }
    return list;
  })();

  function go(item: CommandItem) {
    setOpen(false);
    navigate(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIdx];
      if (item) go(item);
    }
  }

  if (!open) return null;

  // Group items for display
  const groups: Record<string, CommandItem[]> = {};
  items.forEach((it) => {
    if (!groups[it.group]) groups[it.group] = [];
    groups[it.group]!.push(it);
  });
  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setOpen(false)}
      data-testid="command-palette"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search patients, consultations, orders… (⌘K)"
            className="flex-1 outline-none text-base placeholder:text-muted-foreground"
            data-testid="command-palette-input"
          />
          <kbd className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-auto p-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(groups).map(([group, groupItems]) => (
              <div key={group} className="mb-2">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                {groupItems.map((it) => {
                  runningIndex++;
                  const isActive = runningIndex === activeIdx;
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.id}
                      onClick={() => go(it)}
                      onMouseEnter={() => setActiveIdx(items.indexOf(it))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-secondary"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-sm font-medium truncate">{it.label}</span>
                      {it.hint && (
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">{it.hint}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>↑↓ to navigate · ↵ to open · ESC to close</span>
          <span className="font-semibold">PharmaCare Command Palette</span>
        </div>
      </div>
    </div>
  );
}

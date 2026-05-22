import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Users,
  FileText,
  Tag,
  UserCircle,
  Menu,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Leaf,
  Ban,
  MessageCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetPharmacistUnreadCounts } from "@workspace/api-client-react";

type NavItem = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "messages";
  hasChevron?: boolean;
};

const NAV: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/queue", label: "Orders", icon: ShoppingBag, hasChevron: true },
  { path: "/messages", label: "Patient Messages", icon: MessageSquare, badgeKey: "messages" },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/prescriptions", label: "Prescriptions", icon: FileText },
  { path: "/profile", label: "Profile", icon: UserCircle },
  { path: "/labels", label: "Dispensing Labels", icon: Tag },
];

export function RxLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { data: counts } = useGetPharmacistUnreadCounts();

  const pharmName =
    (typeof window !== "undefined" && localStorage.getItem("pharmacist_name")) ||
    "Pharmacist";

  const messagesBadge = counts?.unreadMessages ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      <header className="h-16 bg-white border-b border-stone-200/80 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
            <Leaf className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
          </div>
          <div className="leading-tight">
            <div className="font-serif font-semibold text-[15px] text-[hsl(var(--primary))] tracking-tight">
              PharmaCare
            </div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-stone-500 -mt-0.5 font-semibold">
              Rx Portal
            </div>
          </div>
        </Link>

        <button className="md:hidden p-2" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className="flex items-center gap-3 w-full max-w-2xl bg-stone-100/80 rounded-full px-5 py-2.5 border border-stone-200/60">
            <Search className="h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Search orders, patients, prescriptions…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-stone-500"
              data-testid="input-global-search"
            />
            <kbd className="hidden md:inline-flex items-center gap-1 text-[10px] text-stone-500 bg-white border border-stone-200 rounded px-1.5 py-0.5 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
            aria-label="Toggle theme"
            data-testid="button-theme-toggle"
          >
            <Sun className="h-[18px] w-[18px]" />
          </button>
          <div className="relative pl-1">
            <div className="h-9 w-9 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))] flex items-center justify-center font-semibold text-xs ring-1 ring-stone-200/60">
              {pharmName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
        </div>
      </header>

      <div className="flex-1 min-w-0 flex">
        <aside
          className={cn(
            "hidden md:flex flex-col bg-white text-stone-700 transition-[width] duration-200 border-r border-stone-200/80",
            collapsed ? "w-[68px]" : "w-[228px]",
          )}
        >
          <nav className="flex-1 py-4 px-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.path === "/"
                  ? location === "/"
                  : location.startsWith(item.path);
              const badge =
                item.badgeKey === "messages" ? messagesBadge : 0;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 my-0.5 px-3 py-2.5 rounded-lg text-[13px] transition-all relative",
                    active
                      ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] font-semibold"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[hsl(var(--primary))]" />
                  )}
                  <Icon className={cn("h-[17px] w-[17px] shrink-0", active && "text-[hsl(var(--primary))]")} />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {badge > 0 && !collapsed && (
                    <span className="inline-flex h-[18px] min-w-[18px] px-1.5 items-center justify-center text-[10px] font-semibold rounded-full bg-rose-500 text-white">
                      {badge}
                    </span>
                  )}
                  {item.hasChevron && !collapsed && !active && (
                    <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
                  )}
                  {badge > 0 && collapsed && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="m-3 px-3 py-2 text-[11px] rounded-lg hover:bg-stone-50 flex items-center gap-2 text-stone-600 uppercase tracking-wide font-semibold"
            data-testid="button-toggle-sidebar"
          >
            <ChevronLeft
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed && "Collapse"}
          </button>
        </aside>

        <main className="flex-1 min-w-0 overflow-x-hidden bg-[hsl(var(--background))]">
          {children}
        </main>
      </div>

      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-stone-200 text-stone-500 hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]/30 rounded-l-lg p-2 z-40 shadow-sm transition-colors"
        aria-label="Settings"
        data-testid="button-settings-tab"
      >
        <Settings className="h-4 w-4" />
      </button>

      <button
        className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-full px-3.5 py-2 shadow-sm fixed bottom-4 left-4 z-50 flex items-center gap-1.5 text-xs font-semibold transition-colors"
        data-testid="button-contraindications"
      >
        <Ban className="h-3.5 w-3.5" />
        Contraindications
      </button>

      <button
        className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-full pl-4 pr-5 py-2.5 shadow-lg shadow-[hsl(var(--primary))]/20 fixed bottom-4 right-4 z-50 flex items-center gap-2.5 text-sm font-semibold transition-colors"
        data-testid="button-message-patient"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="leading-tight text-left">
          <span className="block">Message patient</span>
          <span className="block text-[10px] font-normal opacity-80 tracking-wide">
            Encrypted thread
          </span>
        </span>
      </button>
    </div>
  );
}

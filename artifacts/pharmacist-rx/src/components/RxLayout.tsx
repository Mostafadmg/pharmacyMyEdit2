import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Users,
  FileText,
  Tag,
  UserCircle,
  Menu,
  Bell,
  Search,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetPharmacistUnreadCounts } from "@workspace/api-client-react";

type NavItem = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "pending" | "messages";
};

const NAV: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/queue", label: "Prescription Queue", icon: ClipboardList, badgeKey: "pending" },
  { path: "/messages", label: "Patient Messages", icon: MessageSquare, badgeKey: "messages" },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/prescriptions", label: "Prescriptions", icon: FileText },
  { path: "/labels", label: "Dispensing Labels", icon: Tag },
  { path: "/profile", label: "My Profile", icon: UserCircle },
];

export function RxLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { data: counts } = useGetPharmacistUnreadCounts();

  const pharmName =
    (typeof window !== "undefined" && localStorage.getItem("pharmacist_name")) ||
    "Pharmacist";
  const pharmRole =
    (typeof window !== "undefined" && localStorage.getItem("pharmacist_role")) ||
    "Pharmacist Prescriber";

  const badgeValue = (key?: NavItem["badgeKey"]) => {
    if (!counts) return 0;
    if (key === "pending") return counts.patientResponded ?? 0;
    if (key === "messages") return counts.unreadMessages ?? 0;
    return 0;
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 border-r border-sidebar-border",
          collapsed ? "w-[68px]" : "w-[244px]",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
            P
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-serif font-semibold">PharmaCare</div>
              <div className="text-[11px] opacity-70 -mt-0.5">Rx Portal</div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === "/"
                ? location === "/"
                : location.startsWith(item.path);
            const badge = badgeValue(item.badgeKey);
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 mx-2 my-0.5 px-3 py-2 rounded-md text-sm transition-colors relative",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/85 hover:bg-white/5",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {badge > 0 && !collapsed && (
                  <span className="ml-auto inline-flex h-5 min-w-5 px-1.5 items-center justify-center text-[11px] font-semibold rounded-full bg-destructive text-destructive-foreground">
                    {badge}
                  </span>
                )}
                {badge > 0 && collapsed && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 px-3 py-2 text-xs rounded-md hover:bg-white/5 flex items-center gap-2 opacity-80"
          data-testid="button-toggle-sidebar"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
          {!collapsed && "Collapse"}
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-card border-b border-card-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30">
          <button className="md:hidden p-2 -ml-2" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2 max-w-md flex-1 bg-muted/60 rounded-md px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patient, order #, NHS no…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
              data-testid="input-global-search"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-md hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {(counts?.unreadMessages ?? 0) > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                {pharmName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-sm font-medium" data-testid="text-pharmacist-name">
                  {pharmName}
                </div>
                <div className="text-[11px] text-muted-foreground">{pharmRole}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

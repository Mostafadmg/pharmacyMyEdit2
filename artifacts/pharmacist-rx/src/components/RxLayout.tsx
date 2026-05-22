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
      <header className="h-16 bg-white border-b border-stone-200 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-9 rounded-full bg-[#F1F8E9] flex items-center justify-center">
            <Leaf className="h-5 w-5 text-[#7DBE3F]" />
          </div>
          <div className="leading-tight">
            <div className="font-serif font-bold text-base text-[#0E3D2D]">
              PharmaCare
            </div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500 -mt-0.5">
              Rx Portal
            </div>
          </div>
        </Link>

        <button className="md:hidden p-2" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className="flex items-center gap-3 w-full max-w-2xl bg-stone-100 rounded-full px-5 py-3">
            <Search className="h-4 w-4 text-stone-500" />
            <input
              type="text"
              placeholder="Search [CTRL + K]"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-stone-500"
              data-testid="input-global-search"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            className="p-2 rounded-full hover:bg-stone-100 text-stone-600"
            aria-label="Toggle theme"
            data-testid="button-theme-toggle"
          >
            <Sun className="h-5 w-5" />
          </button>
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-semibold text-sm">
              {pharmName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#7DBE3F] ring-2 ring-white" />
          </div>
        </div>
      </header>

      <div className="flex-1 min-w-0 flex">
        <aside
          className={cn(
            "hidden md:flex flex-col bg-white text-stone-700 transition-[width] duration-200 border-r border-stone-200",
            collapsed ? "w-[68px]" : "w-[224px]",
          )}
        >
          <nav className="flex-1 py-3">
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
                    "flex items-center gap-3 mx-2 my-0.5 px-4 py-2.5 rounded-md text-sm transition-colors relative",
                    active
                      ? "bg-[#F1F8E9] text-[#0E3D2D] font-semibold border-l-4 border-[#7DBE3F] pl-3"
                      : "text-stone-700 hover:bg-stone-50",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {badge > 0 && !collapsed && (
                    <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center text-[11px] font-semibold rounded-full bg-[#E84B3C] text-white">
                      {badge}
                    </span>
                  )}
                  {item.hasChevron && !collapsed && (
                    <ChevronRight className="h-4 w-4 text-stone-400" />
                  )}
                  {badge > 0 && collapsed && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#E84B3C]" />
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="m-2 px-3 py-2 text-xs rounded-md hover:bg-stone-50 flex items-center gap-2 text-stone-500"
            data-testid="button-toggle-sidebar"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed && "Collapse"}
          </button>
        </aside>

        <main className="flex-1 min-w-0 overflow-x-hidden bg-stone-50">
          {children}
        </main>
      </div>

      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#0E8F6E] text-white rounded-l-md p-2 z-40 shadow-md"
        aria-label="Settings"
        data-testid="button-settings-tab"
      >
        <Settings className="h-5 w-5" />
      </button>

      <button
        className="bg-[#E84B3C] text-white rounded-full px-4 py-3 shadow-lg fixed bottom-4 left-4 z-50 flex items-center gap-2 text-sm font-semibold"
        data-testid="button-contraindications"
      >
        <Ban className="h-4 w-4" />
        Contraindications
      </button>

      <button
        className="bg-[#0E8F6E] text-white rounded-full px-4 py-3 shadow-lg fixed bottom-4 right-4 z-50 flex items-center gap-2 text-sm font-semibold"
        data-testid="button-message-patient"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="leading-tight text-left">
          <span className="block">Message patient</span>
          <span className="block text-[10px] font-normal opacity-90">
            Encrypted thread
          </span>
        </span>
      </button>
    </div>
  );
}

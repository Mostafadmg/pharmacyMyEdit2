import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Users,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Pill,
  Menu,
  X,
  ShoppingBag,
  Stethoscope,
  Package,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetPharmacistUnreadCounts } from "@workspace/api-client-react";

type NavKey = "queue" | "patients" | "messages" | "notes" | "orders" | "products" | "conditions" | "complaints" | "reports" | "settings";

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ElementType; href: string; live: boolean; badgeKey?: "queue" | "messages" }[] = [
  { key: "queue", label: "Queue", icon: Activity, href: "/dashboard", live: true, badgeKey: "queue" },
  { key: "patients", label: "Patients", icon: Users, href: "/dashboard/patients", live: true },
  { key: "messages", label: "Messages", icon: MessageSquare, href: "/dashboard/messages", live: true, badgeKey: "messages" },
  { key: "notes", label: "Notes", icon: StickyNote, href: "/dashboard/notes", live: true },
  { key: "orders", label: "Shop Orders", icon: ShoppingBag, href: "/dashboard/orders", live: true },
  { key: "products", label: "Products", icon: Package, href: "/dashboard/products", live: true },
  { key: "conditions", label: "Conditions", icon: Stethoscope, href: "/dashboard/conditions", live: true },
  { key: "complaints", label: "Complaints", icon: MessageSquare, href: "/dashboard/complaints", live: true },
  { key: "reports", label: "Reports", icon: FileText, href: "/dashboard/reports", live: false },
  { key: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings", live: false },
];

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold leading-none shadow-sm"
      data-testid="badge-unread-count"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export interface PharmacistLayoutProps {
  current: NavKey;
  children: React.ReactNode;
}

export default function PharmacistLayout({ current, children }: PharmacistLayoutProps) {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Live unread badge counts. Polled every 60s; refetches on window focus too,
  // so a pharmacist tabbing back to the dashboard sees fresh numbers right away.
  const { data: unreadCounts } = useGetPharmacistUnreadCounts({
    query: {
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      // queryKey is provided by orval's generated wrapper; this cast just satisfies
      // its inner UseQueryOptions type which marks queryKey as required.
    } as Parameters<typeof useGetPharmacistUnreadCounts>[0] extends { query?: infer Q } ? Q : never,
  });
  const queueBadge = unreadCounts?.patientResponded ?? 0;
  const messagesBadge = unreadCounts?.unreadMessages ?? 0;

  useEffect(() => {
    setMobileOpen(false);
  }, [current]);

  const signOut = () => {
    localStorage.removeItem("pharmacist_token");
    localStorage.removeItem("pharmacist_name");
    localStorage.removeItem("pharmacist_role");
    navigate("/");
  };

  const pharmacistName =
    typeof window !== "undefined" ? localStorage.getItem("pharmacist_name") ?? "Pharmacist" : "Pharmacist";
  const pharmacistRole =
    typeof window !== "undefined"
      ? localStorage.getItem("pharmacist_role") ?? "Pharmacist Prescriber (GPhC)"
      : "Pharmacist Prescriber (GPhC)";

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" data-testid="link-sidebar-brand">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-lg shadow-sm">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-serif font-bold tracking-tight">PharmaCare</span>
        </Link>
        <button
          type="button"
          className="md:hidden text-white/80 hover:text-white p-2 -mr-2"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          data-testid="button-close-sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 px-6 flex-1">
        <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4 mt-4">Menu</div>
        <nav className="space-y-2">
          {NAV_ITEMS.map(({ key, label, icon: Icon, href, live, badgeKey }) => {
            const isActive = key === current;
            const badgeCount =
              badgeKey === "queue" ? queueBadge : badgeKey === "messages" ? messagesBadge : 0;
            const baseCls =
              "w-full flex items-center justify-between font-medium rounded-xl p-3 transition-colors";
            const stateCls = isActive
              ? "bg-primary/20 text-primary-foreground"
              : "text-white/70 hover:bg-white/5 hover:text-white";
            const inner = (
              <>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {label}
                  {!live && (
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                      soon
                    </span>
                  )}
                  {badgeKey && <NavBadge count={badgeCount} />}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </>
            );

            if (!live) {
              return (
                <button
                  key={key}
                  type="button"
                  disabled
                  className={`${baseCls} ${stateCls} cursor-not-allowed opacity-60`}
                  data-testid={`nav-${key}`}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link key={key} href={href} className={`${baseCls} ${stateCls}`} data-testid={`nav-${key}`}>
                {inner}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
            {pharmacistName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm" data-testid="text-pharmacist-name">
              {pharmacistName}
            </p>
            <p className="text-xs text-white/60">{pharmacistRole}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
          onClick={signOut}
          data-testid="button-sign-out"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row font-sans">
      {/* Mobile top bar */}
      <header className="md:hidden bg-secondary text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-serif font-bold tracking-tight">PharmaCare</span>
        </Link>
        <button
          type="button"
          className="text-white/90 hover:text-white p-2 -mr-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          data-testid="button-open-sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — mobile drawer + desktop sticky */}
      <aside
        className={`bg-secondary text-white shrink-0 flex flex-col shadow-xl
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-64 md:h-screen md:sticky md:top-0`}
        data-testid="pharmacist-sidebar"
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6 md:space-y-10">{children}</main>
    </div>
  );
}

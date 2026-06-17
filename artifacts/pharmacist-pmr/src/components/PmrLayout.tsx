import { Link, useLocation } from "wouter";
import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Pill,
  Tag,
  Users,
  History,
  Menu,
  ClipboardList,
  ChevronLeft,
  Moon,
  Sun,
  Leaf,
  X,
  Globe,
  ExternalLink,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { patientAppUrl, rxPortalUrl } from "@/lib/portalLinks";
import { getPharmacistToken, getPharmacistName } from "@/lib/pharmacistSession";
import { PatientSearchDropdown } from "@/components/PatientSearchDropdown";
import { DesktopAppBadge } from "@/components/DesktopAppBadge";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useToast } from "@/hooks/use-toast";
import { getConsultationByPickCode } from "@/lib/pmrWorkflowApi";
import { isPickCode, routeForPickCodeConsultation } from "@/lib/pickCodeRouter";
type NavItem = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const NAV: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/queue", label: "Prescription board", icon: Pill },
  { path: "/pick", label: "Pick queue", icon: ClipboardList },
  { path: "/labelling", label: "Labelling", icon: Tag },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/history", label: "History", icon: History },
];
const SIDEBAR_DRAWER_MS = 280;

function SlideSidebar({
  open,
  onClose,
  navLinks,
  showSearch,
}: {
  open: boolean;
  onClose: () => void;
  navLinks: React.ReactNode;
  showSearch?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), SIDEBAR_DRAWER_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <aside
      className={cn(
        "md:hidden shrink-0 flex flex-col overflow-hidden h-full",
        "bg-sidebar text-sidebar-foreground border-sidebar-border",
        "transition-[width] duration-300 ease-out",
        visible ? "w-[min(82vw,220px)] border-r shadow-lg" : "w-0",
      )}
      data-testid="pmr-sidebar-drawer"
      aria-label="Navigation menu"
      aria-hidden={!visible}
    >
      <div className="w-[min(82vw,220px)] flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between px-3 h-14 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-full bg-[var(--edm-dark)] text-[var(--edm-mint)] flex items-center justify-center shrink-0">
              <Leaf className="h-3.5 w-3.5" />
            </div>
            <span className="text-[12px] font-semibold text-sidebar-accent-foreground truncate">
              EveryDayMeds PMR
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showSearch && (
          <div className="px-2.5 py-2 border-b border-sidebar-border shrink-0">
            <PatientSearchDropdown />
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-1.5">{navLinks}</nav>

        <div className="shrink-0 border-t border-sidebar-border p-1.5 space-y-0.5">
          <p className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
            Portals
          </p>
          <a
            href={rxPortalUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          >
            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">Rx Portal</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
          </a>
          <a
            href={patientAppUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">Patient website</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
          </a>
        </div>
      </div>
    </aside>
  );
}

export function PmrLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("everydaymeds:pmr-theme") === "dark"
      ? "dark"
      : "light";
  });
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isDashboardRoute = location === "/";
  const isBoardRoute =
    location === "/queue" || location.startsWith("/prescription/");
  const isClinicalCheckRoute = location.startsWith("/clinical-check/");
  const isLabellingRoute =
    location === "/labelling" || location.startsWith("/labelling/");
  const isPickRoute = location === "/pick";
  const isImmersiveRoute =
    isClinicalCheckRoute || isLabellingRoute || isPickRoute;
  const isFullHeightRoute = isBoardRoute || isImmersiveRoute;
  const showSidebar = isDashboardRoute;
  const showLayoutHeader = !isImmersiveRoute;
  const isLabellingSession = /^\/labelling\/[^/]+/.test(location);
  const showBurger = isFullHeightRoute;

  const handlePickScan = useCallback(
    async (code: string) => {
      if (!isPickCode(code) || !getPharmacistToken()) return;
      try {
        const consultation = await getConsultationByPickCode(code.trim());
        const route = routeForPickCodeConsultation(consultation);
        toast({
          title: route.patientName,
          description: `Opening — ${route.label}`,
        });
        navigate(route.path);
      } catch (err) {
        toast({
          title: "Pick label not recognised",
          description: err instanceof Error ? err.message : "Try again",
          variant: "destructive",
        });
      }
    },
    [navigate, toast],
  );

  useBarcodeScanner({
    enabled: Boolean(getPharmacistToken()) && !isLabellingSession,
    onScan: (code) => {
      if (isPickCode(code)) {
        void handlePickScan(code);
      }
    },
  });
  const pharmName = getPharmacistName();
  const initials = pharmName
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem("everydaymeds:pmr-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          '[data-testid="input-patient-global-search"]',
        );
        input?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const navLinks = (compact?: boolean, onNavigate?: () => void) =>
    NAV.map((item) => {
      const Icon = item.icon;
      const active =
        item.path === "/"
          ? location === "/"
          : location.startsWith(item.path);
      return (
        <Link
          key={item.path}
          href={item.path}
          onClick={onNavigate}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          className={cn(
            "flex items-center gap-2.5 my-0.5 rounded-md transition-colors relative",
            compact ? "px-2 py-1.5 text-[11px]" : "px-2.5 py-2 text-[12px]",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          )}
          title={collapsed && !compact ? item.label : undefined}
        >
          {active && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-[var(--edm-mint)]" />
          )}
          <Icon
            className={cn(
              "shrink-0",
              compact ? "h-3.5 w-3.5" : "h-4 w-4",
              active && "text-[var(--edm-mint)]",
            )}
          />
          {(!collapsed || compact) && (
            <span className="flex-1 truncate">{item.label}</span>
          )}
        </Link>
      );
    });

  return (
    <div
      className={cn(
        "h-screen overflow-hidden flex bg-background text-foreground",
        showSidebar ? "flex-col md:flex-row" : "flex-col",
      )}
    >
      {showSidebar ? (
        <aside
          className={cn(
            "hidden md:flex flex-col h-full min-h-0 shrink-0 self-stretch bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out border-r border-sidebar-border",
            collapsed ? "w-14" : "w-[220px]",
          )}
        >
          <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-1.5">
            {navLinks()}
          </nav>

          <div className="shrink-0 border-t border-sidebar-border p-1.5 space-y-0.5">
            <p
              className={cn(
                "px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/45",
                collapsed && "sr-only",
              )}
            >
              Portals
            </p>
            <a
              href={rxPortalUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            >
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">Rx Portal</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                </>
              )}
            </a>
            <a
              href={patientAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">Patient website</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                </>
              )}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 flex items-center justify-center gap-1.5 border-t border-sidebar-border py-2.5 text-[10px] text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </aside>
      ) : null}

      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        {showLayoutHeader ? (
          <header className="shrink-0 flex items-center gap-2 px-3 md:px-4 z-30 h-11 border-b border-border/50 bg-card/90 backdrop-blur-md">
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              {showSidebar ? (
                <button
                  type="button"
                  className="md:hidden p-1 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                  aria-expanded={sidebarOpen}
                  onClick={() => setSidebarOpen((open) => !open)}
                  data-testid="pmr-menu-button"
                >
                  {sidebarOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </button>
              ) : null}

              <Link href="/" className="flex items-center gap-1.5 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-[var(--edm-dark)] text-[var(--edm-mint)] flex items-center justify-center shrink-0">
                  <Leaf className="h-3.5 w-3.5" />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-semibold text-primary tracking-tight truncate">
                    EveryDayMeds
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    PMR
                  </span>
                  <DesktopAppBadge />
                </div>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 justify-center px-2 min-w-0">
              <PatientSearchDropdown compact className="w-full max-w-sm" />
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0 pl-2 border-l border-border/40 dark:border-white/10">
              <button
                type="button"
                onClick={() =>
                  setTheme((current) => (current === "dark" ? "light" : "dark"))
                }
                className="p-1 rounded-md transition-colors text-muted-foreground hover:bg-muted"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </button>
              <div
                className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold"
                title={pharmName}
              >
                {initials || "RX"}
              </div>
            </div>
          </header>
        ) : null}

        <div className="flex flex-1 overflow-hidden min-h-0">
          {showSidebar ? (
            <SlideSidebar
              open={sidebarOpen}
              onClose={closeSidebar}
              showSearch
              navLinks={navLinks(true, closeSidebar)}
            />
          ) : null}

          <main
            className={cn(
              "flex-1 min-w-0 min-h-0",
              isFullHeightRoute
                ? "flex flex-col overflow-hidden"
                : "overflow-y-auto overflow-x-hidden",
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
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
  Moon,
  Sun,
  Leaf,
  Ban,
  MessageCircle,
  Settings,
  ShieldCheck,
  X,
  Globe,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { patientAppUrl, rxPortalUrl } from "@/lib/portalLinks";
import { useGetPharmacistUnreadCounts } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DocumentRejectionSettings } from "@/components/DocumentRejectionSettings";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"workspace" | "documents">(
    "workspace",
  );
  const [contraindicationsOpen, setContraindicationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("pharmacare:rx-theme") === "dark"
      ? "dark"
      : "light";
  });
  const [location, navigate] = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: counts } = useGetPharmacistUnreadCounts();

  const pharmName =
    (typeof window !== "undefined" && localStorage.getItem("pharmacist_name")) ||
    "Pharmacist";

  const messagesBadge = counts?.unreadMessages ?? 0;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem("pharmacare:rx-theme", theme);
    } catch {
      /* localStorage unavailable */
    }
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = search.trim();
    if (!q) {
      searchRef.current?.focus();
      toast({ title: "Type a search term first" });
      return;
    }
    navigate(`/queue?search=${encodeURIComponent(q)}`);
    setMobileOpen(false);
  };

  const openMessages = () => {
    const onOrderDetail = /^\/orders\/[^/]+/.test(location);
    if (onOrderDetail) {
      window.dispatchEvent(new CustomEvent("pharmacare:toggle-patient-chat"));
      return;
    }
    navigate("/messages");
    toast({ title: "Opening encrypted patient threads" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      <header className="h-16 bg-card/95 border-b border-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30 shadow-sm backdrop-blur">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-full bg-accent text-primary flex items-center justify-center ring-1 ring-accent/30">
            <Leaf className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-serif font-semibold text-[15px] text-primary tracking-tight">
              PharmaCare
            </div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground -mt-0.5 font-semibold">
              Rx Portal
            </div>
          </div>
        </Link>

        <button
          className="md:hidden p-2 rounded-full hover:bg-muted"
          aria-label="Menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex flex-1 justify-center px-4">
          <form
            onSubmit={submitSearch}
            className="flex items-center gap-3 w-full max-w-2xl bg-card rounded-full px-5 py-2.5 border border-border shadow-sm"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Search orders, patients, prescriptions…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
              data-testid="input-global-search"
            />
            <kbd className="hidden md:inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 font-mono">
              ⌘K
            </kbd>
          </form>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Toggle theme"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="relative pl-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open profile"
          >
            <div className="h-9 w-9 rounded-full bg-accent text-primary flex items-center justify-center font-semibold text-xs ring-1 ring-accent/30">
              {pharmName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-w-0 flex">
        <aside
          className={cn(
            "hidden md:flex flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 border-r border-sidebar-border",
            collapsed ? "w-17" : "w-57",
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
                  onClick={() => setMobileOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 my-0.5 px-3 py-2.5 rounded-lg text-[13px] transition-all relative",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.75 rounded-r-full bg-primary" />
                  )}
                  <Icon className={cn("h-4.25 w-4.25 shrink-0", active && "text-primary")} />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {badge > 0 && !collapsed && (
                    <span className="inline-flex h-4.5 min-w-4.5 px-1.5 items-center justify-center text-[10px] font-semibold rounded-full bg-primary-foreground text-rose-600">
                      {badge}
                    </span>
                  )}
                  {item.hasChevron && !collapsed && !active && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {badge > 0 && collapsed && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div
            className={cn(
              "border-t border-sidebar-border mx-2 mt-2 space-y-0.5 pt-3",
              collapsed && "mx-1",
            )}
          >
            {!collapsed ? (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Portals
              </p>
            ) : null}
            <a
              href={rxPortalUrl()}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
              title="Rx Portal"
              data-testid="link-rx-portal"
            >
              <Leaf className="h-4.25 w-4.25 shrink-0 text-primary" />
              {!collapsed ? (
                <>
                  <span className="flex-1 truncate">Rx Portal</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </>
              ) : null}
            </a>
            <a
              href={patientAppUrl()}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
              title="Back to website"
              data-testid="link-back-to-website"
            >
              <Globe className="h-4.25 w-4.25 shrink-0" />
              {!collapsed ? (
                <>
                  <span className="flex-1 truncate">Back to website</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </>
              ) : null}
            </a>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="m-3 px-3 py-2 text-[11px] rounded-lg hover:bg-muted flex items-center gap-2 text-muted-foreground uppercase tracking-wide font-semibold"
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

        <main className="rx-page flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-foreground/30"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[min(20rem,85vw)] bg-card border-r border-border shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-accent text-primary flex items-center justify-center ring-1 ring-accent/30">
                  <Leaf className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <div className="font-serif font-semibold text-[15px] text-primary">
                    PharmaCare
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                    Rx Portal
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form
              onSubmit={submitSearch}
              className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-muted/60 px-3 py-2"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders or patients"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </form>

            <nav className="mt-5 space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.path === "/" ? location === "/" : location.startsWith(item.path);
                const badge = item.badgeKey === "messages" ? messagesBadge : 0;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rx-decline-surface px-1.5 text-[10px] font-semibold text-rose-600">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 space-y-1 border-t border-border pt-4">
              <a
                href={rxPortalUrl()}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted"
                data-testid="link-rx-portal-mobile"
              >
                <Leaf className="h-4.5 w-4.5 shrink-0 text-primary" />
                <span className="flex-1">Rx Portal</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-50" />
              </a>
              <a
                href={patientAppUrl()}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted"
                data-testid="link-back-to-website-mobile"
              >
                <Globe className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1">Back to website</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-50" />
              </a>
            </div>
          </aside>
        </div>
      )}

      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 rounded-l-lg p-2 z-40 shadow-sm transition-colors"
        aria-label="Settings"
        data-testid="button-settings-tab"
      >
        <Settings className="h-4 w-4" />
      </button>

      <button
        onClick={() => setContraindicationsOpen(true)}
        className="bg-card border border-rx-decline-border text-rose-700 hover:bg-rx-decline-surface rounded-full px-3.5 py-2 shadow-sm fixed bottom-4 left-4 z-50 flex items-center gap-1.5 text-xs font-semibold transition-colors"
        data-testid="button-contraindications"
      >
        <Ban className="h-3.5 w-3.5" />
        Contraindications
      </button>

      <button
        onClick={openMessages}
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full pl-4 pr-5 py-2.5 shadow-lg shadow-primary/10 fixed bottom-4 right-4 z-50 flex items-center gap-2.5 text-sm font-semibold transition-colors"
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

      <Dialog
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open) setSettingsTab("workspace");
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 border-b border-border pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setSettingsTab("workspace")}
              className={cn(
                "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
                settingsTab === "workspace"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("documents")}
              className={cn(
                "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
                settingsTab === "documents"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Document emails
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            {settingsTab === "workspace" ? (
              <div className="space-y-3 text-sm">
                <button
                  type="button"
                  onClick={() => setCollapsed((current) => !current)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3 text-left hover:bg-muted"
                >
                  <span>
                    <span className="block font-semibold text-foreground">
                      Sidebar density
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {collapsed ? "Collapsed navigation" : "Expanded navigation"}
                    </span>
                  </span>
                  <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTheme((current) => (current === "dark" ? "light" : "dark"))
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left hover:bg-muted"
                >
                  <span>
                    <span className="block font-semibold text-foreground">Theme</span>
                    <span className="block text-xs text-muted-foreground">
                      Currently using {theme === "dark" ? "dark" : "light"} mode
                    </span>
                  </span>
                  {theme === "dark" ? (
                    <Moon className="h-4.5 w-4.5" />
                  ) : (
                    <Sun className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            ) : (
              <DocumentRejectionSettings />
            )}
          </div>
          <DialogFooter className="shrink-0">
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contraindicationsOpen} onOpenChange={setContraindicationsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contraindication checks</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              "Pregnancy or active breastfeeding",
              "Personal or family history of medullary thyroid carcinoma",
              "MEN2 syndrome or previous pancreatitis",
              "Severe gastrointestinal disease or red-flag symptoms",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rx-decline-surface/50 p-3 text-sm text-rose-950"
              >
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-rose-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setContraindicationsOpen(false)}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

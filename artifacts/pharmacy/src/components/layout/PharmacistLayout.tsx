import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavKey = "queue" | "patients" | "complaints" | "reports" | "settings";

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ElementType; href: string; live: boolean }[] = [
  { key: "queue", label: "Queue", icon: Activity, href: "/dashboard", live: true },
  { key: "patients", label: "Patients", icon: Users, href: "/dashboard/patients", live: true },
  { key: "complaints", label: "Complaints", icon: MessageSquare, href: "/dashboard/complaints", live: true },
  { key: "reports", label: "Reports", icon: FileText, href: "/dashboard/reports", live: false },
  { key: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings", live: false },
];

export interface PharmacistLayoutProps {
  current: NavKey;
  children: React.ReactNode;
}

export default function PharmacistLayout({ current, children }: PharmacistLayoutProps) {
  const [, navigate] = useLocation();

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

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row font-sans">
      <aside
        className="w-full md:w-64 bg-secondary text-white shrink-0 md:h-screen md:sticky top-0 flex flex-col shadow-xl z-20"
        data-testid="pharmacist-sidebar"
      >
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard">
            <a className="flex items-center gap-3" data-testid="link-sidebar-brand">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-lg shadow-sm">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-serif font-bold tracking-tight">PharmaCare</span>
            </a>
          </Link>
        </div>

        <div className="p-4 px-6 flex-1">
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4 mt-4">Menu</div>
          <nav className="space-y-2">
            {NAV_ITEMS.map(({ key, label, icon: Icon, href, live }) => {
              const isActive = key === current;
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
                <Link key={key} href={href}>
                  <a className={`${baseCls} ${stateCls}`} data-testid={`nav-${key}`}>
                    {inner}
                  </a>
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
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">{children}</main>
    </div>
  );
}

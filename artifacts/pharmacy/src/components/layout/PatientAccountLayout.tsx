import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import SiteLayout from "@/components/layout/SiteLayout";
import { PATIENT_ACCOUNT_NAV } from "@/data/patientAccountNav";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export type PatientAccountProgress = {
  completed: number;
  total: number;
};

type PatientAccountLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** e.g. 2/3 complete — shows progress bar in hero (upload documents). */
  progress?: PatientAccountProgress;
  badge?: string;
};

export default function PatientAccountLayout({
  children,
  title,
  subtitle,
  icon,
  progress,
  badge,
}: PatientAccountLayoutProps) {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      navigate("/my-account/login");
    }
  }, [navigate]);

  function logout() {
    ["patient_token", "patient_name", "patient_email", "patient_id"].forEach(
      (k) => localStorage.removeItem(k),
    );
    navigate("/");
  }

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/pages/upload-documents") {
      return (
        location === "/pages/upload-documents" ||
        location === "/account/upload-documents"
      );
    }
    if (href === "/pages/my-tasks") {
      return location === "/pages/my-tasks" || location === "/my-tasks";
    }
    return location === href || location.startsWith(`${href}/`);
  };

  const progressPct = progress
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <SiteLayout className="min-h-screen flex flex-col bg-[#f3f5f4]">
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 lg:py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="lg:w-[260px] shrink-0">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:sticky lg:top-24">
              <div className="flex items-center gap-3 px-1 pb-4 mb-1 border-b border-gray-100">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#314a40] text-white">
                  <User className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-sm font-bold text-gray-900">Welcome back</p>
                  <p className="text-xs text-gray-500 mt-0.5">Manage your care</p>
                </div>
              </div>

              <nav className="space-y-0.5 pt-2">
                {PATIENT_ACCOUNT_NAV.map((item) =>
                  item.logout ? (
                    <button
                      key={item.label}
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border-l-[3px]",
                        isActive(item.href)
                          ? "border-l-[#314a40] bg-[#eaf5ee] text-[#314a40] font-semibold"
                          : "border-l-transparent text-gray-700 hover:bg-[#f5faf7]",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                      {item.label}
                    </Link>
                  ),
                )}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-5">
            <div className="rounded-2xl bg-[#314a40] text-white px-6 py-6 sm:px-8 sm:py-7 shadow-md overflow-hidden">
              <div className="flex items-start gap-3">
                {icon ? (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    {icon}
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-1.5 text-sm text-white/80 max-w-2xl leading-relaxed">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
                {badge && !progress ? (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-[#b8f0c8] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1f3d32]">
                    {badge}
                  </span>
                ) : null}
              </div>

              {progress ? (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#b8f0c8] transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/90 shrink-0">
                    {progress.completed}/{progress.total} complete
                  </span>
                </div>
              ) : null}
            </div>

            {children}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

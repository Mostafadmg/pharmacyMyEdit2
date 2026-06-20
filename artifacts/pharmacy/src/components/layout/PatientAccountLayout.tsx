import React, { useEffect } from "react";
import { useLocation } from "wouter";
import SiteLayout from "@/components/layout/SiteLayout";
import PatientPortalSidebar from "@/components/layout/PatientPortalSidebar";

export type PatientAccountProgress = {
  completed: number;
  total: number;
};

type PatientAccountLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  progress?: PatientAccountProgress;
  badge?: string;
  statsChip?: { label: string; value: string };
  /** Skip hero banner — content only (e.g. messages page matches production). */
  bare?: boolean;
  /** Skip legacy main-area-for-customer-portal wrapper — cards supply their own surfaces. */
  flushContent?: boolean;
};

export default function PatientAccountLayout({
  children,
  title,
  subtitle,
  icon,
  progress,
  badge,
  statsChip,
  bare = false,
  flushContent = false,
}: PatientAccountLayoutProps) {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      navigate("/my-account/login");
    }
  }, [navigate]);

  function logout() {
    ["patient_token", "patient_name", "patient_email", "patient_id"].forEach((k) =>
      localStorage.removeItem(k),
    );
    navigate("/");
  }

  const isActive = (href: string) => {
    if (href === "/pages/my-tasks") {
      return location === "/pages/my-tasks" || location === "/my-tasks";
    }
    if (href === "/pages/my-orders") {
      return location === "/pages/my-orders" || location === "/my-orders";
    }
    if (href === "/pages/my-account") {
      return (
        location === "/pages/my-account" ||
        location === "/account/profile" ||
        location.startsWith("/account/")
      );
    }
    if (href === "/pages/upload-documents") {
      return (
        location === "/pages/upload-documents" ||
        location === "/account/upload-documents"
      );
    }
    if (href === "/pages/quarterly-video-verification") {
      return location === "/pages/quarterly-video-verification";
    }
    if (href === "/pages/customer-message") {
      return (
        location === "/pages/customer-message" ||
        location === "/my-messages" ||
        location.startsWith("/my-messages?")
      );
    }
    if (href === "/pages/change-password") {
      return (
        location === "/pages/change-password" ||
        location === "/account/details/password"
      );
    }
    return location === href || location.startsWith(`${href}/`);
  };

  const progressPct = progress
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <SiteLayout className="min-h-screen flex flex-col bg-[#f3f5f4]">
      <div className="parent-mycustomer-portal-area flex-1">
        <div className="fluid_container">
          <div className="child-mycustomer-portal-area left-sidebar-area">
            <PatientPortalSidebar isActive={isActive} onLogout={logout} />
          </div>

          <div className="child-mycustomer-portal-area right-sidebar-area">
            {!bare && title ? (
              <div className="em-hero">
                <span className="em-hero-blob em-hero-blob-1" aria-hidden />
                <span className="em-hero-blob em-hero-blob-2" aria-hidden />

                <div className="em-hero-content">
                  <div className="em-hero-title-row">
                    {icon ? <span className="em-hero-icon">{icon}</span> : null}
                    <h2 className="em-hero-h">{title}</h2>
                  </div>
                  {subtitle ? <p className="em-hero-sub">{subtitle}</p> : null}

                  {statsChip && !progress ? (
                    <div className="em-hero-stats">
                      <div className="em-hero-chip">
                        <span className="em-chip-label">{statsChip.label}</span>
                        <span className="em-chip-value">{statsChip.value}</span>
                      </div>
                    </div>
                  ) : null}

                  {badge && !progress && !statsChip ? (
                    <div className="em-hero-stats">
                      <div className="em-hero-chip">
                        <span className="em-chip-value">{badge}</span>
                      </div>
                    </div>
                  ) : null}

                  {progress ? (
                    <div className="em-hero-progress">
                      <div className="em-hero-progress-text">
                        <span className="em-hero-progress-count">
                          {progress.completed}
                          <span>/{progress.total}</span>
                        </span>
                        <span className="em-hero-progress-label">Complete</span>
                      </div>
                      <div className="em-hero-progress-bar">
                        <div
                          className="em-hero-progress-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {flushContent ? (
              children
            ) : (
              <div className="main-area-for-customer-portal">{children}</div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

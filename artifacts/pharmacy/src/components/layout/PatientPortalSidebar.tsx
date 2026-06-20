import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { PATIENT_ACCOUNT_NAV } from "@/data/patientAccountNav";

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case "home":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 11.5 12 4l9 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 20v-5h5v5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "orders":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 3V2h6v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M9 9h6M9 13h6M9 17h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "account":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M6 18.5c1-2.2 3.3-3.5 6-3.5s5 1.3 6 3.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "upload":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 16V5m0 0L8 9m4-4 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "reviews":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 8v4l2.5 1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "messages":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8 9h8M8 12.5h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "password":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M8 10V7a4 4 0 0 1 8 0v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="15" r="1.4" fill="currentColor" />
        </svg>
      );
    case "logout":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 17l5-5-5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

const ICON_BY_HREF: Record<string, string> = {
  "/pages/my-tasks": "home",
  "/pages/my-orders": "orders",
  "/pages/my-account": "account",
  "/pages/upload-documents": "upload",
  "/pages/quarterly-video-verification": "reviews",
  "/my-messages": "messages",
  "/pages/customer-message": "messages",
  "/account/details/password": "password",
  "/pages/change-password": "password",
};

type PatientPortalSidebarProps = {
  isActive: (href: string) => boolean;
  onLogout: () => void;
};

export default function PatientPortalSidebar({ isActive, onLogout }: PatientPortalSidebarProps) {
  const navRef = useRef<HTMLElement>(null);
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const nav = navRef.current;
    const active = nav?.querySelector("a.active");
    if (active) {
      active.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }, [location]);

  return (
    <aside className="em-sidebar">
      <div className="em-side-profile">
        <div className="em-side-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="em-side-profile-text">
          <span className="em-side-welcome">Welcome back</span>
          <span className="em-side-sub">Manage your care</span>
        </div>
      </div>

      <nav ref={navRef} className="sidebar-nav-cls em-side-nav">
        {PATIENT_ACCOUNT_NAV.filter((item) => !item.logout).map((item) => {
          const iconKey = ICON_BY_HREF[item.href] ?? "home";
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : ""}
            >
              <span className="em-nav-ic">
                <NavIcon name={iconKey} />
              </span>
              <span className="em-nav-label">{item.label}</span>
            </Link>
          );
        })}

        <div className="em-side-divider" />

        <a
          href="/"
          className="logout-button em-logout"
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
        >
          <span className="em-nav-ic">
            <NavIcon name="logout" />
          </span>
          <span className="em-nav-label">Log out</span>
        </a>
      </nav>
    </aside>
  );
}

import React, { useEffect, useState } from "react";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

function HeroLockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

function CardLockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg className="em-eye-off" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.4 9.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.8 3.6M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 2.6-.4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className="em-eye" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  matchHint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  matchHint?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="child-change-password-input-area em-field">
      <label htmlFor={id}>{label}</label>
      <div className="em-pw-wrap">
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={id.includes("confirm") ? "new-password" : "new-password"}
        />
        <button
          type="button"
          className="toggle-password em-pw-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <EyeIcon hidden={visible} />
        </button>
      </div>
      {matchHint}
    </div>
  );
}

export default function ChangePassword() {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const matchHint = (() => {
    if (!confirm) return <span className="em-pw-match" id="pwMatchHint" />;
    if (next === confirm) {
      return (
        <span className="em-pw-match is-ok" id="pwMatchHint">
          ✓ Passwords match
        </span>
      );
    }
    return (
      <span className="em-pw-match is-bad" id="pwMatchHint">
        Passwords do not match
      </span>
    );
  })();

  async function handleSubmit() {
    if (!next.trim()) {
      toast.error("Please enter a new password.");
      return;
    }
    if (next.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/patient/password", {
        method: "POST",
        auth: "patient",
        body: JSON.stringify({ newPassword: next }),
      });
      toast.success("Password updated successfully.");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PatientAccountLayout
      title="Change Password"
      subtitle="Keep your account secure with a strong, unique password."
      icon={<HeroLockIcon />}
    >
      <div className="em-account em-password">
        <div className="em-acc-card">
          <div className="em-acc-head">
            <span className="em-acc-ic">
              <CardLockIcon />
            </span>
            <h3 className="em-acc-title">Set a new password</h3>
          </div>

          <div className="parent-change-password-input-area em-pw-grid">
            <PasswordField
              id="new_password"
              label="New Password"
              value={next}
              onChange={setNext}
              placeholder="Enter new password"
            />
            <PasswordField
              id="confirm_new_password"
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter new password"
              matchHint={matchHint}
            />
          </div>

          <div className="em-pw-tips">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 8h.01M11 12h1v4h1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Use at least 8 characters with a mix of letters, numbers and symbols.</span>
          </div>

          <div className="em-acc-actions">
            <button
              className="em-btn em-btn-primary update-profile"
              type="button"
              id="changePasswordButton"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {submitting ? "Updating…" : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    </PatientAccountLayout>
  );
}

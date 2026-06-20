import React from "react";
import { cn } from "@/lib/utils";
import {
  isDevTestCredentialsVisible,
  type DevCredential,
  DEV_PATIENT_ACCOUNTS,
  DEV_PHARMACIST_ACCOUNTS,
} from "@/lib/devTestCredentials";

type DevTestCredentialsHintProps = {
  role: "patient" | "pharmacist";
  variant?: "dark" | "light";
  className?: string;
  /** Fill login form fields (email/username + password). */
  onUseAccount?: (account: DevCredential) => void;
  compact?: boolean;
};

function CredentialRows({
  accounts,
  variant,
  onUseAccount,
  compact,
}: {
  accounts: DevCredential[];
  variant: "dark" | "light";
  onUseAccount?: (account: DevCredential) => void;
  compact?: boolean;
}) {
  const muted = variant === "dark" ? "text-white/55" : "text-gray-500";
  const strong = variant === "dark" ? "text-white/90" : "text-gray-900";
  const codeBg =
    variant === "dark" ? "bg-white/10 text-white/90" : "bg-gray-100 text-gray-800";

  return (
    <ul className={cn("space-y-2", compact && "space-y-1.5")}>
      {accounts.map((account) => (
        <li key={`${account.label}-${account.password}`} className="text-xs leading-relaxed">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn("font-semibold", strong)}>{account.label}</p>
              <p className={cn(muted, "mt-0.5 break-all")}>
                <span className={cn("font-mono text-[11px] px-1 py-0.5 rounded", codeBg)}>
                  {account.username}
                </span>
                <span className="mx-1.5 opacity-60">/</span>
                <span className={cn("font-mono text-[11px] px-1 py-0.5 rounded", codeBg)}>
                  {account.password}
                </span>
              </p>
              {account.note ? (
                <p className={cn(muted, "mt-1 text-[10px]")}>{account.note}</p>
              ) : null}
            </div>
            {onUseAccount ? (
              <button
                type="button"
                onClick={() => onUseAccount(account)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  variant === "dark"
                    ? "bg-[#0A7EA4]/90 text-white hover:bg-[#0A7EA4]"
                    : "bg-[#0b4131] text-white hover:bg-[#0d5a45]",
                )}
              >
                Use
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DevTestCredentialsHint({
  role,
  variant = "light",
  className,
  onUseAccount,
  compact,
}: DevTestCredentialsHintProps) {
  if (!isDevTestCredentialsVisible()) return null;

  const accounts = role === "patient" ? DEV_PATIENT_ACCOUNTS : DEV_PHARMACIST_ACCOUNTS;
  const border =
    variant === "dark" ? "border-white/15 bg-white/5" : "border-amber-200 bg-amber-50/80";
  const title = variant === "dark" ? "text-white/70" : "text-amber-900";

  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        border,
        className,
      )}
      data-testid="dev-test-credentials"
    >
      <p className={cn("text-[10px] font-bold uppercase tracking-wide mb-2", title)}>
        Dev test logins
      </p>
      <CredentialRows
        accounts={accounts}
        variant={variant}
        onUseAccount={onUseAccount}
        compact={compact}
      />
    </div>
  );
}

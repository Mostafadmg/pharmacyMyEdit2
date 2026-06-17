import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PmrShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("pmr-page-inner", className)}>{children}</div>;
}

export function PmrPageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="pmr-hero">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="pmr-page-title">{title}</h1>
          {subtitle ? <p className="pmr-page-subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

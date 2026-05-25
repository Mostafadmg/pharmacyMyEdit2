import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RxShell({
  children,
  wide,
  className,
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rx-page-inner",
        wide ? "max-w-[118rem]" : "max-w-[1400px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RxPageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rx-hero">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="rx-page-title">{title}</h1>
          {subtitle ? <p className="rx-page-subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

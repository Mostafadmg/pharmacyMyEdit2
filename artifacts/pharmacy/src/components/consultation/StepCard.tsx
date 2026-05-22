import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StepCardProps {
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function StepCard({
  icon,
  title,
  subtitle,
  children,
  className,
}: StepCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-card p-8 shadow-sm",
        className,
      )}
    >
      {icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </div>
      )}
      {title && (
        <h2 className="font-serif text-3xl font-semibold leading-tight text-foreground">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
      )}
      <div className={cn((title || subtitle) && "mt-6")}>{children}</div>
    </section>
  );
}

export default StepCard;

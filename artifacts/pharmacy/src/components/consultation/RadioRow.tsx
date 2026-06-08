import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type RadioRowTone = "default" | "warning" | "success";

interface RadioRowProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: RadioRowTone;
  className?: string;
  testId?: string;
}

const toneStyles: Record<RadioRowTone, { selected: string; ring: string }> = {
  default: {
    selected: "border-primary bg-primary/5",
    ring: "bg-primary text-primary-foreground",
  },
  warning: {
    selected: "border-[hsl(28_86%_49%)] bg-[hsl(28_86%_49%/0.08)]",
    ring: "bg-[hsl(28_86%_49%)] text-white",
  },
  success: {
    selected: "border-primary bg-accent/40",
    ring: "bg-primary text-primary-foreground",
  },
};

export function RadioRow({
  selected,
  onSelect,
  title,
  subtitle,
  icon,
  tone = "default",
  className,
  testId,
}: RadioRowProps) {
  const styles = toneStyles[tone];
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.99 }}
      animate={{ scale: selected ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group flex min-h-[72px] w-full items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? styles.selected
          : "border-border hover:border-foreground/20",
        className,
      )}
      aria-pressed={selected}
      data-testid={testId}
    >
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-foreground">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? styles.ring + " border-transparent"
            : "border-border bg-transparent",
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>
    </motion.button>
  );
}

export default RadioRow;

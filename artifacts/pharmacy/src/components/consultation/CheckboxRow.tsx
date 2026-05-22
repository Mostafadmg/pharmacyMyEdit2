import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxRowProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  className?: string;
}

export function CheckboxRow({
  checked,
  onToggle,
  title,
  subtitle,
  className,
}: CheckboxRowProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.99 }}
      animate={{ scale: checked ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex min-h-[72px] w-full items-start gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked
          ? "border-primary bg-primary/5"
          : "border-border hover:border-foreground/20",
        className,
      )}
      aria-pressed={checked}
    >
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card",
        )}
      >
        {checked && <Check className="h-4 w-4" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-foreground">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </motion.button>
  );
}

export default CheckboxRow;

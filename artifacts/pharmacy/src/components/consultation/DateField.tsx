import { useId } from "react";
import { cn } from "@/lib/utils";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  hint?: string;
  error?: string;
  className?: string;
}

export function DateField({
  label,
  value,
  onChange,
  max,
  min,
  hint,
  error,
  className,
}: DateFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        min={min}
        aria-invalid={!!error}
        className={cn(
          "h-12 w-full rounded-2xl border bg-card px-4 text-base text-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          error ? "border-destructive" : "border-border",
        )}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default DateField;

import { useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  hint?: string;
  error?: string;
  className?: string;
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  hint,
  error,
  className,
}: TextareaFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-2xl border bg-card px-4 py-3 text-base text-foreground transition-colors",
          "placeholder:text-muted-foreground resize-y",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          error ? "border-destructive" : "border-border",
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {typeof maxLength === "number" && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

export default TextareaField;

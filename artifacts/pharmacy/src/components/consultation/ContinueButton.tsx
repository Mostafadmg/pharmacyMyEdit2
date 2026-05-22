import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContinueButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  type?: "button" | "submit";
  className?: string;
}

export function ContinueButton({
  onClick,
  disabled,
  loading,
  label = "Continue",
  type = "button",
  className,
}: ContinueButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-medium text-primary-foreground transition-colors",
        "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <span>{label}</span>
          <ChevronRight className="h-5 w-5" />
        </>
      )}
    </button>
  );
}

export default ContinueButton;

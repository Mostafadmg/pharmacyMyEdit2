import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackLink({ onClick, label = "Back", className }: BackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

export default BackLink;

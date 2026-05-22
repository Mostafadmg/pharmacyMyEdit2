import type { ReactNode } from "react";
import { BrandHeader } from "./BrandHeader";
import { BackLink } from "./BackLink";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

interface ConsultationShellProps {
  children: ReactNode;
  step: number;
  totalSteps: number;
  stepLabel: string;
  onBack?: () => void;
  hideProgress?: boolean;
  className?: string;
}

export function ConsultationShell({
  children,
  step,
  totalSteps,
  stepLabel,
  onBack,
  hideProgress,
  className,
}: ConsultationShellProps) {
  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      <div className="mx-auto w-full max-w-2xl px-4">
        <BrandHeader />
      </div>

      {!hideProgress && (
        <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto w-full max-w-2xl px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                Step {step} of {totalSteps} · {stepLabel}
              </p>
            </div>
            <ProgressBar value={step} max={totalSteps} />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32 pt-5">
        {onBack && (
          <div className="mb-4">
            <BackLink onClick={onBack} />
          </div>
        )}
        {children}
      </main>

      <footer className="sticky bottom-0 z-10 border-t border-border bg-background/90 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <p className="text-center text-xs text-muted-foreground">
            Takes about 3 minutes · Free no-obligation review
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ConsultationShell;

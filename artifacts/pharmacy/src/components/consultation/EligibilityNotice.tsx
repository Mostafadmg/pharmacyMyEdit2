import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EligibilityNoticeProps {
  title?: string;
  message: string;
  onContinueWithReview: () => void;
  onChangeAnswer: () => void;
  onSpeakToPharmacist?: () => void;
  pharmacistTel?: string;
  className?: string;
}

export function EligibilityNotice({
  title = "Let's get a pharmacist to look at this",
  message,
  onContinueWithReview,
  onChangeAnswer,
  onSpeakToPharmacist,
  pharmacistTel = "08000000000",
  className,
}: EligibilityNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[hsl(28_86%_49%/0.3)] bg-[hsl(28_86%_49%/0.08)] p-6",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(28_86%_49%/0.2)] text-[hsl(28_86%_35%)]">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onContinueWithReview}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors",
            "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          Continue — pharmacist will review
        </button>
        <button
          type="button"
          onClick={onChangeAnswer}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-2xl border-2 border-border bg-card px-4 text-sm font-medium text-foreground transition-colors",
            "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          Change my answer
        </button>
        {onSpeakToPharmacist ? (
          <button
            type="button"
            onClick={onSpeakToPharmacist}
            className="mt-1 text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Or speak to a pharmacist for free advice
          </button>
        ) : (
          <a
            href={`tel:${pharmacistTel}`}
            className="mt-1 text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Or speak to a pharmacist for free advice
          </a>
        )}
      </div>
    </div>
  );
}

export default EligibilityNotice;

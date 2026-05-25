import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ClinicalReviewSection } from "@/components/rx/ClinicalReviewSection";
import { cn } from "@/lib/utils";

export function GenericClinicalReviewSections({
  c,
  highlights,
  onOpenScr,
}: {
  c: Consultation;
  highlights: { label: string; value: string }[];
  onOpenScr: () => void;
}) {
  return (
    <>
      <ClinicalReviewSection
        step={2}
        theme="rose"
        id="cr-safety"
        icon={AlertTriangle}
        eyebrow="Step 2 · Safety"
        title="Clinical safety check"
        description="Confirm allergies, medicines, and red flags before prescribing."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-rx-cs-surface/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Allergies
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
              {c.allergies?.trim() || "None recorded"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="rx-label-caps">
              Current medicines
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
              {c.currentMedications?.trim() || "None recorded"}
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border p-4 sm:col-span-2",
              c.hasRedFlag
                ? "border-rx-decline-border bg-rx-decline-surface"
                : "border-border bg-muted/40/80",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Red flags
            </p>
            <p
              className={cn(
                "mt-2 text-sm font-semibold",
                c.hasRedFlag ? "text-rose-800" : "text-primary",
              )}
            >
              {c.hasRedFlag
                ? "Red flag raised — review consultation answers before approving."
                : "No red flags recorded for this order."}
            </p>
          </div>
        </div>
      </ClinicalReviewSection>

      <ClinicalReviewSection
        step={3}
        theme="sky"
        id="cr-clinical"
        icon={FileText}
        eyebrow="Step 3 · Condition"
        title="Key consultation answers"
        description={`Clinical answers for ${c.conditionName}. See the Consultation tab for the full questionnaire.`}
      >
        {highlights.length > 0 ? (
          <dl className="divide-y divide-stone-100 rounded-xl border border-border bg-muted/40/50">
            {highlights.map((row) => (
              <div
                key={row.label}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,38%)_1fr] sm:gap-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="text-sm font-medium leading-relaxed text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-xl border border-border bg-muted/40/80 p-4 text-sm text-muted-foreground">
            No additional condition-specific answers recorded. Open the{" "}
            <strong className="text-foreground">Consultation</strong> tab to review
            the full questionnaire.
          </p>
        )}
      </ClinicalReviewSection>

      <ClinicalReviewSection
        step={4}
        theme="amber"
        id="cr-scr"
        icon={ShieldCheck}
        eyebrow="Step 4 · External records"
        title="NHS Summary Care Record"
        description="Open SCR to confirm medicines, allergies and contraindications."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Required before marking clinical review complete — verify prescribed
            medicines and allergies match the consultation.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={onOpenScr}
            className="w-full shrink-0 rounded-xl bg-amber-700 text-white shadow-sm hover:bg-amber-800 sm:w-auto"
          >
            Go to NHS SCR
          </Button>
        </div>
      </ClinicalReviewSection>
    </>
  );
}

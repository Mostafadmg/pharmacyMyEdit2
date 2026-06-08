import { RadioRow } from "@/components/consultation";
import { TextareaField } from "@/components/consultation";
import type { YesNo } from "@/components/consultation";
import {
  WL_CHECKBOX_OFF,
  WL_CHECKBOX_ON,
  WL_CHECKLIST_SELECTED,
  WL_CHECKLIST_UNSELECTED,
  WL_DETAIL_PANEL,
} from "@/lib/consultationTheme";
import { cn } from "@/lib/utils";
import {
  WL_REPEAT_SIDE_EFFECT_SYMPTOMS,
  emptyRepeatSideEffectSymptoms,
  type RepeatSideEffectSymptomsMap,
  type WlRepeatSideEffectSymptomId,
} from "@workspace/evidence-slots";

export type SideEffectsSymptomSectionProps = {
  gateTitle: string;
  yesTitle?: string;
  noTitle?: string;
  idPrefix?: string;
  anySideEffects: YesNo | null;
  onAnySideEffectsChange: (v: YesNo) => void;
  symptoms: RepeatSideEffectSymptomsMap;
  onSymptomsChange: (next: RepeatSideEffectSymptomsMap) => void;
  details: string;
  onDetailsChange: (v: string) => void;
  /** When false, omits outer spacing wrapper (for embedding in another card). */
  standalone?: boolean;
};

export function SideEffectsSymptomSection({
  gateTitle,
  yesTitle = "Yes — I have had side effects",
  noTitle = "No side effects",
  idPrefix = "side-effects",
  anySideEffects,
  onAnySideEffectsChange,
  symptoms,
  onSymptomsChange,
  details,
  onDetailsChange,
  standalone = true,
}: SideEffectsSymptomSectionProps) {
  const toggleSymptom = (id: WlRepeatSideEffectSymptomId) => {
    const checked = symptoms[id] === "yes";
    onSymptomsChange({ ...symptoms, [id]: checked ? "no" : "yes" });
  };

  const content = (
    <div className={cn(WL_DETAIL_PANEL, "space-y-5")}>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-secondary">{gateTitle}</p>
        <RadioRow
          selected={anySideEffects === "yes"}
          onSelect={() => onAnySideEffectsChange("yes")}
          title={yesTitle}
          testId={`${idPrefix}-yes`}
        />
        <RadioRow
          selected={anySideEffects === "no"}
          onSelect={() => {
            onAnySideEffectsChange("no");
            onSymptomsChange(emptyRepeatSideEffectSymptoms());
            onDetailsChange("");
          }}
          title={noTitle}
          testId={`${idPrefix}-no`}
        />
      </div>

      {anySideEffects === "yes" && (
        <div className="space-y-4 border-t border-stone-200/90 pt-5">
          <p className="text-sm font-semibold text-secondary">
            Select the side effects you have had
          </p>
          <p className="text-sm text-muted-foreground -mt-2">
            Tick any that apply. Leave unchecked if you have not experienced them.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0">
            {WL_REPEAT_SIDE_EFFECT_SYMPTOMS.map((symptom) => {
              const checked = symptoms[symptom.id] === "yes";
              return (
                <li key={symptom.id}>
                  <button
                    type="button"
                    onClick={() => toggleSymptom(symptom.id)}
                    data-testid={`${idPrefix}-symptom-${symptom.id}`}
                    className={cn(
                      "flex h-full w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                      checked ? WL_CHECKLIST_SELECTED : WL_CHECKLIST_UNSELECTED,
                    )}
                  >
                    <span className="min-w-0 leading-snug">{symptom.label}</span>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                        checked ? WL_CHECKBOX_ON : WL_CHECKBOX_OFF,
                      )}
                      aria-hidden
                    >
                      {checked ? "✓" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            <TextareaField
              label="Anything else you'd like us to know? (optional)"
              value={details}
              onChange={onDetailsChange}
              placeholder="Tell us more about your side effects, when they started, or anything else that would help your pharmacist review your order"
            />
          </div>
        </div>
      )}
    </div>
  );

  if (!standalone) {
    return content;
  }

  return <div className="mt-2">{content}</div>;
}

/** Repeat-order defaults. */
export function RepeatSideEffectsSection(
  props: Omit<
    SideEffectsSymptomSectionProps,
    "gateTitle" | "idPrefix" | "standalone"
  >,
) {
  return (
    <SideEffectsSymptomSection
      gateTitle="Side effects since your last order *"
      idPrefix="repeat-side-effects"
      standalone
      {...props}
    />
  );
}

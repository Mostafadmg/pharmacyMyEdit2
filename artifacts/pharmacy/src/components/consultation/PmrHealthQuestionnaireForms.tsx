import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALCOHOL_BINGE_OPTIONS,
  ALCOHOL_FREQUENCY_OPTIONS,
  ALCOHOL_UNITS_OPTIONS,
  EXERCISE_INTENSITY_OPTIONS,
  EXERCISE_SESSIONS_OPTIONS,
  MEDICAL_HISTORY_CONDITIONS,
  PMR_MEDICAL_HISTORY_GATE_QUESTION,
  emptyMedicalHistoryDetail,
  emptyMedicalHistoryDetails,
  medicalHistoryGate,
  selectedMedicalHistoryConditions,
  type MedicalHistoryConditionDetail,
  type MedicalHistoryId,
  type PmrHealthFormSlice,
  type PmrYesNo,
} from "@/lib/pmrHealthQuestionnaire";
import { YesNoChoiceInline } from "@/components/consultation/WeightLossClinicalForms";
import {
  WL_CARD_INNER,
  WL_CHECKBOX_OFF,
  WL_CHECKBOX_ON,
  WL_CHECKLIST_SELECTED,
  WL_CHECKLIST_UNSELECTED,
  WL_BTN_DASHED,
  WL_CHIP_INFO,
  WL_DETAIL_PANEL,
  WL_DIVIDER,
  WL_OPTION_SELECTED,
  WL_OPTION_UNSELECTED,
  WL_SECTION_TITLE,
} from "@/lib/consultationTheme";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

function OptionList({
  options,
  value,
  onChange,
  testIdPrefix,
}: {
  options: readonly { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          data-testid={`${testIdPrefix}-${opt.value}`}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors",
            value === opt.value
              ? WL_OPTION_SELECTED
              : WL_OPTION_UNSELECTED,
          )}
        >
          <span className="font-semibold text-sm">{opt.label}</span>
          <span
            className={cn(
              "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
              value === opt.value
                ? "border-primary bg-primary"
                : "border-stone-300",
            )}
          >
            {value === opt.value && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function MedicalHistoryInfoList() {
  return (
    <ul
      className="flex flex-col gap-2 list-none p-0 m-0"
      data-testid="medical-history-info-list"
    >
      {MEDICAL_HISTORY_CONDITIONS.map((c) => (
        <li
          key={c.id}
          className={WL_CHIP_INFO}
        >
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function MedicalHistoryConditionFollowUp({
  conditionLabel,
  detail,
  onChange,
  testIdPrefix,
}: {
  conditionLabel: string;
  detail: MedicalHistoryConditionDetail;
  onChange: (next: MedicalHistoryConditionDetail) => void;
  testIdPrefix: string;
}) {
  const patch = (partial: Partial<MedicalHistoryConditionDetail>) =>
    onChange({ ...detail, ...partial });

  return (
    <div className={WL_DETAIL_PANEL}>
      <p className={cn("text-sm", WL_SECTION_TITLE)}>{conditionLabel}</p>
      <div>
        <Label className="font-semibold text-secondary">
          Do you take any medication for this condition? *
        </Label>
        <div className="mt-2">
          <YesNoChoiceInline
            value={detail.onMedication}
            onChange={(v) =>
              patch({
                onMedication: v,
                ...(v === "no"
                  ? { medications: [] }
                  : detail.medications.length === 0
                    ? { medications: [""] }
                    : {}),
              })
            }
            testIdPrefix={`${testIdPrefix}-med`}
          />
        </div>
      </div>
      {detail.onMedication === "yes" && (
        <div className="space-y-3">
          <Label className="font-semibold text-secondary">
            What medication do you take? *
          </Label>
          {detail.medications.map((name, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Input
                value={name}
                onChange={(e) =>
                  patch({
                    medications: detail.medications.map((m, i) =>
                      i === index ? e.target.value : m,
                    ),
                  })
                }
                placeholder={`Medication ${index + 1}`}
                className="h-12 rounded-xl flex-1"
                data-testid={`${testIdPrefix}-med-name-${index}`}
              />
              {detail.medications.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      medications: detail.medications.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                  className="mt-3 text-xs font-semibold text-rose-600 shrink-0"
                  aria-label="Remove medication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patch({ medications: [...detail.medications, ""] })
            }
            className={cn("h-10 rounded-xl text-sm", WL_BTN_DASHED)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add another medication
          </Button>
        </div>
      )}
    </div>
  );
}

/** Gate Yes/No, checklist when Yes, medication follow-up per selected condition. */
export function MedicalHistorySection({
  slice,
  onChange,
}: {
  slice: PmrHealthFormSlice;
  onChange: (next: PmrHealthFormSlice) => void;
}) {
  const gate = slice.medicalHistoryAny ?? medicalHistoryGate(slice);
  const selected = selectedMedicalHistoryConditions(slice);

  const setGate = (v: PmrYesNo) => {
    if (v === "no") {
      onChange({
        ...slice,
        medicalHistoryAny: "no",
        medicalHistory: Object.fromEntries(
          MEDICAL_HISTORY_CONDITIONS.map((c) => [c.id, null]),
        ) as PmrHealthFormSlice["medicalHistory"],
        medicalHistoryDetails: emptyMedicalHistoryDetails(),
      });
      return;
    }
    onChange({
      ...slice,
      medicalHistoryAny: "yes",
      medicalHistory: Object.fromEntries(
        MEDICAL_HISTORY_CONDITIONS.map((c) => [c.id, null]),
      ) as PmrHealthFormSlice["medicalHistory"],
    });
  };

  const toggleCondition = (id: MedicalHistoryId) => {
    if (slice.medicalHistory[id] === "yes") {
      onChange({
        ...slice,
        medicalHistory: { ...slice.medicalHistory, [id]: null },
        medicalHistoryDetails: {
          ...slice.medicalHistoryDetails,
          [id]: emptyMedicalHistoryDetail(),
        },
      });
      return;
    }
    onChange({
      ...slice,
      medicalHistory: { ...slice.medicalHistory, [id]: "yes" },
      medicalHistoryDetails: {
        ...slice.medicalHistoryDetails,
        [id]: emptyMedicalHistoryDetail(),
      },
    });
  };

  const patchDetail = (
    id: MedicalHistoryId,
    detail: MedicalHistoryConditionDetail,
  ) => {
    onChange({
      ...slice,
      medicalHistoryDetails: { ...slice.medicalHistoryDetails, [id]: detail },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(WL_SECTION_TITLE, "mb-3")}>
          {PMR_MEDICAL_HISTORY_GATE_QUESTION} *
        </p>
        <YesNoChoiceInline
          value={gate}
          onChange={setGate}
          testIdPrefix="medical-history-any"
        />
      </div>

      {gate !== "yes" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {gate === "no"
              ? "For your information, these are the conditions we ask about:"
              : "These are the conditions we ask about:"}
          </p>
          <MedicalHistoryInfoList />
        </div>
      )}

      {gate === "yes" && (
        <>
          <p className="text-sm text-muted-foreground">
            Select any conditions you have been diagnosed with.
          </p>
          <div className="flex flex-col gap-2">
            {MEDICAL_HISTORY_CONDITIONS.map((item) => {
              const checked = slice.medicalHistory[item.id] === "yes";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCondition(item.id)}
                  data-testid={`medical-history-any-item-${item.id}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                    checked ? WL_CHECKLIST_SELECTED : WL_CHECKLIST_UNSELECTED,
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                      checked ? WL_CHECKBOX_ON : WL_CHECKBOX_OFF,
                    )}
                  >
                    {checked ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className={cn("space-y-4", WL_DIVIDER)}>
              <p className={cn("text-sm", WL_SECTION_TITLE)}>
                Medication for each selected condition
              </p>
              {selected.map((condition) => (
                <MedicalHistoryConditionFollowUp
                  key={condition.id}
                  conditionLabel={condition.label}
                  detail={slice.medicalHistoryDetails[condition.id]}
                  onChange={(detail) => patchDetail(condition.id, detail)}
                  testIdPrefix={`med-history-${condition.id}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function PmrLifestyleQuestionnaire({
  slice,
  onChange,
}: {
  slice: PmrHealthFormSlice;
  onChange: (next: PmrHealthFormSlice) => void;
}) {
  const patch = (partial: Partial<PmrHealthFormSlice>) =>
    onChange({ ...slice, ...partial });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className={WL_SECTION_TITLE}>Smoking</p>
        <div>
          <p className="text-sm font-medium text-secondary mb-2">Do you smoke? *</p>
          <YesNoChoiceInline
            value={slice.smokes}
            onChange={(v) =>
              patch({
                smokes: v,
                ...(v === "yes"
                  ? { everSmoked: null, smokingYearStopped: "" }
                  : {}),
              })
            }
            testIdPrefix="smokes"
          />
        </div>
        {slice.smokes === "yes" && (
          <SmokingDetailFields
            cigsPerDay={slice.smokingCigsPerDay}
            yearStarted={slice.smokingYearStarted}
            showStopped={false}
            onCigs={(v) => patch({ smokingCigsPerDay: v })}
            onStarted={(v) => patch({ smokingYearStarted: v })}
          />
        )}
        {slice.smokes === "no" && (
          <>
            <div>
              <p className="text-sm font-medium text-secondary mb-2">
                Have you ever smoked? *
              </p>
              <YesNoChoiceInline
                value={slice.everSmoked}
                onChange={(v) =>
                  patch({
                    everSmoked: v,
                    ...(v === "no"
                      ? {
                          smokingCigsPerDay: "",
                          smokingYearStarted: "",
                          smokingYearStopped: "",
                        }
                      : {}),
                  })
                }
                testIdPrefix="everSmoked"
              />
            </div>
            {slice.everSmoked === "yes" && (
              <SmokingDetailFields
                cigsPerDay={slice.smokingCigsPerDay}
                yearStarted={slice.smokingYearStarted}
                yearStopped={slice.smokingYearStopped}
                showStopped
                onCigs={(v) => patch({ smokingCigsPerDay: v })}
                onStarted={(v) => patch({ smokingYearStarted: v })}
                onStopped={(v) => patch({ smokingYearStopped: v })}
              />
            )}
          </>
        )}
      </section>

      <section className={cn("space-y-4", WL_DIVIDER)}>
        <p className={WL_SECTION_TITLE}>Alcohol</p>
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            Do you drink alcohol? *
          </p>
          <YesNoChoiceInline
            value={slice.drinksAlcohol}
            onChange={(v) =>
              patch({
                drinksAlcohol: v,
                ...(v === "no"
                  ? {
                      alcoholFrequency: null,
                      alcoholUnitsTypicalDay: null,
                      alcoholBingeFrequency: null,
                    }
                  : {}),
              })
            }
            testIdPrefix="drinks-alcohol"
          />
        </div>
        {slice.drinksAlcohol === "yes" && (
          <>
            <p className={cn("text-sm", WL_SECTION_TITLE)}>AUDIT-C</p>
            <div>
              <p className="text-sm font-medium text-secondary mb-2">
                How often do you have a drink containing alcohol? *
              </p>
              <OptionList
                options={ALCOHOL_FREQUENCY_OPTIONS}
                value={slice.alcoholFrequency}
                onChange={(v) => patch({ alcoholFrequency: v })}
                testIdPrefix="alcohol-frequency"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary mb-2">
                How many units of alcohol do you drink on a typical day when drinking? *
              </p>
              <OptionList
                options={ALCOHOL_UNITS_OPTIONS}
                value={slice.alcoholUnitsTypicalDay}
                onChange={(v) => patch({ alcoholUnitsTypicalDay: v })}
                testIdPrefix="alcohol-units"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary mb-2">
                How often do you have six or more units on a single occasion? *
              </p>
              <OptionList
                options={ALCOHOL_BINGE_OPTIONS}
                value={slice.alcoholBingeFrequency}
                onChange={(v) => patch({ alcoholBingeFrequency: v })}
                testIdPrefix="alcohol-binge"
              />
            </div>
          </>
        )}
      </section>

      <section className={cn("space-y-4", WL_DIVIDER)}>
        <p className={WL_SECTION_TITLE}>Exercise</p>
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            How many times per week do you do at least 30 minutes of exercise? *
          </p>
          <OptionList
            options={EXERCISE_SESSIONS_OPTIONS}
            value={slice.exerciseSessionsPerWeek}
            onChange={(v) => patch({ exerciseSessionsPerWeek: v })}
            testIdPrefix="exercise-sessions"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            What is the usual intensity of your exercise? *
          </p>
          <OptionList
            options={EXERCISE_INTENSITY_OPTIONS}
            value={slice.exerciseIntensity}
            onChange={(v) => patch({ exerciseIntensity: v })}
            testIdPrefix="exercise-intensity"
          />
        </div>
      </section>
    </div>
  );
}

/** Medical history + lifestyle (high-risk meds use HighRiskMedicationsSection separately). */
export function PmrHealthQuestionnaireStep({
  slice,
  onChange,
}: {
  slice: PmrHealthFormSlice;
  onChange: (next: PmrHealthFormSlice) => void;
}) {
  return (
    <div className="space-y-5">
      <div className={WL_CARD_INNER}>
        <MedicalHistorySection slice={slice} onChange={onChange} />
      </div>
      <PmrLifestyleQuestionnaire slice={slice} onChange={onChange} />
    </div>
  );
}

function SmokingDetailFields({
  cigsPerDay,
  yearStarted,
  yearStopped = "",
  showStopped,
  onCigs,
  onStarted,
  onStopped,
}: {
  cigsPerDay: string;
  yearStarted: string;
  yearStopped?: string;
  showStopped: boolean;
  onCigs: (v: string) => void;
  onStarted: (v: string) => void;
  onStopped?: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="font-semibold text-secondary">
          How many cigarettes per day (on average)? *
        </Label>
        <Input
          type="number"
          min={0}
          value={cigsPerDay}
          onChange={(e) => onCigs(e.target.value)}
          placeholder="e.g. 10"
          className="h-12 mt-1.5 rounded-xl"
          data-testid="smoking-cigs-per-day"
        />
      </div>
      <div>
        <Label className="font-semibold text-secondary">Year started *</Label>
        <Input
          type="number"
          min={1950}
          max={new Date().getFullYear()}
          value={yearStarted}
          onChange={(e) => onStarted(e.target.value)}
          placeholder="e.g. 2010"
          className="h-12 mt-1.5 rounded-xl"
          data-testid="smoking-year-started"
        />
      </div>
      {showStopped && onStopped && (
        <div>
          <Label className="font-semibold text-secondary">Year stopped *</Label>
          <Input
            type="number"
            min={1950}
            max={new Date().getFullYear()}
            value={yearStopped}
            onChange={(e) => onStopped(e.target.value)}
            placeholder="e.g. 2020"
            className="h-12 mt-1.5 rounded-xl"
            data-testid="smoking-year-stopped"
          />
        </div>
      )}
    </div>
  );
}

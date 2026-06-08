import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PMR_MEDICAL_HISTORY_GATE_QUESTION,
  PMR_MEDICAL_HISTORY_INTRO,
  WL_TYPE2_DIABETES_LISTED_MED_CLASSES,
  WL_TYPE2_DIABETES_LISTED_MED_QUESTION,
  WL_TYPE2_DIABETES_OTHER_MED_QUESTION,
  type WlType2DiabetesListedMedId,
} from "@workspace/evidence-slots";
import {
  MEDICAL_HISTORY_CONDITIONS,
  emptyMedicalHistoryDetail,
  emptyMedicalHistoryDetailsFor,
  type MedicalHistoryConditionDetail,
  type PmrHealthFormSlice,
  type PmrYesNo,
} from "@/lib/pmrHealthQuestionnaire";
import { YesNoChoiceInline } from "@/components/consultation/WeightLossClinicalForms";
import {
  WL_CHECKBOX_OFF,
  WL_CHECKBOX_ON,
  WL_CHECKLIST_SELECTED,
  WL_CHECKLIST_UNSELECTED,
  WL_BTN_DASHED,
  WL_CHIP_INFO,
  WL_DETAIL_PANEL,
  WL_DIVIDER,
  WL_SECTION_TITLE,
} from "@/lib/consultationTheme";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

function MedicalHistoryInfoList({
  conditions,
}: {
  conditions: readonly { id: string; label: string }[];
}) {
  return (
    <ul
      className="flex flex-col gap-2 list-none p-0 m-0"
      data-testid="medical-history-info-list"
    >
      {conditions.map((c) => (
        <li key={c.id} className={WL_CHIP_INFO}>
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function MedicationNamesFields({
  gateQuestion,
  onMedication,
  medications,
  onChange,
  testIdPrefix,
}: {
  gateQuestion: string;
  onMedication: PmrYesNo | null;
  medications: string[];
  onChange: (patch: {
    onMedication: PmrYesNo | null;
    medications: string[];
  }) => void;
  testIdPrefix: string;
}) {
  return (
    <>
      <div>
        <Label className="font-semibold text-secondary">{gateQuestion} *</Label>
        <div className="mt-2">
          <YesNoChoiceInline
            value={onMedication}
            onChange={(v) =>
              onChange({
                onMedication: v,
                medications:
                  v === "no"
                    ? []
                    : medications.length === 0
                      ? [""]
                      : medications,
              })
            }
            testIdPrefix={testIdPrefix}
          />
        </div>
      </div>
      {onMedication === "yes" && (
        <div className="space-y-3">
          <Label className="font-semibold text-secondary">
            What medication do you take? *
          </Label>
          {medications.map((name, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Input
                value={name}
                onChange={(e) =>
                  onChange({
                    onMedication,
                    medications: medications.map((m, i) =>
                      i === index ? e.target.value : m,
                    ),
                  })
                }
                placeholder={`Medication ${index + 1}`}
                className="h-12 rounded-xl flex-1"
                data-testid={`${testIdPrefix}-name-${index}`}
              />
              {medications.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      onMedication,
                      medications: medications.filter((_, i) => i !== index),
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
              onChange({
                onMedication,
                medications: [...medications, ""],
              })
            }
            className={cn("h-10 rounded-xl text-sm", WL_BTN_DASHED)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add another medication
          </Button>
        </div>
      )}
    </>
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
  return (
    <div className={WL_DETAIL_PANEL}>
      <p className={cn("text-sm", WL_SECTION_TITLE)}>{conditionLabel}</p>
      <MedicationNamesFields
        gateQuestion="Do you take any medication for this condition?"
        onMedication={detail.onMedication}
        medications={detail.medications}
        onChange={({ onMedication, medications }) =>
          onChange({ ...detail, onMedication, medications })
        }
        testIdPrefix={`${testIdPrefix}-med`}
      />
    </div>
  );
}

function Type2DiabetesMedsInfoList() {
  return (
    <div className="space-y-3" data-testid="type2-diabetes-meds-info">
      {WL_TYPE2_DIABETES_LISTED_MED_CLASSES.map((group) => (
        <div key={group.id} className="space-y-2">
          <p className="text-sm font-semibold text-secondary">{group.label}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0">
            {group.meds.map((med) => (
              <li key={med.id} className={WL_CHIP_INFO}>
                {med.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Type2DiabetesFollowUp({
  detail,
  onChange,
  testIdPrefix,
}: {
  detail: MedicalHistoryConditionDetail;
  onChange: (next: MedicalHistoryConditionDetail) => void;
  testIdPrefix: string;
}) {
  const patch = (partial: Partial<MedicalHistoryConditionDetail>) =>
    onChange({ ...detail, ...partial });

  const toggleMed = (id: WlType2DiabetesListedMedId) => {
    const selected = detail.listedMeds.includes(id);
    patch({
      listedMeds: selected
        ? detail.listedMeds.filter((m) => m !== id)
        : [...detail.listedMeds, id],
    });
  };

  return (
    <div className={WL_DETAIL_PANEL}>
      <p className={cn("text-sm", WL_SECTION_TITLE)}>Type 2 diabetes</p>
      <div>
        <Label className="font-semibold text-secondary">
          {WL_TYPE2_DIABETES_LISTED_MED_QUESTION} *
        </Label>
        <div className="mt-2">
          <YesNoChoiceInline
            value={detail.takesListedMeds}
            onChange={(v) =>
              patch({
                takesListedMeds: v,
                ...(v === "no" ? { listedMeds: [] } : {}),
              })
            }
            testIdPrefix={`${testIdPrefix}-listed-meds`}
          />
        </div>
        {detail.takesListedMeds !== "yes" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              These are the medications we ask about:
            </p>
            <Type2DiabetesMedsInfoList />
          </div>
        )}
      </div>

      {detail.takesListedMeds === "yes" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select any medications you take from the list below.
          </p>
          {WL_TYPE2_DIABETES_LISTED_MED_CLASSES.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-sm font-semibold text-secondary">{group.label}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0">
                {group.meds.map((med) => {
                  const checked = detail.listedMeds.includes(med.id);
                  return (
                    <li key={med.id}>
                      <button
                        type="button"
                        onClick={() => toggleMed(med.id)}
                        data-testid={`${testIdPrefix}-med-${med.id}`}
                        className={cn(
                          "flex h-full w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                          checked ? WL_CHECKLIST_SELECTED : WL_CHECKLIST_UNSELECTED,
                        )}
                      >
                        <span className="min-w-0 leading-snug">{med.label}</span>
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
            </div>
          ))}
        </div>
      )}

      <div className={cn("space-y-4", WL_DIVIDER)}>
        <MedicationNamesFields
          gateQuestion={WL_TYPE2_DIABETES_OTHER_MED_QUESTION}
          onMedication={detail.onMedication}
          medications={detail.medications}
          onChange={({ onMedication, medications }) =>
            onChange({ ...detail, onMedication, medications })
          }
          testIdPrefix={`${testIdPrefix}-other-med`}
        />
      </div>
    </div>
  );
}

/** Gate Yes/No, checklist when Yes, medication follow-up per selected condition. */
export type MedicalHistoryCatalogueSlice = {
  medicalHistoryAny: PmrYesNo | null;
  medicalHistory: Record<string, PmrYesNo | null>;
  medicalHistoryDetails: Record<string, MedicalHistoryConditionDetail>;
};

export function medicalHistoryGateForCatalogue(
  slice: MedicalHistoryCatalogueSlice,
  conditions: readonly { id: string }[],
): PmrYesNo | null {
  if (slice.medicalHistoryAny != null) return slice.medicalHistoryAny;
  const values = conditions.map((c) => slice.medicalHistory[c.id]);
  if (values.every((v) => v === "no")) return "no";
  if (values.some((v) => v === "yes")) return "yes";
  return null;
}

export function selectedMedicalHistoryConditionsForCatalogue<
  T extends { id: string; label: string },
>(slice: MedicalHistoryCatalogueSlice, conditions: readonly T[]): T[] {
  return conditions.filter((c) => slice.medicalHistory[c.id] === "yes");
}

export function MedicalHistorySection<T extends MedicalHistoryCatalogueSlice>({
  slice,
  onChange,
  conditions = MEDICAL_HISTORY_CONDITIONS,
  intro = PMR_MEDICAL_HISTORY_INTRO,
  gateQuestion = PMR_MEDICAL_HISTORY_GATE_QUESTION,
}: {
  slice: T;
  onChange: (next: T) => void;
  conditions?: readonly { id: string; label: string }[];
  intro?: string;
  gateQuestion?: string;
}) {
  const gate =
    slice.medicalHistoryAny ?? medicalHistoryGateForCatalogue(slice, conditions);
  const selected = selectedMedicalHistoryConditionsForCatalogue(
    slice,
    conditions,
  );

  const setGate = (v: PmrYesNo) => {
    if (v === "no") {
      onChange({
        ...slice,
        medicalHistoryAny: "no",
        medicalHistory: Object.fromEntries(
          conditions.map((c) => [c.id, null]),
        ),
        medicalHistoryDetails: emptyMedicalHistoryDetailsFor(conditions),
      });
      return;
    }
    onChange({
      ...slice,
      medicalHistoryAny: "yes",
      medicalHistory: Object.fromEntries(
        conditions.map((c) => [c.id, null]),
      ),
    });
  };

  const toggleCondition = (id: string) => {
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

  const patchDetail = (id: string, detail: MedicalHistoryConditionDetail) => {
    onChange({
      ...slice,
      medicalHistoryDetails: { ...slice.medicalHistoryDetails, [id]: detail },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {intro}
        </p>
        <p className={cn(WL_SECTION_TITLE, "mb-3")}>{gateQuestion} *</p>
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
          <MedicalHistoryInfoList conditions={conditions} />
        </div>
      )}

      {gate === "yes" && (
        <>
          <p className="text-sm text-muted-foreground">
            Select any conditions you have been diagnosed with.
          </p>
          <div className="flex flex-col gap-2">
            {conditions.map((item) => {
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
              {selected.map((condition) =>
                condition.id === "type2_diabetes" ? (
                  <Type2DiabetesFollowUp
                    key={condition.id}
                    detail={slice.medicalHistoryDetails[condition.id]}
                    onChange={(detail) => patchDetail(condition.id, detail)}
                    testIdPrefix={`med-history-${condition.id}`}
                  />
                ) : (
                  <MedicalHistoryConditionFollowUp
                    key={condition.id}
                    conditionLabel={condition.label}
                    detail={slice.medicalHistoryDetails[condition.id]}
                    onChange={(detail) => patchDetail(condition.id, detail)}
                    testIdPrefix={`med-history-${condition.id}`}
                  />
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React from "react";
import {
  WL_EXCLUDING_CONDITIONS,
  WL_EXCLUDING_CONDITIONS_GATE_QUESTION,
  WL_CHOLECYSTECTOMY_TIMING_OPTIONS,
  WL_GALLBLADDER_CHOLECYSTECTOMY_QUESTION,
  WL_GALLBLADDER_SURGERY_DATE_LABEL,
  WL_GALLBLADDER_SURGERY_TIMING_QUESTION,
  WL_BARIATRIC_SURGERY_DATE_LABEL,
  WL_BARIATRIC_SURGERY_TIMING_QUESTION,
  WL_SURGERY_TIMING_INSTRUCTION,
  WL_CANCER_DETAILS_QUESTION,
  isWlExcludingConditionBariatricTiming,
  isWlExcludingConditionCancerDetails,
  isWlExcludingConditionCholecystectomyTiming,
  isWlExcludingConditionNoFollowUp,
  isWlExcludingConditionWithFollowUp,
  wlTwelveMonthTimingFromDate,
  type RepeatSideEffectSymptomsMap,
} from "@workspace/evidence-slots";
import { SideEffectsSymptomSection } from "@/components/consultation/RepeatSideEffectsSection";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/consultation/DateField";
import { MonthYearField } from "@/components/consultation/MonthYearField";
import { GatedChecklistSection, GroupedChecklistInfoList } from "@/components/consultation/GatedChecklistSection";
import {
  WL_BTN_DASHED,
  WL_CHIP_INFO,
  WL_CHECKLIST_SELECTED,
  WL_DETAIL_PANEL,
  WL_OPTION_SELECTED,
  WL_OPTION_UNSELECTED,
  WL_SECTION_TITLE,
  WL_YESNO_SELECTED,
  WL_YESNO_UNSELECTED,
} from "@/lib/consultationTheme";
import { cn } from "@/lib/utils";
import {
  TRANSFER_HIGH_RISK_QUESTION,
  WL_HIGH_RISK_MEDICATIONS,
  WL_HIGH_RISK_STOPPED_PAST_THREE_MONTHS_QUESTION,
  type TransferHighRiskMedId,
} from "@/lib/weightLossHighRiskMeds";

export type YesNo = "yes" | "no";

export type LastInjectionTiming =
  | "exact_date"
  | "less_than_4_weeks"
  | "4_to_8_weeks"
  | "2_to_3_months"
  | "3_to_6_months"
  | "more_than_6_months";

export const LAST_INJECTION_OPTIONS: { id: LastInjectionTiming; label: string }[] = [
  { id: "exact_date", label: "I remember the date" },
  { id: "less_than_4_weeks", label: "Less than 4 weeks ago" },
  { id: "4_to_8_weeks", label: "Between 4–8 weeks ago" },
  { id: "2_to_3_months", label: "Between 2–3 months ago" },
  { id: "3_to_6_months", label: "Between 3–6 months ago" },
  { id: "more_than_6_months", label: "More than 6 months ago" },
];

export type ConditionMedicationEntry = {
  id: string;
  name: string;
};

export type DiagnosedConditionEntry = {
  id: string;
  /** When picked from the excluding-conditions checklist. */
  catalogueId?: string;
  condition: string;
  howLongHad: string;
  /** Gallbladder issues — had cholecystectomy? */
  hadCholecystectomy?: YesNo | null;
  /** Bariatric surgery — optional exact procedure date (ISO). */
  procedureDate?: string;
  /** Cancer — free-text details for prescriber review. */
  conditionDetails?: string;
  onMedication: YesNo | null;
  medications: ConditionMedicationEntry[];
};

export type CurrentMedicationEntry = {
  id: string;
  medication: string;
  reason: string;
  forCondition: string;
};

export type OtherHealthEntry = {
  id: string;
  condition: string;
  howLongAgo: string;
  outcome: string;
};

export function newEntryId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyConditionMedication(): ConditionMedicationEntry {
  return { id: newEntryId(), name: "" };
}

export function emptyDiagnosedEntry(catalogue?: {
  id: string;
  label: string;
}): DiagnosedConditionEntry {
  return {
    id: newEntryId(),
    catalogueId: catalogue?.id,
    condition: catalogue?.label ?? "",
    howLongHad: "",
    hadCholecystectomy: null,
    procedureDate: "",
    conditionDetails: "",
    onMedication: null,
    medications: [],
  };
}

export function emptyMedicationEntry(): CurrentMedicationEntry {
  return { id: newEntryId(), medication: "", reason: "", forCondition: "" };
}

export function emptyHealthEntry(): OtherHealthEntry {
  return { id: newEntryId(), condition: "", howLongAgo: "", outcome: "" };
}

/** Transfer / continuation dose — medication name + strength (legacy rows may include dosage/frequency). */
export type TransferMedicationEntry = {
  id: string;
  medication: string;
  strength: string;
  dosage?: string;
  frequency?: string;
};

export function emptyTransferMedicationEntry(): TransferMedicationEntry {
  return {
    id: newEntryId(),
    medication: "",
    strength: "",
  };
}

export function isTransferMedicationEntryComplete(
  e: TransferMedicationEntry,
): boolean {
  return Boolean(e.medication.trim() && e.strength.trim());
}

/** Injectable WL products for transfer / continuation dose (matches plan pen catalog). */
export type TransferWlProduct = "wegovy" | "mounjaro";

export type TransferWlPenOption = {
  id: string;
  medicine: TransferWlProduct;
  label: string;
  dose: string;
};

export const TRANSFER_WL_PEN_OPTIONS: TransferWlPenOption[] = [
  { id: "mounjaro-2_5", medicine: "mounjaro", label: "Mounjaro 2.5 mg", dose: "2.5 mg" },
  { id: "mounjaro-5", medicine: "mounjaro", label: "Mounjaro 5 mg", dose: "5 mg" },
  { id: "mounjaro-7_5", medicine: "mounjaro", label: "Mounjaro 7.5 mg", dose: "7.5 mg" },
  { id: "mounjaro-10", medicine: "mounjaro", label: "Mounjaro 10 mg", dose: "10 mg" },
  { id: "mounjaro-12_5", medicine: "mounjaro", label: "Mounjaro 12.5 mg", dose: "12.5 mg" },
  { id: "mounjaro-15", medicine: "mounjaro", label: "Mounjaro 15 mg", dose: "15 mg" },
  { id: "wegovy-0_25", medicine: "wegovy", label: "Wegovy 0.25 mg", dose: "0.25 mg" },
  { id: "wegovy-0_5", medicine: "wegovy", label: "Wegovy 0.5 mg", dose: "0.5 mg" },
  { id: "wegovy-1_0", medicine: "wegovy", label: "Wegovy 1 mg", dose: "1 mg" },
  { id: "wegovy-1_7", medicine: "wegovy", label: "Wegovy 1.7 mg", dose: "1.7 mg" },
  { id: "wegovy-2_4", medicine: "wegovy", label: "Wegovy 2.4 mg", dose: "2.4 mg" },
  { id: "wegovy-7_2", medicine: "wegovy", label: "Wegovy 7.2 mg", dose: "7.2 mg" },
];

const TRANSFER_WL_PRODUCT_LABELS: Record<TransferWlProduct, string> = {
  mounjaro: "Mounjaro",
  wegovy: "Wegovy",
};

export type TransferWeightLossMedicationValue = {
  product: TransferWlProduct | null;
  strengthPenId: string;
  lastInjectionDate: string;
  firstTreatmentWeightUnit: "kg" | "stlbs";
  firstTreatmentWeightKg: string;
  firstTreatmentWeightSt: string;
  firstTreatmentWeightLbs: string;
  firstTreatmentStartDate: string;
};

export function emptyTransferWeightLossMedication(): TransferWeightLossMedicationValue {
  return {
    product: null,
    strengthPenId: "",
    lastInjectionDate: "",
    firstTreatmentWeightUnit: "kg",
    firstTreatmentWeightKg: "",
    firstTreatmentWeightSt: "",
    firstTreatmentWeightLbs: "",
    firstTreatmentStartDate: "",
  };
}

export function transferWlFirstTreatmentWeightKg(
  v: TransferWeightLossMedicationValue,
): number | null {
  if (v.firstTreatmentWeightUnit === "kg") {
    const kg = parseFloat(v.firstTreatmentWeightKg);
    return Number.isFinite(kg) && kg > 0 ? kg : null;
  }
  const st = parseFloat(v.firstTreatmentWeightSt || "0");
  const lbs = parseFloat(v.firstTreatmentWeightLbs || "0");
  if (!st && !lbs) return null;
  const kg = st * 6.35029 + lbs * 0.453592;
  return kg > 0 ? Math.round(kg * 10) / 10 : null;
}

function isTransferWlFirstTreatmentWeightComplete(
  v: TransferWeightLossMedicationValue,
): boolean {
  return transferWlFirstTreatmentWeightKg(v) !== null;
}

export function isTransferWlMedicationCoreComplete(
  v: TransferWeightLossMedicationValue,
): boolean {
  if (!v.product || !v.strengthPenId || !(v.lastInjectionDate ?? "").trim()) {
    return false;
  }
  return TRANSFER_WL_PEN_OPTIONS.some(
    (p) => p.id === v.strengthPenId && p.medicine === v.product,
  );
}

export function isTransferWeightLossMedicationComplete(
  v: TransferWeightLossMedicationValue,
): boolean {
  if (!isTransferWlMedicationCoreComplete(v)) return false;
  return (
    (v.firstTreatmentStartDate ?? "").trim().length > 0 &&
    isTransferWlFirstTreatmentWeightComplete(v)
  );
}

export function transferWlMedicationToDetailsRow(
  v: TransferWeightLossMedicationValue,
): TransferMedicationEntry | null {
  if (!isTransferWlMedicationCoreComplete(v)) return null;
  const pen = TRANSFER_WL_PEN_OPTIONS.find((p) => p.id === v.strengthPenId);
  if (!pen || !v.product) return null;
  return {
    id: newEntryId(),
    medication: TRANSFER_WL_PRODUCT_LABELS[v.product],
    strength: pen.dose,
    dosage: v.lastInjectionDate.trim(),
  };
}

const durationInputClass = "h-12 mt-1.5 rounded-xl";

type YesNoChoiceProps = {
  value: YesNo | null;
  onChange: (v: YesNo) => void;
  testIdPrefix: string;
};

export function YesNoChoiceInline({
  value,
  onChange,
  testIdPrefix,
}: YesNoChoiceProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {(["yes", "no"] as YesNo[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          data-testid={`${testIdPrefix}-${v}`}
          className={cn(
            "h-12 rounded-xl font-semibold text-sm border transition-colors",
            value === v
              ? WL_YESNO_SELECTED
              : WL_YESNO_UNSELECTED,
          )}
        >
          {v === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function TwelveMonthSurgeryTimingFields({
  entry,
  onUpdate,
  timingQuestion,
  dateLabel,
  testIdPrefix,
}: {
  entry: DiagnosedConditionEntry;
  onUpdate: (patch: Partial<DiagnosedConditionEntry>) => void;
  timingQuestion: string;
  dateLabel: string;
  testIdPrefix: string;
}) {
  return (
    <>
      <div>
        <Label className="font-semibold text-secondary">{timingQuestion} *</Label>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {WL_SURGERY_TIMING_INSTRUCTION}
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {WL_CHOLECYSTECTOMY_TIMING_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onUpdate({ howLongHad: option.id })}
              data-testid={`${testIdPrefix}-timing-${entry.id}-${option.id}`}
              className={cn(
                "min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                entry.howLongHad === option.id
                  ? WL_YESNO_SELECTED
                  : WL_YESNO_UNSELECTED,
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <MonthYearField
        label={dateLabel}
        value={entry.procedureDate ?? ""}
        onChange={(monthYear) => {
          const timing = monthYear ? wlTwelveMonthTimingFromDate(monthYear) : null;
          onUpdate({
            procedureDate: monthYear,
            ...(timing ? { howLongHad: timing } : {}),
          });
        }}
        testIdPrefix={`${testIdPrefix}-procedure`}
      />
    </>
  );
}

function AddAnotherButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn("w-full h-11 rounded-xl", WL_BTN_DASHED)}
    >
      <Plus className="w-4 h-4 mr-1.5" />
      {label}
    </Button>
  );
}

export function DiagnosedConditionsFollowUp({
  entries,
  onChange,
}: {
  entries: DiagnosedConditionEntry[];
  onChange: (entries: DiagnosedConditionEntry[]) => void;
}) {
  const update = (id: string, patch: Partial<DiagnosedConditionEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const showConditionField = (entry: DiagnosedConditionEntry) =>
    !entry.catalogueId;

  const entriesNeedingTiming = entries.filter((entry) =>
    isWlExcludingConditionCholecystectomyTiming(entry.catalogueId),
  );

  const entriesNeedingBariatricTiming = entries.filter((entry) =>
    isWlExcludingConditionBariatricTiming(entry.catalogueId),
  );

  const entriesNeedingCancerDetails = entries.filter((entry) =>
    isWlExcludingConditionCancerDetails(entry.catalogueId),
  );

  const entriesNeedingFollowUp = entries.filter((entry) =>
    isWlExcludingConditionWithFollowUp(entry.catalogueId),
  );

  if (
    entriesNeedingTiming.length === 0 &&
    entriesNeedingBariatricTiming.length === 0 &&
    entriesNeedingCancerDetails.length === 0 &&
    entriesNeedingFollowUp.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-5 space-y-5 border-t border-stone-200/90 pt-4">
      <p className="text-sm font-semibold text-secondary">
        Details for each selected condition
      </p>
      {entriesNeedingTiming.map((entry) => (
        <div key={entry.id} className={WL_DETAIL_PANEL}>
          {!showConditionField(entry) ? (
            <p className={cn("text-sm", WL_SECTION_TITLE)}>{entry.condition}</p>
          ) : null}
          <div>
            <Label className="font-semibold text-secondary">
              {WL_GALLBLADDER_CHOLECYSTECTOMY_QUESTION} *
            </Label>
            <div className="mt-2">
              <YesNoChoiceInline
                value={entry.hadCholecystectomy ?? null}
                onChange={(v) =>
                  update(entry.id, {
                    hadCholecystectomy: v,
                    ...(v === "no"
                      ? { howLongHad: "", procedureDate: "" }
                      : {}),
                  })
                }
                testIdPrefix={`cholecystectomy-had-${entry.id}`}
              />
            </div>
          </div>
          {entry.hadCholecystectomy === "yes" ? (
            <TwelveMonthSurgeryTimingFields
              entry={entry}
              onUpdate={(patch) => update(entry.id, patch)}
              timingQuestion={WL_GALLBLADDER_SURGERY_TIMING_QUESTION}
              dateLabel={WL_GALLBLADDER_SURGERY_DATE_LABEL}
              testIdPrefix="cholecystectomy"
            />
          ) : null}
        </div>
      ))}
      {entriesNeedingBariatricTiming.map((entry) => (
        <div key={entry.id} className={WL_DETAIL_PANEL}>
          {!showConditionField(entry) ? (
            <p className={cn("text-sm", WL_SECTION_TITLE)}>{entry.condition}</p>
          ) : null}
          <TwelveMonthSurgeryTimingFields
            entry={entry}
            onUpdate={(patch) => update(entry.id, patch)}
            timingQuestion={WL_BARIATRIC_SURGERY_TIMING_QUESTION}
            dateLabel={WL_BARIATRIC_SURGERY_DATE_LABEL}
            testIdPrefix="bariatric"
          />
        </div>
      ))}
      {entriesNeedingCancerDetails.map((entry) => (
        <div key={entry.id} className={WL_DETAIL_PANEL}>
          {!showConditionField(entry) ? (
            <p className={cn("text-sm", WL_SECTION_TITLE)}>{entry.condition}</p>
          ) : null}
          <div>
            <Label className="font-semibold text-secondary">
              {WL_CANCER_DETAILS_QUESTION} *
            </Label>
            <Textarea
              value={entry.conditionDetails ?? ""}
              onChange={(e) =>
                update(entry.id, { conditionDetails: e.target.value })
              }
              placeholder={WL_CANCER_DETAILS_QUESTION}
              className="mt-1.5 min-h-[120px] rounded-xl resize-y"
              data-testid={`cancer-details-${entry.id}`}
            />
          </div>
        </div>
      ))}
      {entriesNeedingFollowUp.map((entry) => (
        <div
          key={entry.id}
          className={WL_DETAIL_PANEL}
        >
          {!showConditionField(entry) ? (
            <p className={cn("text-sm", WL_SECTION_TITLE)}>{entry.condition}</p>
          ) : (
            <div>
              <Label className="font-semibold text-secondary">
                What were you diagnosed with? *
              </Label>
              <Input
                value={entry.condition}
                onChange={(e) => update(entry.id, { condition: e.target.value })}
                placeholder="Describe your condition"
                className="h-12 mt-1.5 rounded-xl"
              />
            </div>
          )}
          <div>
            <Label className="font-semibold text-secondary">
              How long ago were you diagnosed with it? *
            </Label>
            <Input
              value={entry.howLongHad}
              onChange={(e) =>
                update(entry.id, { howLongHad: e.target.value })
              }
              placeholder="e.g. About 5 years ago"
              className={durationInputClass}
            />
          </div>
          <div>
            <Label className="font-semibold text-secondary">
              Do you take any medication? *
            </Label>
            <div className="mt-2">
              <YesNoChoiceInline
                value={entry.onMedication}
                onChange={(v) =>
                  update(entry.id, {
                    onMedication: v,
                    ...(v === "no"
                      ? { medications: [] }
                      : entry.medications.length === 0
                        ? { medications: [emptyConditionMedication()] }
                        : {}),
                  })
                }
                testIdPrefix={`diag-med-${entry.id}`}
              />
            </div>
          </div>
          {entry.onMedication === "yes" && (
            <div className="space-y-3">
              <Label className="font-semibold text-secondary">
                Medications for this condition *
              </Label>
              {entry.medications.map((med, medIndex) => (
                <div key={med.id} className="flex gap-2 items-start">
                  <Input
                    value={med.name}
                    onChange={(e) =>
                      update(entry.id, {
                        medications: entry.medications.map((m) =>
                          m.id === med.id
                            ? { ...m, name: e.target.value }
                            : m,
                        ),
                      })
                    }
                    placeholder={`Medication ${medIndex + 1}`}
                    className="h-12 rounded-xl flex-1"
                  />
                  {entry.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        update(entry.id, {
                          medications: entry.medications.filter(
                            (m) => m.id !== med.id,
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
                  update(entry.id, {
                    medications: [
                      ...entry.medications,
                      emptyConditionMedication(),
                    ],
                  })
                }
                className={cn("h-10 rounded-xl text-sm", WL_BTN_DASHED)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add another medication
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CurrentMedicationsFollowUp({
  entries,
  onChange,
}: {
  entries: CurrentMedicationEntry[];
  onChange: (entries: CurrentMedicationEntry[]) => void;
}) {
  const update = (id: string, patch: Partial<CurrentMedicationEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  return (
    <div className="mt-5 space-y-5 border-t border-stone-100 pt-5">
      <p className="text-sm font-semibold text-secondary">
        List each medication you take
      </p>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={WL_DETAIL_PANEL}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Medication {index + 1}
            </p>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(entries.filter((e) => e.id !== entry.id))}
                className="text-xs font-semibold text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
          <div>
            <Label className="font-semibold text-secondary">
              What do you take? *
            </Label>
            <Input
              value={entry.medication}
              onChange={(e) => update(entry.id, { medication: e.target.value })}
              placeholder="Medication name"
              className="h-12 mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label className="font-semibold text-secondary">
              Why do you take it / for what condition? *
            </Label>
            <Input
              value={entry.forCondition}
              onChange={(e) => update(entry.id, { forCondition: e.target.value })}
              placeholder="e.g. High blood pressure"
              className="h-12 mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label className="font-semibold text-secondary">
              Additional notes (optional)
            </Label>
            <Input
              value={entry.reason}
              onChange={(e) => update(entry.id, { reason: e.target.value })}
              placeholder="e.g. Once daily in the morning"
              className="h-12 mt-1.5 rounded-xl"
            />
          </div>
        </div>
      ))}
      <AddAnotherButton
        label="Add another medication"
        onClick={() => onChange([...entries, emptyMedicationEntry()])}
      />
    </div>
  );
}

export function OtherHealthHistoryFollowUp({
  entries,
  onChange,
}: {
  entries: OtherHealthEntry[];
  onChange: (entries: OtherHealthEntry[]) => void;
}) {
  const update = (id: string, patch: Partial<OtherHealthEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  return (
    <div className="mt-5 space-y-5 border-t border-stone-100 pt-5">
      <p className="text-sm font-semibold text-secondary">
        Tell us about each health condition
      </p>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={WL_DETAIL_PANEL}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Condition {index + 1}
            </p>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(entries.filter((e) => e.id !== entry.id))}
                className="text-xs font-semibold text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
          <div>
            <Label className="font-semibold text-secondary">
              What is it? *
            </Label>
            <Input
              value={entry.condition}
              onChange={(e) => update(entry.id, { condition: e.target.value })}
              placeholder="Condition name"
              className="h-12 mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label className="font-semibold text-secondary">
              How long ago did you have it? *
            </Label>
            <Input
              value={entry.howLongAgo}
              onChange={(e) =>
                update(entry.id, { howLongAgo: e.target.value })
              }
              placeholder="e.g. About 2 years ago"
              className={durationInputClass}
            />
          </div>
          <div>
            <Label className="font-semibold text-secondary">
              What was the outcome? *
            </Label>
            <Input
              value={entry.outcome}
              onChange={(e) => update(entry.id, { outcome: e.target.value })}
              placeholder="e.g. Resolved with treatment, ongoing monitoring"
              className="h-12 mt-1.5 rounded-xl"
            />
          </div>
        </div>
      ))}
      <AddAnotherButton
        label="Add another health condition"
        onClick={() => onChange([...entries, emptyHealthEntry()])}
      />
    </div>
  );
}

type RadioRowProps = {
  selected: boolean;
  onSelect: () => void;
  title: string;
  testId?: string;
};

function RadioRow({ selected, onSelect, title, testId }: RadioRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={testId}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors",
        selected
          ? WL_OPTION_SELECTED
          : WL_OPTION_UNSELECTED,
      )}
    >
      <span className="font-semibold text-sm">{title}</span>
      <span
        className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
          selected ? "border-primary bg-primary" : "border-stone-300",
        )}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

export function InjectablesFollowUp({
  changingProvider,
  onChangingProvider,
  lastInjectionTiming,
  onLastInjectionTiming,
  lastInjectionDate,
  onLastInjectionDate,
  showLastInjection = true,
}: {
  changingProvider: YesNo | null;
  onChangingProvider: (v: YesNo) => void;
  lastInjectionTiming: LastInjectionTiming | null;
  onLastInjectionTiming: (v: LastInjectionTiming) => void;
  lastInjectionDate: string;
  onLastInjectionDate: (v: string) => void;
  /** Transfer flow collects last injection on the WL medication picker instead. */
  showLastInjection?: boolean;
}) {
  return (
    <div className="mt-5 space-y-5 border-t border-stone-100 pt-5">
      <div>
        <p className="font-semibold text-secondary mb-2">
          Are you changing from a different provider? *
        </p>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          This means you have already been receiving weight-loss injections (for
          example Mounjaro or Wegovy) from another clinic or pharmacy, and you want
          to continue treatment with us. Choose Yes if that applies — even if this
          is your first order here.
        </p>
        <YesNoChoiceInline
          value={changingProvider}
          onChange={onChangingProvider}
          testIdPrefix="changingProvider"
        />
        {changingProvider === "yes" && (
          <p className="text-xs text-secondary mt-2 bg-muted/60 rounded-lg px-3 py-2">
            We&apos;ll treat you as a transfer patient. You may be asked for your
            previous prescription or pen label later.
          </p>
        )}
      </div>

      {showLastInjection && (
        <div>
          <p className="font-semibold text-secondary mb-3">
            When was your last injection? *
          </p>
          <div className="space-y-2">
            {LAST_INJECTION_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.id}
                selected={lastInjectionTiming === opt.id}
                onSelect={() => onLastInjectionTiming(opt.id)}
                title={opt.label}
                testId={`last-injection-${opt.id}`}
              />
            ))}
          </div>
          {lastInjectionTiming === "exact_date" && (
            <div className="mt-4">
              <DateField
                label="Date of last injection *"
                value={lastInjectionDate}
                onChange={onLastInjectionDate}
                max={new Date().toISOString().slice(0, 10)}
                min="2020-01-01"
                placeholder="Select date"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function isDiagnosedEntryComplete(e: DiagnosedConditionEntry): boolean {
  if (isWlExcludingConditionNoFollowUp(e.catalogueId)) {
    return Boolean(e.condition.trim());
  }
  if (isWlExcludingConditionCholecystectomyTiming(e.catalogueId)) {
    if (!Boolean(e.condition.trim())) return false;
    if (e.hadCholecystectomy === null || e.hadCholecystectomy === undefined) {
      return false;
    }
    if (e.hadCholecystectomy === "no") return true;
    return WL_CHOLECYSTECTOMY_TIMING_OPTIONS.some((o) => o.id === e.howLongHad);
  }
  if (isWlExcludingConditionBariatricTiming(e.catalogueId)) {
    return (
      Boolean(e.condition.trim()) &&
      WL_CHOLECYSTECTOMY_TIMING_OPTIONS.some((o) => o.id === e.howLongHad)
    );
  }
  if (isWlExcludingConditionCancerDetails(e.catalogueId)) {
    return Boolean(e.condition.trim()) && Boolean(e.conditionDetails?.trim());
  }
  if (!e.condition.trim() || !e.howLongHad.trim()) {
    return false;
  }
  if (e.onMedication === null) return false;
  if (
    e.onMedication === "yes" &&
    !e.medications.some((m) => m.name.trim())
  ) {
    return false;
  }
  return true;
}

export function isMedicationEntryComplete(e: CurrentMedicationEntry): boolean {
  return Boolean(e.medication.trim() && e.forCondition.trim());
}

export function isHealthEntryComplete(e: OtherHealthEntry): boolean {
  return Boolean(
    e.condition.trim() && e.howLongAgo.trim() && e.outcome.trim(),
  );
}

export function isLastInjectionComplete(
  timing: LastInjectionTiming | null,
  exactDate: string,
): boolean {
  if (!timing) return false;
  if (timing === "exact_date") return Boolean(exactDate);
  return true;
}

export const EXCLUDING_CONDITIONS = WL_EXCLUDING_CONDITIONS;

export type ExcludingConditionId = (typeof EXCLUDING_CONDITIONS)[number]["id"];

export const EXCLUDING_CONDITIONS_ITEMS = EXCLUDING_CONDITIONS.map(
  (c) => c.label,
);

const EXCLUDING_CONDITIONS_GATE_QUESTION = WL_EXCLUDING_CONDITIONS_GATE_QUESTION;

export function isExcludingConditionNoFollowUp(
  catalogueId: string | undefined,
): boolean {
  return isWlExcludingConditionNoFollowUp(catalogueId);
}

/** Derive legacy yes/no history answers from the excluding-conditions checklist. */
export function historyAnswerFromExcludingConditions(
  gate: YesNo | null,
  entries: DiagnosedConditionEntry[],
  catalogueId: ExcludingConditionId,
): YesNo | null {
  if (gate === null) return null;
  if (gate === "no") return "no";
  return entries.some((e) => e.catalogueId === catalogueId) ? "yes" : "no";
}


export function ExcludingConditionsSection({
  excludingConditions,
  onExcludingConditionsChange,
  diagnosedConditions,
  onDiagnosedConditionsChange,
  conditions = EXCLUDING_CONDITIONS,
  gateQuestion = EXCLUDING_CONDITIONS_GATE_QUESTION,
  checkboxOnly = false,
  infoHeading = "These are the conditions we ask about:",
  infoHeadingWhenNo = "For your information, these are the conditions we ask about:",
  selectHint = "Select any conditions you have been diagnosed with or had surgery for.",
}: {
  excludingConditions: YesNo | null;
  onExcludingConditionsChange: (v: YesNo) => void;
  diagnosedConditions: DiagnosedConditionEntry[];
  onDiagnosedConditionsChange: (entries: DiagnosedConditionEntry[]) => void;
  conditions?: readonly { id: string; label: string }[];
  gateQuestion?: string;
  /** When true, checklist only — no diagnosed-when / medication follow-up. */
  checkboxOnly?: boolean;
  infoHeading?: string;
  infoHeadingWhenNo?: string;
  selectHint?: string;
}) {
  const checklistItems = conditions.map((c) => ({
    id: c.id,
    label: c.label,
  }));

  const toggleCondition = (catalogueId: string) => {
    if (diagnosedConditions.some((e) => e.catalogueId === catalogueId)) {
      onDiagnosedConditionsChange(
        diagnosedConditions.filter((e) => e.catalogueId !== catalogueId),
      );
      return;
    }
    const catalogue = conditions.find((c) => c.id === catalogueId);
    if (!catalogue) return;
    onDiagnosedConditionsChange([
      ...diagnosedConditions,
      emptyDiagnosedEntry(catalogue),
    ]);
  };

  return (
    <div className="space-y-6">
      <GatedChecklistSection
        gateQuestion={`${gateQuestion} *`}
        gateValue={excludingConditions}
        onGateChange={(v) => {
          onExcludingConditionsChange(v);
          if (v === "no") {
            onDiagnosedConditionsChange([]);
          }
        }}
        items={checklistItems}
        isSelected={(id) =>
          diagnosedConditions.some((e) => e.catalogueId === id)
        }
        onToggle={toggleCondition}
        infoHeading={infoHeading}
        infoHeadingWhenNo={infoHeadingWhenNo}
        selectHint={selectHint}
        testIdPrefix="excludingConditions"
        renderInfoList={() => (
          <GroupedChecklistInfoList
            items={checklistItems}
            testIdPrefix="excluding-conditions-info-list"
          />
        )}
      />

      {excludingConditions === "yes" &&
        diagnosedConditions.some(
          (e) => !isWlExcludingConditionNoFollowUp(e.catalogueId),
        ) && (
          <DiagnosedConditionsFollowUp
            entries={diagnosedConditions}
            onChange={onDiagnosedConditionsChange}
          />
        )}
    </div>
  );
}

export function isExcludingConditionsStepComplete(
  excludingConditions: YesNo | null,
  diagnosedConditions: DiagnosedConditionEntry[],
  options?: { checkboxOnly?: boolean },
): boolean {
  if (excludingConditions === null) {
    return false;
  }
  if (excludingConditions === "yes") {
    if (diagnosedConditions.length === 0) return false;
    return diagnosedConditions.every(isDiagnosedEntryComplete);
  }
  return true;
}

export function TransferOtherMedicalConditionsSection({
  hasConditions,
  onHasConditionsChange,
  conditionsDetails,
  onConditionsDetailsChange,
  takesMedications,
  onTakesMedicationsChange,
  medicationNames,
  onMedicationNamesChange,
}: {
  hasConditions: YesNo | null;
  onHasConditionsChange: (v: YesNo) => void;
  conditionsDetails: string;
  onConditionsDetailsChange: (v: string) => void;
  takesMedications: YesNo | null;
  onTakesMedicationsChange: (v: YesNo) => void;
  medicationNames: string;
  onMedicationNamesChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-semibold text-secondary">
        Do you have any other medical conditions? *
      </p>
      <YesNoChoiceInline
        value={hasConditions}
        onChange={onHasConditionsChange}
        testIdPrefix="transferOtherConditions"
      />
      {hasConditions === "yes" && (
        <div className="space-y-4 pt-1">
          <div>
            <Label className="font-semibold text-secondary">
              What conditions? *
            </Label>
            <Textarea
              value={conditionsDetails}
              onChange={(e) => onConditionsDetailsChange(e.target.value)}
              placeholder="e.g. Hypothyroidism, high blood pressure"
              rows={3}
              className="mt-1.5 rounded-xl resize-y min-h-[88px]"
              data-testid="transferOtherConditions-detail"
            />
          </div>
          <div>
            <p className="font-semibold text-secondary mb-2">
              Do you take any medications for this condition? *
            </p>
            <YesNoChoiceInline
              value={takesMedications}
              onChange={(v) => {
                onTakesMedicationsChange(v);
                if (v === "no") onMedicationNamesChange("");
              }}
              testIdPrefix="transferOtherConditionsMeds"
            />
          </div>
          {takesMedications === "yes" && (
            <div>
              <Label className="font-semibold text-secondary">
                Medication names (no strength, dose, or frequency) *
              </Label>
              <Input
                value={medicationNames}
                onChange={(e) => onMedicationNamesChange(e.target.value)}
                placeholder="e.g. Levothyroxine, amlodipine"
                className="h-12 mt-1.5 rounded-xl"
                data-testid="transferOtherConditionsMeds-detail"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function isTransferOtherMedicalConditionsComplete(
  hasConditions: YesNo | null,
  conditionsDetails: string,
  takesMedications: YesNo | null,
  medicationNames: string,
): boolean {
  if (hasConditions === null) return false;
  if (hasConditions === "no") return true;
  if (!conditionsDetails.trim()) return false;
  if (takesMedications === null) return false;
  if (takesMedications === "no") return true;
  return medicationNames.trim().length > 0;
}

function WeightUnitSlidingToggle({
  value,
  onChange,
  testIdPrefix,
}: {
  value: "kg" | "stlbs";
  onChange: (unit: "kg" | "stlbs") => void;
  testIdPrefix: string;
}) {
  const toggle = () => onChange(value === "kg" ? "stlbs" : "kg");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value === "stlbs"}
      aria-label={`Weight unit: ${value === "kg" ? "kilograms" : "stone and pounds"}. Click to switch.`}
      onClick={toggle}
      className="relative mt-1.5 mb-2 grid w-full max-w-xs grid-cols-2 rounded-xl border border-stone-200 bg-stone-100 p-1"
      data-testid={`${testIdPrefix}-toggle`}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-primary shadow-sm transition-transform duration-200 ease-out",
          value === "stlbs" && "translate-x-full",
        )}
      />
      <span
        className={cn(
          "relative z-10 flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
          value === "kg" ? "text-primary-foreground" : "text-stone-600",
        )}
        data-testid={`${testIdPrefix}-kg`}
      >
        kg
      </span>
      <span
        className={cn(
          "relative z-10 flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
          value === "stlbs" ? "text-primary-foreground" : "text-stone-600",
        )}
        data-testid={`${testIdPrefix}-stlbs`}
      >
        st/lbs
      </span>
    </button>
  );
}

export function TransferWeightLossMedicationPicker({
  value,
  onChange,
}: {
  value: TransferWeightLossMedicationValue;
  onChange: (value: TransferWeightLossMedicationValue) => void;
}) {
  const strengthOptions = value.product
    ? TRANSFER_WL_PEN_OPTIONS.filter((p) => p.medicine === value.product)
    : [];

  const selectProduct = (product: TransferWlProduct) => {
    onChange({
      ...value,
      product,
      strengthPenId: "",
    });
  };

  return (
    <div className="space-y-5" data-testid="transfer-wl-medication-picker">
      <div>
        <p className="font-semibold text-secondary mb-3">Choose your product *</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["mounjaro", "wegovy"] as TransferWlProduct[]).map((product) => {
            const selected = value.product === product;
            const subtitle =
              product === "mounjaro"
                ? "Tirzepatide · weekly injection"
                : "Semaglutide · weekly injection";
            return (
              <button
                key={product}
                type="button"
                onClick={() => selectProduct(product)}
                data-testid={`transfer-wl-product-${product}`}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  selected
                    ? WL_CHECKLIST_SELECTED
                    : "bg-white border-stone-200 text-stone-800 hover:border-stone-300",
                )}
              >
                <p className="font-bold text-base">
                  {TRANSFER_WL_PRODUCT_LABELS[product]}
                </p>
                <p className="text-sm mt-1 opacity-80">{subtitle}</p>
                <span
                  className={cn(
                    "mt-3 inline-flex w-5 h-5 rounded-full border-2 items-center justify-center",
                    selected ? "border-primary bg-primary" : "border-stone-300",
                  )}
                >
                  {selected && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {value.product && (
        <div className={cn(WL_DETAIL_PANEL, "space-y-5")}>
          <div>
            <p className="font-semibold text-secondary mb-3">Which strength? *</p>
            <div className="flex flex-wrap gap-2">
              {strengthOptions.map((pen) => {
                const selected = value.strengthPenId === pen.id;
                return (
                  <button
                    key={pen.id}
                    type="button"
                    onClick={() =>
                      onChange({ ...value, strengthPenId: pen.id })
                    }
                    data-testid={`transfer-wl-strength-${pen.id}`}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors",
                      selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-white border-stone-200 text-stone-800 hover:border-stone-300",
                    )}
                  >
                    {pen.dose}
                  </button>
                );
              })}
            </div>
          </div>

          <DateField
            label="When was (or would be) your last injection of this strength? *"
            value={value.lastInjectionDate}
            onChange={(lastInjectionDate) =>
              onChange({ ...value, lastInjectionDate })
            }
            max={new Date().toISOString().slice(0, 10)}
            min="2020-01-01"
            placeholder="Select last injection date"
          />

          <div>
            <Label className="font-semibold text-secondary">
              What was your weight when you started your first GLP-1 weight-loss
              injection? *
            </Label>
            <WeightUnitSlidingToggle
              value={value.firstTreatmentWeightUnit}
              onChange={(firstTreatmentWeightUnit) =>
                onChange({ ...value, firstTreatmentWeightUnit })
              }
              testIdPrefix="transfer-wl-first-weight-unit"
            />
            {value.firstTreatmentWeightUnit === "kg" ? (
              <Input
                type="number"
                placeholder="kg"
                value={value.firstTreatmentWeightKg}
                onChange={(e) =>
                  onChange({ ...value, firstTreatmentWeightKg: e.target.value })
                }
                className="h-12 rounded-xl"
                data-testid="transfer-wl-first-weight-kg"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="st"
                  value={value.firstTreatmentWeightSt}
                  onChange={(e) =>
                    onChange({ ...value, firstTreatmentWeightSt: e.target.value })
                  }
                  className="h-12 rounded-xl"
                  data-testid="transfer-wl-first-weight-st"
                />
                <Input
                  type="number"
                  placeholder="lbs"
                  value={value.firstTreatmentWeightLbs}
                  onChange={(e) =>
                    onChange({ ...value, firstTreatmentWeightLbs: e.target.value })
                  }
                  className="h-12 rounded-xl"
                  data-testid="transfer-wl-first-weight-lbs"
                />
              </div>
            )}
          </div>

          <DateField
            label="When did you start your first GLP-1 weight-loss injection? *"
            value={value.firstTreatmentStartDate}
            onChange={(firstTreatmentStartDate) =>
              onChange({ ...value, firstTreatmentStartDate })
            }
            max={new Date().toISOString().slice(0, 10)}
            min="2010-01-01"
            placeholder="Select start date"
          />
        </div>
      )}
    </div>
  );
}

/** @deprecated Use TransferWeightLossMedicationPicker for transfer WL medication. */
export function TransferCurrentMedicationsTable({
  entries,
  onChange,
}: {
  entries: TransferMedicationEntry[];
  onChange: (entries: TransferMedicationEntry[]) => void;
}) {
  const update = (id: string, patch: Partial<TransferMedicationEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  return (
    <div className="space-y-5">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={WL_DETAIL_PANEL}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Medication {index + 1}
            </p>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(entries.filter((e) => e.id !== entry.id))}
                className="text-xs font-semibold text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="font-semibold text-secondary">Medication name *</Label>
              <Input
                value={entry.medication}
                onChange={(e) => update(entry.id, { medication: e.target.value })}
                placeholder="e.g. Mounjaro, Wegovy"
                className="h-12 mt-1.5 rounded-xl"
                data-testid={`transfer-med-medication-${index}`}
              />
            </div>
            <div>
              <Label className="font-semibold text-secondary">Strength *</Label>
              <Input
                value={entry.strength}
                onChange={(e) => update(entry.id, { strength: e.target.value })}
                placeholder="e.g. 2.5 mg"
                className="h-12 mt-1.5 rounded-xl"
                data-testid={`transfer-med-strength-${index}`}
              />
            </div>
          </div>
        </div>
      ))}
      <AddAnotherButton
        label="Add another medication"
        onClick={() => onChange([...entries, emptyTransferMedicationEntry()])}
      />
    </div>
  );
}

export function HighRiskMedicationsSection({
  taken,
  onTakenChange,
  selected,
  onSelectedChange,
  stoppedPastThreeMonths,
  onStoppedPastThreeMonthsChange,
  gateQuestion = TRANSFER_HIGH_RISK_QUESTION,
  stoppedPastThreeMonthsQuestion = WL_HIGH_RISK_STOPPED_PAST_THREE_MONTHS_QUESTION,
  medications = WL_HIGH_RISK_MEDICATIONS,
  infoHeading = "These are the medications we ask about:",
  infoHeadingWhenNo = "For your information, these are the medications we ask about:",
  exclusiveNoneId,
}: {
  taken: YesNo | null;
  onTakenChange: (v: YesNo) => void;
  selected: readonly string[];
  onSelectedChange: (ids: string[]) => void;
  stoppedPastThreeMonths: YesNo | null;
  onStoppedPastThreeMonthsChange: (v: YesNo | null) => void;
  gateQuestion?: string;
  stoppedPastThreeMonthsQuestion?: string;
  medications?: readonly { id: string; label: string; section?: string }[];
  infoHeading?: string;
  infoHeadingWhenNo?: string;
  /** When set, selecting this id clears other selections and vice versa. */
  exclusiveNoneId?: string;
}) {
  const toggle = (id: string) => {
    if (exclusiveNoneId && id === exclusiveNoneId) {
      onSelectedChange(selected.includes(id) ? [] : [id]);
      return;
    }
    if (exclusiveNoneId) {
      const withoutNone = selected.filter((x) => x !== exclusiveNoneId);
      onSelectedChange(
        withoutNone.includes(id)
          ? withoutNone.filter((x) => x !== id)
          : [...withoutNone, id],
      );
      return;
    }
    onSelectedChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  };

  const checklistItems = medications.map((m) => ({
    id: m.id,
    label: m.label,
    section: m.section,
  }));

  const infoList = () => (
    <GroupedChecklistInfoList
      items={
        exclusiveNoneId
          ? checklistItems.filter((item) => item.id !== exclusiveNoneId)
          : checklistItems
      }
      testIdPrefix="high-risk-meds-info-list"
    />
  );

  return (
    <div className="space-y-4">
      <GatedChecklistSection
        gateQuestion={`${gateQuestion} *`}
        gateValue={taken}
        onGateChange={(v) => {
          onTakenChange(v);
          if (v === "yes") {
            onStoppedPastThreeMonthsChange(null);
          } else {
            onSelectedChange([]);
          }
        }}
        items={checklistItems}
        isSelected={(id) => selected.includes(id)}
        onToggle={toggle}
        infoHeading={infoHeading}
        infoHeadingWhenNo={infoHeadingWhenNo}
        selectHint="Select any that apply."
        testIdPrefix="high-risk-meds-taken"
        renderInfoList={infoList}
        renderAfterGateWhenNo={() => (
          <div>
            <p className={cn(WL_SECTION_TITLE, "mb-3")}>
              {stoppedPastThreeMonthsQuestion} *
            </p>
            <YesNoChoiceInline
              value={stoppedPastThreeMonths}
              onChange={onStoppedPastThreeMonthsChange}
              testIdPrefix="high-risk-meds-stopped-past-three-months"
            />
          </div>
        )}
      />
    </div>
  );
}

type TransferYesNoDetailProps = {
  question: string;
  value: YesNo | null;
  onChange: (v: YesNo) => void;
  detailValue: string;
  onDetailChange: (v: string) => void;
  detailLabel: string;
  detailPlaceholder: string;
  testIdPrefix: string;
};

export function TransferYesNoWithDetail({
  question,
  value,
  onChange,
  detailValue,
  onDetailChange,
  detailLabel,
  detailPlaceholder,
  testIdPrefix,
}: TransferYesNoDetailProps) {
  return (
    <div className="space-y-3">
      <p className="font-semibold text-secondary">{question}</p>
      <YesNoChoiceInline
        value={value}
        onChange={onChange}
        testIdPrefix={testIdPrefix}
      />
      {value === "yes" && (
        <div>
          <Label className="font-semibold text-secondary">{detailLabel} *</Label>
          <Textarea
            value={detailValue}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={detailPlaceholder}
            rows={3}
            className="mt-1.5 rounded-xl resize-y min-h-[88px]"
            data-testid={`${testIdPrefix}-detail`}
          />
        </div>
      )}
    </div>
  );
}

/** Side effects, hospitalisation, and changes since last review — transfer + repeat continuation. */
export function WlContinuationSafetySection({
  sideEffects,
  onSideEffectsChange,
  sideEffectSymptoms,
  onSideEffectSymptomsChange,
  sideEffectsDetails,
  onSideEffectsDetailsChange,
  hospitalised,
  onHospitalisedChange,
  hospitalisationDetails,
  onHospitalisationDetailsChange,
  changesSinceReview,
  onChangesSinceReviewChange,
  changesSinceReviewDetails,
  onChangesSinceReviewDetailsChange,
  showSideEffects = true,
  showChangesSinceReview = true,
}: {
  sideEffects: YesNo | null;
  onSideEffectsChange: (v: YesNo) => void;
  sideEffectSymptoms: RepeatSideEffectSymptomsMap;
  onSideEffectSymptomsChange: (next: RepeatSideEffectSymptomsMap) => void;
  sideEffectsDetails: string;
  onSideEffectsDetailsChange: (v: string) => void;
  hospitalised: YesNo | null;
  onHospitalisedChange: (v: YesNo) => void;
  hospitalisationDetails: string;
  onHospitalisationDetailsChange: (v: string) => void;
  changesSinceReview: YesNo | null;
  onChangesSinceReviewChange: (v: YesNo) => void;
  changesSinceReviewDetails: string;
  onChangesSinceReviewDetailsChange: (v: string) => void;
  showSideEffects?: boolean;
  showChangesSinceReview?: boolean;
}) {
  return (
    <div className="space-y-5" data-testid="wl-continuation-safety">
      {showChangesSinceReview && (
        <TransferYesNoWithDetail
          question="Has anything changed since your last review or treatment? *"
          value={changesSinceReview}
          onChange={(v) => {
            onChangesSinceReviewChange(v);
            if (v === "no") onChangesSinceReviewDetailsChange("");
          }}
          detailValue={changesSinceReviewDetails}
          onDetailChange={onChangesSinceReviewDetailsChange}
          detailLabel="Please describe what has changed"
          detailPlaceholder="e.g. New diagnosis, stopped a medicine, change in dose"
          testIdPrefix="continuationChangesSinceReview"
        />
      )}
      {showSideEffects && (
        <SideEffectsSymptomSection
          gateTitle="Have you experienced any side effects from your weight-loss medication? *"
          idPrefix="transfer-side-effects"
          standalone={false}
          anySideEffects={sideEffects}
          onAnySideEffectsChange={(v) => {
            onSideEffectsChange(v);
            if (v === "no") {
              onSideEffectsDetailsChange("");
            }
          }}
          symptoms={sideEffectSymptoms}
          onSymptomsChange={onSideEffectSymptomsChange}
          details={sideEffectsDetails}
          onDetailsChange={onSideEffectsDetailsChange}
        />
      )}
      <TransferYesNoWithDetail
        question="Have you been hospitalised due to weight loss medication? *"
        value={hospitalised}
        onChange={(v) => {
          onHospitalisedChange(v);
          if (v === "no") onHospitalisationDetailsChange("");
        }}
        detailValue={hospitalisationDetails}
        onDetailChange={onHospitalisationDetailsChange}
        detailLabel="What happened and what was the outcome?"
        detailPlaceholder="e.g. Admitted for severe vomiting — discharged after 2 days, no ongoing issues"
        testIdPrefix="continuationHospitalisation"
      />
    </div>
  );
}

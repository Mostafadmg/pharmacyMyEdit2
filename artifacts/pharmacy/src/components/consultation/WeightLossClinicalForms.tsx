import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/consultation/DateField";
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
  TRANSFER_HIGH_RISK_MED_LABELS,
  TRANSFER_HIGH_RISK_QUESTION,
  WL_HIGH_RISK_MEDICATIONS,
  type HighRiskMedDetail,
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
    condition:
      catalogue?.id === "other" ? "" : (catalogue?.label ?? ""),
    howLongHad: "",
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
};

export function emptyTransferWeightLossMedication(): TransferWeightLossMedicationValue {
  return { product: null, strengthPenId: "", lastInjectionDate: "" };
}

export function isTransferWeightLossMedicationComplete(
  v: TransferWeightLossMedicationValue,
): boolean {
  if (!v.product || !v.strengthPenId || !v.lastInjectionDate.trim()) {
    return false;
  }
  return TRANSFER_WL_PEN_OPTIONS.some(
    (p) => p.id === v.strengthPenId && p.medicine === v.product,
  );
}

export function transferWlMedicationToDetailsRow(
  v: TransferWeightLossMedicationValue,
): TransferMedicationEntry | null {
  if (!isTransferWeightLossMedicationComplete(v)) return null;
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
    !entry.catalogueId || entry.catalogueId === "other";

  return (
    <div className="mt-5 space-y-5 border-t border-stone-200/90 pt-4">
      <p className="text-sm font-semibold text-secondary">
        Details for each selected condition
      </p>
      {entries.map((entry) => (
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

export const EXCLUDING_CONDITIONS = [
  { id: "pancreatitis", label: "Pancreatitis" },
  { id: "gallstones_gallbladder", label: "Gallstones or gallbladder problems" },
  {
    id: "inflammatory_bowel_disease",
    label: "Inflammatory bowel disease (Crohn's, ulcerative colitis)",
  },
  {
    id: "gastroparesis",
    label: "Gastroparesis or delayed stomach emptying",
  },
  { id: "chronic_malabsorption", label: "Chronic malabsorption" },
  { id: "bariatric_gastric_surgery", label: "Bariatric or gastric surgery" },
  { id: "liver_disease", label: "Liver disease" },
  { id: "kidney_disease", label: "Kidney disease" },
  { id: "type1_diabetes", label: "Type 1 Diabetes" },
  { id: "diabetic_retinopathy", label: "Diabetic eye disease (retinopathy)" },
  { id: "heart_disease_rhythm", label: "Heart disease or rhythm issues" },
  { id: "cancer", label: "Cancer" },
  {
    id: "serious_hospitalisation",
    label: "Serious condition needing hospitalisation",
  },
  { id: "other", label: "Other condition not listed above" },
] as const;

export type ExcludingConditionId = (typeof EXCLUDING_CONDITIONS)[number]["id"];

export const EXCLUDING_CONDITIONS_ITEMS = EXCLUDING_CONDITIONS.map(
  (c) => c.label,
);

const EXCLUDING_CONDITIONS_GATE_QUESTION =
  "Have you been diagnosed with or had surgery for any of the following?";

function isExcludingConditionSelected(
  entries: DiagnosedConditionEntry[],
  catalogueId: ExcludingConditionId,
): boolean {
  return entries.some((e) => e.catalogueId === catalogueId);
}

export function ExcludingConditionsSection({
  excludingConditions,
  onExcludingConditionsChange,
  diagnosedConditions,
  onDiagnosedConditionsChange,
}: {
  excludingConditions: YesNo | null;
  onExcludingConditionsChange: (v: YesNo) => void;
  diagnosedConditions: DiagnosedConditionEntry[];
  onDiagnosedConditionsChange: (entries: DiagnosedConditionEntry[]) => void;
}) {
  const checklistItems = EXCLUDING_CONDITIONS.map((c) => ({
    id: c.id,
    label: c.label,
  }));

  const toggleCondition = (catalogueId: ExcludingConditionId) => {
    if (isExcludingConditionSelected(diagnosedConditions, catalogueId)) {
      onDiagnosedConditionsChange(
        diagnosedConditions.filter((e) => e.catalogueId !== catalogueId),
      );
      return;
    }
    const catalogue = EXCLUDING_CONDITIONS.find((c) => c.id === catalogueId);
    if (!catalogue) return;
    onDiagnosedConditionsChange([
      ...diagnosedConditions,
      emptyDiagnosedEntry(catalogue),
    ]);
  };

  return (
    <div className="space-y-6">
      <GatedChecklistSection
        gateQuestion={`${EXCLUDING_CONDITIONS_GATE_QUESTION} *`}
        gateValue={excludingConditions}
        onGateChange={(v) => {
          onExcludingConditionsChange(v);
          if (v === "no") {
            onDiagnosedConditionsChange([]);
          }
        }}
        items={checklistItems}
        isSelected={(id) =>
          isExcludingConditionSelected(
            diagnosedConditions,
            id as ExcludingConditionId,
          )
        }
        onToggle={(id) => toggleCondition(id as ExcludingConditionId)}
        infoHeading="These are the conditions we ask about:"
        infoHeadingWhenNo="For your information, these are the conditions we ask about:"
        selectHint="Select any conditions you have been diagnosed with or had surgery for."
        testIdPrefix="excludingConditions"
        renderInfoList={() => (
          <GroupedChecklistInfoList
            items={checklistItems}
            testIdPrefix="excluding-conditions-info-list"
          />
        )}
      />

      {excludingConditions === "yes" && diagnosedConditions.length > 0 && (
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
): boolean {
  if (excludingConditions === null) {
    return false;
  }
  if (excludingConditions === "yes") {
    return (
      diagnosedConditions.length > 0 &&
      diagnosedConditions.every(isDiagnosedEntryComplete)
    );
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
      product,
      strengthPenId: "",
      lastInjectionDate: value.lastInjectionDate,
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

function HighRiskMedicationsInfoList() {
  const items = WL_HIGH_RISK_MEDICATIONS.map((m) => ({
    id: m.id,
    label: m.label,
    section: m.section,
  }));
  return (
    <GroupedChecklistInfoList
      items={items}
      testIdPrefix="high-risk-meds-info-list"
    />
  );
}

export function HighRiskMedicationsSection({
  taken,
  onTakenChange,
  selected,
  onSelectedChange,
  details,
  onDetailsChange,
}: {
  taken: YesNo | null;
  onTakenChange: (v: YesNo) => void;
  selected: TransferHighRiskMedId[];
  onSelectedChange: (ids: TransferHighRiskMedId[]) => void;
  details: HighRiskMedDetail[];
  onDetailsChange: (details: HighRiskMedDetail[]) => void;
}) {
  const toggle = (id: TransferHighRiskMedId) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onSelectedChange(next);
    const detailById = new Map(details.map((d) => [d.medId, d]));
    onDetailsChange(
      next.map(
        (medId) =>
          detailById.get(medId) ?? {
            medId,
            name: "",
            condition: "",
            duration: "",
          },
      ),
    );
  };

  const updateDetail = (
    medId: TransferHighRiskMedId,
    patch: Partial<HighRiskMedDetail>,
  ) => {
    onDetailsChange(
      details.map((d) => (d.medId === medId ? { ...d, ...patch } : d)),
    );
  };

  const checklistItems = WL_HIGH_RISK_MEDICATIONS.map((m) => ({
    id: m.id,
    label: m.label,
    section: m.section,
  }));

  return (
    <div className="space-y-4">
      <GatedChecklistSection
        gateQuestion={`${TRANSFER_HIGH_RISK_QUESTION} *`}
        gateValue={taken}
        onGateChange={onTakenChange}
        items={checklistItems}
        isSelected={(id) => selected.includes(id as TransferHighRiskMedId)}
        onToggle={(id) => toggle(id as TransferHighRiskMedId)}
        infoHeading="These are the medications we ask about:"
        infoHeadingWhenNo="For your information, these are the medications we ask about:"
        selectHint="Select any that apply. For each one selected, we will ask for a few more details."
        testIdPrefix="high-risk-meds-taken"
        renderInfoList={() => <HighRiskMedicationsInfoList />}
      />

      {taken === "yes" && selected.length > 0 && (
        <div className="space-y-4 border-t border-stone-200/90 pt-4">
          {selected.map((medId) => {
            const row =
              details.find((d) => d.medId === medId) ?? {
                medId,
                name: "",
                condition: "",
                duration: "",
              };
            return (
              <div
                key={medId}
                className={WL_DETAIL_PANEL}
              >
                <p className="text-sm font-bold text-secondary">
                  {TRANSFER_HIGH_RISK_MED_LABELS[medId]}
                </p>
                <div>
                  <Label className="font-semibold text-secondary">
                    What condition do you take it for? *
                  </Label>
                  <Input
                    value={row.condition}
                    onChange={(e) =>
                      updateDetail(medId, { condition: e.target.value })
                    }
                    placeholder="e.g. Atrial fibrillation"
                    className="h-12 mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-secondary">
                    How long have you been taking it? *
                  </Label>
                  <Input
                    value={row.duration}
                    onChange={(e) =>
                      updateDetail(medId, { duration: e.target.value })
                    }
                    placeholder="e.g. About 2 years"
                    className={durationInputClass}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
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
        <TransferYesNoWithDetail
          question="Have you experienced any side effects from your weight-loss medication? *"
          value={sideEffects}
          onChange={(v) => {
            onSideEffectsChange(v);
            if (v === "no") onSideEffectsDetailsChange("");
          }}
          detailValue={sideEffectsDetails}
          onDetailChange={onSideEffectsDetailsChange}
          detailLabel="Please describe your side effects"
          detailPlaceholder="e.g. Nausea for the first few days after each injection"
          testIdPrefix="continuationSideEffects"
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

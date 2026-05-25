import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField } from "@/components/consultation/DateField";
import { cn } from "@/lib/utils";

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

export function emptyDiagnosedEntry(): DiagnosedConditionEntry {
  return {
    id: newEntryId(),
    condition: "",
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
              ? "bg-[#D4EFE2] border-[#0E3D2D] text-[#0E3D2D]"
              : "bg-white border-stone-200 text-stone-700 hover:border-stone-300",
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
      className="w-full h-11 rounded-xl border-dashed border-[#0E3D2D]/35 text-[#0E3D2D] hover:bg-[#D4EFE2]/40"
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

  return (
    <div className="mt-5 space-y-5 border-t border-stone-100 pt-5">
      <p className="text-sm font-semibold text-[#0E3D2D]">
        Tell us about each condition
      </p>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="rounded-xl border border-stone-200 bg-[#FCFAF6] p-4 space-y-4"
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
              What were you diagnosed with? *
            </Label>
            <Input
              value={entry.condition}
              onChange={(e) => update(entry.id, { condition: e.target.value })}
              placeholder="e.g. Type 2 diabetes"
              className="h-12 mt-1.5 rounded-xl"
            />
          </div>
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
                className="h-10 rounded-xl border-dashed border-[#0E3D2D]/35 text-[#0E3D2D] hover:bg-[#D4EFE2]/40 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add another medication
              </Button>
            </div>
          )}
        </div>
      ))}
      <AddAnotherButton
        label="Add another condition"
        onClick={() => onChange([...entries, emptyDiagnosedEntry()])}
      />
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
      <p className="text-sm font-semibold text-[#0E3D2D]">
        List each medication you take
      </p>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="rounded-xl border border-stone-200 bg-[#FCFAF6] p-4 space-y-4"
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
      <p className="text-sm font-semibold text-[#0E3D2D]">
        Tell us about each health condition
      </p>
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="rounded-xl border border-stone-200 bg-[#FCFAF6] p-4 space-y-4"
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
          ? "bg-[#D4EFE2] border-[#0E3D2D] text-[#0E3D2D]"
          : "bg-white border-stone-200 text-stone-800 hover:border-stone-300",
      )}
    >
      <span className="font-semibold text-sm">{title}</span>
      <span
        className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
          selected ? "border-[#0E3D2D] bg-[#0E3D2D]" : "border-stone-300",
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
}: {
  changingProvider: YesNo | null;
  onChangingProvider: (v: YesNo) => void;
  lastInjectionTiming: LastInjectionTiming | null;
  onLastInjectionTiming: (v: LastInjectionTiming) => void;
  lastInjectionDate: string;
  onLastInjectionDate: (v: string) => void;
}) {
  return (
    <div className="mt-5 space-y-5 border-t border-stone-100 pt-5">
      <div>
        <p className="font-semibold text-secondary mb-3">
          Are you changing from a different provider? *
        </p>
        <YesNoChoiceInline
          value={changingProvider}
          onChange={onChangingProvider}
          testIdPrefix="changingProvider"
        />
        {changingProvider === "yes" && (
          <p className="text-xs text-[#0E3D2D] mt-2 bg-[#D4EFE2]/60 rounded-lg px-3 py-2">
            We&apos;ll treat this as a transfer from another provider. You may be
            asked for your previous prescription later.
          </p>
        )}
      </div>

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

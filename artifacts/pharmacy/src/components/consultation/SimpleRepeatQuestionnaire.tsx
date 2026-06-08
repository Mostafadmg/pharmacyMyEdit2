import {
  YesNoChoice,
  TextareaField,
  TextField,
  SelectField,
  CheckboxRow,
} from "@/components/consultation";
import type { YesNo } from "@/components/consultation";
import { GatedChecklistSection } from "@/components/consultation/GatedChecklistSection";
import { WL_SECTION_TITLE } from "@/lib/consultationTheme";
import { REPEAT_HIGH_RISK_QUESTION } from "@/lib/weightLossHighRiskMeds";
import {
  SIMPLE_REPEAT_HIGH_RISK_MEDS,
  emptyHighRiskMedEntry,
  repeatHighRiskGate,
  type SimpleRepeatFormState,
  type SimpleRepeatHighRiskMedId,
} from "@/lib/simpleRepeatQuestionnaire";

type Props = {
  state: SimpleRepeatFormState;
  onChange: (next: SimpleRepeatFormState) => void;
  section: "monitoring" | "declaration";
};

function patch<K extends keyof SimpleRepeatFormState>(
  state: SimpleRepeatFormState,
  onChange: (next: SimpleRepeatFormState) => void,
  key: K,
  value: SimpleRepeatFormState[K],
) {
  onChange({ ...state, [key]: value });
}

function patchHighRisk(
  state: SimpleRepeatFormState,
  onChange: (next: SimpleRepeatFormState) => void,
  id: SimpleRepeatHighRiskMedId,
  patchEntry: Partial<SimpleRepeatFormState["highRiskMeds"][SimpleRepeatHighRiskMedId]>,
) {
  onChange({
    ...state,
    highRiskMeds: {
      ...state.highRiskMeds,
      [id]: { ...state.highRiskMeds[id], ...patchEntry },
    },
  });
}

export function SimpleRepeatQuestionnaire({ state, onChange, section }: Props) {
  if (section === "monitoring") {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 px-4 py-3">
          <p className="text-sm font-bold text-emerald-950">Clinical monitoring</p>
          <p className="mt-1 text-xs text-emerald-900/80">
            Lifestyle and monitoring — helps your pharmacist review your repeat safely.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Recent blood pressure (if known)"
            value={state.recentBloodPressure}
            onChange={(v) => patch(state, onChange, "recentBloodPressure", v)}
            placeholder="e.g. 128/82"
          />
          <TextField
            label="Current weight in kg (if applicable)"
            value={state.recentWeightKg}
            onChange={(v) => patch(state, onChange, "recentWeightKg", v)}
            placeholder="e.g. 82.5"
          />
        </div>

        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-4">
          <GatedChecklistSection
            gateQuestion={`${REPEAT_HIGH_RISK_QUESTION} *`}
            gateValue={repeatHighRiskGate(state)}
            onGateChange={(v) => {
              if (v === "no") {
                onChange({
                  ...state,
                  highRiskMeds: Object.fromEntries(
                    SIMPLE_REPEAT_HIGH_RISK_MEDS.map((m) => [
                      m.id,
                      {
                        takes: "no" as const,
                        lastBloodTestDate: "",
                        lastBloodTestResult: "",
                        symptoms: null,
                        symptomsDetails: "",
                      },
                    ]),
                  ) as SimpleRepeatFormState["highRiskMeds"],
                });
                return;
              }
              onChange({
                ...state,
                highRiskMeds: Object.fromEntries(
                  SIMPLE_REPEAT_HIGH_RISK_MEDS.map((m) => [
                    m.id,
                    emptyHighRiskMedEntry(),
                  ]),
                ) as SimpleRepeatFormState["highRiskMeds"],
              });
            }}
            items={SIMPLE_REPEAT_HIGH_RISK_MEDS.map((m) => ({
              id: m.id,
              label: m.label,
              section: m.section,
            }))}
            isSelected={(id) =>
              state.highRiskMeds[id as SimpleRepeatHighRiskMedId].takes === "yes"
            }
            onToggle={(id) => {
              const medId = id as SimpleRepeatHighRiskMedId;
              const current = state.highRiskMeds[medId].takes;
              patchHighRisk(state, onChange, medId, {
                takes: current === "yes" ? "no" : "yes",
                ...(current === "yes"
                  ? {
                      lastBloodTestDate: "",
                      lastBloodTestResult: "",
                      symptoms: null,
                      symptomsDetails: "",
                    }
                  : {}),
              });
            }}
            infoHeading="These are the medications we ask about:"
            infoHeadingWhenNo="For your information, these are the medications we ask about:"
            selectHint="Select any you take. For each one, we will ask for your latest monitoring and symptom check."
            testIdPrefix="repeat-high-risk-meds"
          />

          {repeatHighRiskGate(state) === "yes" && (
            <div className="mt-4 space-y-4">
              {SIMPLE_REPEAT_HIGH_RISK_MEDS.filter(
                (m) => state.highRiskMeds[m.id].takes === "yes",
              ).map((med) => {
                const entry = state.highRiskMeds[med.id];
                return (
                  <div
                    key={med.id}
                    className="space-y-3 rounded-xl border border-emerald-200 bg-white p-3"
                  >
                    <p className="text-sm font-bold text-secondary">{med.label}</p>
                    <TextField
                      label="Date of last blood test / monitoring *"
                      value={entry.lastBloodTestDate}
                      onChange={(v) =>
                        patchHighRisk(state, onChange, med.id, {
                          lastBloodTestDate: v,
                        })
                      }
                      placeholder="e.g. 12/03/2026"
                    />
                    <TextField
                      label="Result if known (optional)"
                      value={entry.lastBloodTestResult}
                      onChange={(v) =>
                        patchHighRisk(state, onChange, med.id, {
                          lastBloodTestResult: v,
                        })
                      }
                      placeholder="e.g. INR 2.4, lithium 0.6"
                    />
                    <p className="text-xs font-medium text-stone-700">
                      {med.symptomsPrompt}
                    </p>
                    <YesNoChoice
                      value={entry.symptoms}
                      onChange={(v) =>
                        patchHighRisk(state, onChange, med.id, {
                          symptoms: v,
                          symptomsDetails:
                            v === "no" ? "" : entry.symptomsDetails,
                        })
                      }
                    />
                    {entry.symptoms === "yes" && (
                      <TextareaField
                        label="Please describe symptoms *"
                        value={entry.symptomsDetails}
                        onChange={(v) =>
                          patchHighRisk(state, onChange, med.id, {
                            symptomsDetails: v,
                          })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <details className="rounded-2xl border border-border bg-muted/30 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Condition-specific checks (if relevant)
          </summary>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Asthma / COPD
              </p>
              <SelectField
                label="Using your inhaler as prescribed?"
                value={state.asthmaInhalerUse ?? ""}
                onChange={(v) =>
                  patch(
                    state,
                    onChange,
                    "asthmaInhalerUse",
                    v === "" ? null : (v as YesNo),
                  )
                }
                options={[
                  { value: "", label: "Not applicable / skip" },
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
              {state.asthmaInhalerUse === "yes" && (
                <YesNoChoice
                  value={state.asthmaSymptomsWorse}
                  onChange={(v) =>
                    patch(state, onChange, "asthmaSymptomsWorse", v)
                  }
                  yesLabel="Yes — symptoms worse"
                  noLabel="No — symptoms stable"
                />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Diabetes</p>
              <YesNoChoice
                value={state.diabetesFootCheckRecent}
                onChange={(v) =>
                  patch(state, onChange, "diabetesFootCheckRecent", v)
                }
                yesLabel="Foot check within last year"
                noLabel="No recent foot check"
              />
              <YesNoChoice
                value={state.diabetesEyeCheckRecent}
                onChange={(v) =>
                  patch(state, onChange, "diabetesEyeCheckRecent", v)
                }
                yesLabel="Eye screening within last year"
                noLabel="No recent eye screening"
              />
              <YesNoChoice
                value={state.diabetesHbA1cKnown}
                onChange={(v) => {
                  onChange({
                    ...state,
                    diabetesHbA1cKnown: v,
                    diabetesHbA1cValue: v === "no" ? "" : state.diabetesHbA1cValue,
                  });
                }}
                yesLabel="I know my recent HbA1c"
                noLabel="I don't know my HbA1c"
              />
              {state.diabetesHbA1cKnown === "yes" && (
                <TextField
                  label="HbA1c (mmol/mol or %)"
                  value={state.diabetesHbA1cValue}
                  onChange={(v) =>
                    patch(state, onChange, "diabetesHbA1cValue", v)
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Cardiovascular
              </p>
              <YesNoChoice
                value={state.cardiovascularSymptoms}
                onChange={(v) =>
                  onChange({
                    ...state,
                    cardiovascularSymptoms: v,
                    cardiovascularSymptomsDetails:
                      v === "no" ? "" : state.cardiovascularSymptomsDetails,
                  })
                }
                yesLabel="New chest pain, palpitations or breathlessness"
                noLabel="No new cardiovascular symptoms"
              />
              {state.cardiovascularSymptoms === "yes" && (
                <TextareaField
                  label="Please describe"
                  value={state.cardiovascularSymptomsDetails}
                  onChange={(v) =>
                    patch(state, onChange, "cardiovascularSymptomsDetails", v)
                  }
                />
              )}
            </div>
          </div>
        </details>
      </div>
    );
  }

  return (
    <CheckboxRow
      checked={state.patientDeclaration}
      onToggle={() =>
        patch(state, onChange, "patientDeclaration", !state.patientDeclaration)
      }
      title="I confirm the information I have provided is accurate and complete to the best of my knowledge."
      subtitle="I understand my order will be reviewed by a pharmacist before supply."
      className="border-2"
    />
  );
}

/** Repeat-order side effect symptom checklist (simple repeat continuation step). */

export const WL_REPEAT_SIDE_EFFECT_SYMPTOMS = [
  { id: "nausea_vomiting", label: "Nausea & Vomiting" },
  { id: "diarrhoea", label: "Diarrhoea" },
  { id: "constipation", label: "Constipation" },
  { id: "abdominal_pain", label: "Abdominal Pain" },
  { id: "indigestion_reflux", label: "Indigestion / Reflux" },
  { id: "headache", label: "Headache" },
  { id: "injection_site_reaction", label: "Injection Site Reaction" },
  { id: "fatigue", label: "Fatigue" },
  { id: "dizziness", label: "Dizziness" },
  { id: "hair_loss", label: "Hair Loss" },
  { id: "changes_in_taste", label: "Changes in Taste" },
  { id: "heart_palpitations", label: "Heart Palpitations" },
  {
    id: "allodynia_skin_sensation",
    label: "Allodynia / Skin Sensation Changes",
  },
  { id: "mood_change", label: "Mood Change" },
] as const;

export type WlRepeatSideEffectSymptomId =
  (typeof WL_REPEAT_SIDE_EFFECT_SYMPTOMS)[number]["id"];

export type RepeatSideEffectYesNo = "yes" | "no";

export type RepeatSideEffectSymptomsMap = Record<
  WlRepeatSideEffectSymptomId,
  RepeatSideEffectYesNo | null
>;

export function emptyRepeatSideEffectSymptoms(): RepeatSideEffectSymptomsMap {
  return Object.fromEntries(
    WL_REPEAT_SIDE_EFFECT_SYMPTOMS.map((s) => [s.id, null]),
  ) as RepeatSideEffectSymptomsMap;
}

export function isRepeatSideEffectSymptomsComplete(
  _symptoms: RepeatSideEffectSymptomsMap,
): boolean {
  // Checkbox UI: unchecked symptoms are treated as not experienced.
  return true;
}

function buildSideEffectsSymptomsArray(
  symptoms: RepeatSideEffectSymptomsMap,
): Array<{ id: string; label: string; present: RepeatSideEffectYesNo | null }> {
  return WL_REPEAT_SIDE_EFFECT_SYMPTOMS.map((s) => ({
    id: s.id,
    label: s.label,
    present: symptoms[s.id] === "yes" ? "yes" : "no",
  }));
}

export function repeatSideEffectAnswerKey(id: WlRepeatSideEffectSymptomId): string {
  return `repeat_side_effect_${id}`;
}

export function repeatSideEffectsToAnswers(
  any: RepeatSideEffectYesNo | null,
  symptoms: RepeatSideEffectSymptomsMap,
  details: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    side_effects_since_last: any,
    side_effects_hospitalisation: null,
    side_effects_vomiting_diarrhoea: null,
    side_effects_injection_site: null,
  };

  if (any === "yes") {
    out.side_effects_symptoms = buildSideEffectsSymptomsArray(symptoms);
    const trimmed = details.trim();
    if (trimmed) {
      out.side_effects_details = trimmed;
    }
  }

  return out;
}

export function transferSideEffectsToAnswers(
  any: RepeatSideEffectYesNo | null,
  symptoms: RepeatSideEffectSymptomsMap,
  details: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    transfer_side_effects: any,
    transfer_side_effects_details: null,
  };

  if (any === "yes") {
    out.transfer_side_effects_symptoms = buildSideEffectsSymptomsArray(symptoms);
    const trimmed = details.trim();
    if (trimmed) {
      out.transfer_side_effects_details = trimmed;
    }
  }

  return out;
}

export function parseSideEffectSymptomsFromAnswers(
  answers: Record<string, unknown>,
  symptomsKey:
    | "side_effects_symptoms"
    | "transfer_side_effects_symptoms" = "side_effects_symptoms",
  detailsKey:
    | "side_effects_details"
    | "transfer_side_effects_details" = "side_effects_details",
): {
  symptomsReported: string[];
  details: string | null;
} {
  const bundled = answers[symptomsKey];
  if (Array.isArray(bundled)) {
    const symptomsReported: string[] = [];
    for (const row of bundled) {
      if (
        row &&
        typeof row === "object" &&
        (row as { present?: string }).present === "yes" &&
        typeof (row as { label?: string }).label === "string"
      ) {
        symptomsReported.push((row as { label: string }).label);
      }
    }
    const details =
      typeof answers[detailsKey] === "string" && answers[detailsKey].trim()
        ? String(answers[detailsKey]).trim()
        : null;
    return { symptomsReported, details };
  }

  return { symptomsReported: [], details: null };
}

/** @deprecated Use parseSideEffectSymptomsFromAnswers */
export function parseRepeatSideEffectSymptomsFromAnswers(
  answers: Record<string, unknown>,
): {
  symptomsReported: string[];
  details: string | null;
} {
  return parseSideEffectSymptomsFromAnswers(answers);
}

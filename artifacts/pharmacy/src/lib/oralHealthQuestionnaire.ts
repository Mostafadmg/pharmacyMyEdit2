import {
  ORAL_MEDICAL_HISTORY_GATE_QUESTION,
  ORAL_MEDICAL_HISTORY_INTRO,
  WL_ORAL_MEDICAL_HISTORY_CONDITIONS,
  wlType2DiabetesListedMedLabel,
  type WlOralMedicalHistoryConditionId,
  type WlType2DiabetesListedMedId,
} from "@workspace/evidence-slots";
import type { MedicalHistoryConditionDetail } from "@/lib/pmrHealthQuestionnaire";
import {
  emptyMedicalHistoryDetail,
  isMedicalHistoryConditionDetailComplete,
} from "@/lib/pmrHealthQuestionnaire";

export type PmrYesNo = "yes" | "no";

export const ORAL_MEDICAL_HISTORY_CONDITIONS = WL_ORAL_MEDICAL_HISTORY_CONDITIONS;
export { ORAL_MEDICAL_HISTORY_GATE_QUESTION, ORAL_MEDICAL_HISTORY_INTRO };

export type OralMedicalHistoryId =
  (typeof ORAL_MEDICAL_HISTORY_CONDITIONS)[number]["id"];

export type OralHealthFormSlice = {
  medicalHistoryAny: PmrYesNo | null;
  medicalHistory: Record<OralMedicalHistoryId, PmrYesNo | null>;
  medicalHistoryDetails: Record<
    OralMedicalHistoryId,
    MedicalHistoryConditionDetail
  >;
};

export function emptyOralMedicalHistoryDetails(): Record<
  OralMedicalHistoryId,
  MedicalHistoryConditionDetail
> {
  return Object.fromEntries(
    ORAL_MEDICAL_HISTORY_CONDITIONS.map((c) => [
      c.id,
      emptyMedicalHistoryDetail(),
    ]),
  ) as Record<OralMedicalHistoryId, MedicalHistoryConditionDetail>;
}

export function emptyOralHealthFormSlice(): OralHealthFormSlice {
  return {
    medicalHistoryAny: null,
    medicalHistory: Object.fromEntries(
      ORAL_MEDICAL_HISTORY_CONDITIONS.map((c) => [c.id, null]),
    ) as Record<OralMedicalHistoryId, PmrYesNo | null>,
    medicalHistoryDetails: emptyOralMedicalHistoryDetails(),
  };
}

export function oralMedicalHistoryGate(
  slice: OralHealthFormSlice,
): PmrYesNo | null {
  if (slice.medicalHistoryAny != null) return slice.medicalHistoryAny;
  const values = ORAL_MEDICAL_HISTORY_CONDITIONS.map(
    (c) => slice.medicalHistory[c.id],
  );
  if (values.every((v) => v === "no")) return "no";
  if (values.some((v) => v === "yes")) return "yes";
  return null;
}

export function selectedOralMedicalHistoryConditions(
  slice: OralHealthFormSlice,
): (typeof ORAL_MEDICAL_HISTORY_CONDITIONS)[number][] {
  return ORAL_MEDICAL_HISTORY_CONDITIONS.filter(
    (c) => slice.medicalHistory[c.id] === "yes",
  );
}

export function isOralMedicalHistoryComplete(
  slice: OralHealthFormSlice,
): boolean {
  const gate = oralMedicalHistoryGate(slice);
  if (gate === null) return false;
  if (gate === "no") return true;
  const selected = selectedOralMedicalHistoryConditions(slice);
  if (selected.length === 0) return false;
  return selected.every((c) =>
    isMedicalHistoryConditionDetailComplete(
      c.id,
      slice.medicalHistoryDetails[c.id],
    ),
  );
}

export function oralHealthToAnswers(
  slice: OralHealthFormSlice,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const gate = oralMedicalHistoryGate(slice);
  out.consultation_product = "oral_weight_loss";
  out.medical_history_any = gate;

  if (gate === "no") {
    for (const c of ORAL_MEDICAL_HISTORY_CONDITIONS) {
      out[`med_history_${c.id}`] = "no";
    }
    out.medical_history_details = [];
  } else if (gate === "yes") {
    const selected = selectedOralMedicalHistoryConditions(slice);
    for (const c of ORAL_MEDICAL_HISTORY_CONDITIONS) {
      out[`med_history_${c.id}`] = slice.medicalHistory[c.id];
    }
    out.medical_history_details = selected.map((c) => {
      const detail = slice.medicalHistoryDetails[c.id];
      if (c.id === "type2_diabetes") {
        const listedMedicationNames = detail.listedMeds.map((id) =>
          wlType2DiabetesListedMedLabel(id),
        );
        const otherMedications = detail.medications
          .map((m) => m.trim())
          .filter((m) => m.length > 0);
        return {
          id: c.id,
          label: c.label,
          takes_listed_meds: detail.takesListedMeds,
          listed_meds: detail.listedMeds,
          listed_medication_names: listedMedicationNames,
          on_other_medication: detail.onMedication,
          other_medications: otherMedications,
          on_medication: detail.onMedication,
          medications: [...listedMedicationNames, ...otherMedications],
        };
      }
      return {
        id: c.id,
        label: c.label,
        on_medication: detail.onMedication,
        medications: detail.medications
          .map((m) => m.trim())
          .filter((m) => m.length > 0),
      };
    });
  } else {
    for (const c of ORAL_MEDICAL_HISTORY_CONDITIONS) {
      out[`med_history_${c.id}`] = slice.medicalHistory[c.id];
    }
  }

  return out;
}

export type { WlOralMedicalHistoryConditionId, WlType2DiabetesListedMedId };

export const ORAL_ORLISTAT_ALLERGY_QUESTION =
  "Have you ever had an allergic reaction or hypersensitivity to Orlistat (including Xenical or Alli)?";

/** Mandatory counselling when patient takes an oral contraceptive (Orlistat SPC). */
export const ORAL_ORLISTAT_OCP_COUNSELLING_HEADING =
  "Important: Orlistat and oral contraception";

export const ORAL_ORLISTAT_OCP_COUNSELLING_BODY =
  "Orlistat can cause severe diarrhoea. The Orlistat Summary of Product Characteristics (SPC) states that severe diarrhoea may reduce the effectiveness of oral contraceptive pills. If you are prescribed Orlistat, you should use an additional contraceptive method — for example, condoms — particularly if you experience severe diarrhoea while taking it.";

export const ORAL_ORLISTAT_OCP_COUNSELLING_ACKNOWLEDGEMENT =
  "I have read and understand this advice about Orlistat and oral contraception.";

export function isOralYourHealthStepComplete(input: {
  assignedSex: "male" | "female" | "prefer-not-to-say" | null;
  pregnant: PmrYesNo | null;
  oralContraceptive: PmrYesNo | null;
  orlistatAllergy: PmrYesNo | null;
  orlistatOcpCounsellingAcknowledged: boolean;
  asksFemaleHealthQuestions: (sex: "male" | "female" | "prefer-not-to-say" | null) => boolean;
}): boolean {
  if (input.assignedSex === null || input.orlistatAllergy === null) {
    return false;
  }
  if (input.asksFemaleHealthQuestions(input.assignedSex)) {
    if (input.pregnant === null || input.oralContraceptive === null) {
      return false;
    }
    if (
      input.oralContraceptive === "yes" &&
      !input.orlistatOcpCounsellingAcknowledged
    ) {
      return false;
    }
  }
  return true;
}

export function oralYourHealthToAnswers(input: {
  assignedSex: "male" | "female" | "prefer-not-to-say" | null;
  pregnant: PmrYesNo | null;
  oralContraceptive: PmrYesNo | null;
  orlistatAllergy: PmrYesNo | null;
  orlistatOcpCounsellingAcknowledged: boolean;
}): Record<string, unknown> {
  return {
    assigned_sex: input.assignedSex,
    pregnant_or_breastfeeding: input.pregnant,
    oral_contraceptive: input.oralContraceptive,
    orlistat_allergy: input.orlistatAllergy,
    orlistat_ocp_counselling_acknowledged:
      input.oralContraceptive === "yes"
        ? input.orlistatOcpCounsellingAcknowledged
        : null,
  };
}

export const CLINICAL_TEAM_NOTES_PROMPT =
  "Is there anything else you would like us to know before we review your order?";

export const CLINICAL_TEAM_NOTES_LABEL = "Additional information (optional)";

export const CLINICAL_TEAM_NOTES_PLACEHOLDER =
  "e.g. upcoming surgery, recent test results, or questions for your pharmacist";

export const CLINICAL_TEAM_NOTES_ANSWER_KEY = "clinical_team_notes";

export function clinicalTeamNotesToAnswers(notes: string): Record<string, unknown> {
  const trimmed = notes.trim();
  return {
    [CLINICAL_TEAM_NOTES_ANSWER_KEY]: trimmed.length > 0 ? trimmed : null,
  };
}

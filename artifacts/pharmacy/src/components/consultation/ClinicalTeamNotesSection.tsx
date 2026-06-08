import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CLINICAL_TEAM_NOTES_LABEL,
  CLINICAL_TEAM_NOTES_PLACEHOLDER,
  CLINICAL_TEAM_NOTES_PROMPT,
} from "@/lib/clinicalTeamNotes";

export function ClinicalTeamNotesSection({
  value,
  onChange,
  testId = "clinical-team-notes",
}: {
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="font-semibold text-secondary">{CLINICAL_TEAM_NOTES_PROMPT}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Optional — share anything you think our prescribing team should be aware
        of before we review your order.
      </p>
      <div>
        <Label htmlFor={testId} className="font-semibold text-secondary">
          {CLINICAL_TEAM_NOTES_LABEL}
        </Label>
        <Textarea
          id={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={CLINICAL_TEAM_NOTES_PLACEHOLDER}
          rows={4}
          className="mt-1.5 min-h-[112px] resize-y rounded-xl"
          data-testid={testId}
        />
      </div>
    </div>
  );
}

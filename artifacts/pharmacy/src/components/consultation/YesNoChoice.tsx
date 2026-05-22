import { RadioRow } from "./RadioRow";
import { cn } from "@/lib/utils";

export type YesNo = "yes" | "no";

interface YesNoChoiceProps {
  value: YesNo | null;
  onChange: (value: YesNo) => void;
  yesLabel?: string;
  noLabel?: string;
  className?: string;
}

export function YesNoChoice({
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
  className,
}: YesNoChoiceProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <RadioRow
        selected={value === "yes"}
        onSelect={() => onChange("yes")}
        title={yesLabel}
      />
      <RadioRow
        selected={value === "no"}
        onSelect={() => onChange("no")}
        title={noLabel}
      />
    </div>
  );
}

export default YesNoChoice;

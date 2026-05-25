import type { ReactNode } from "react";
import { YesNoChoiceInline } from "@/components/consultation/WeightLossClinicalForms";
import {
  WL_CHECKBOX_OFF,
  WL_CHECKBOX_ON,
  WL_CHECKLIST_SELECTED,
  WL_CHECKLIST_UNSELECTED,
  WL_CHIP_INFO,
  WL_SECTION_TITLE,
} from "@/lib/consultationTheme";
import { cn } from "@/lib/utils";

export type GateYesNo = "yes" | "no";

type ChecklistItem = { id: string; label: string };

type GatedChecklistSectionProps = {
  gateQuestion: string;
  gateValue: GateYesNo | null;
  onGateChange: (v: GateYesNo) => void;
  items: readonly ChecklistItem[];
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  infoHeading?: string;
  infoHeadingWhenNo?: string;
  selectHint?: string;
  testIdPrefix: string;
  renderInfoList?: () => ReactNode;
};

export function GatedChecklistSection({
  gateQuestion,
  gateValue,
  onGateChange,
  items,
  isSelected,
  onToggle,
  infoHeading = "These are the options we ask about:",
  infoHeadingWhenNo,
  selectHint = "Select any that apply to you.",
  testIdPrefix,
  renderInfoList,
}: GatedChecklistSectionProps) {
  const showReadOnlyList = gateValue !== "yes";

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(WL_SECTION_TITLE, 'mb-3')}>{gateQuestion}</p>
        <YesNoChoiceInline
          value={gateValue}
          onChange={onGateChange}
          testIdPrefix={testIdPrefix}
        />
      </div>

      {showReadOnlyList && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {gateValue === "no" && infoHeadingWhenNo
              ? infoHeadingWhenNo
              : infoHeading}
          </p>
          {renderInfoList ? (
            renderInfoList()
          ) : (
            <DefaultInfoList items={items} testIdPrefix={testIdPrefix} />
          )}
        </div>
      )}

      {gateValue === "yes" && (
        <>
          <p className="text-sm text-muted-foreground">{selectHint}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => {
              const checked = isSelected(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggle(item.id)}
                  data-testid={`${testIdPrefix}-item-${item.id}`}
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
        </>
      )}
    </div>
  );
}

function DefaultInfoList({
  items,
  testIdPrefix,
}: {
  items: readonly ChecklistItem[];
  testIdPrefix: string;
}) {
  return (
    <ul
      className="grid gap-2 sm:grid-cols-2 list-none p-0 m-0"
      data-testid={`${testIdPrefix}-info-list`}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className={WL_CHIP_INFO}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}

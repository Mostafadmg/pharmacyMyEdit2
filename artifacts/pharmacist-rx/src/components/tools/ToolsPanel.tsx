import { GlpSwitchCalculator } from "@/components/tools/GlpSwitchCalculator";
import { GapTreatmentCalculator } from "@/components/tools/GapTreatmentCalculator";
import { ComplexRepeatsGuide } from "@/components/tools/ComplexRepeatsGuide";
import { ContraindicationsReference } from "@/components/tools/ContraindicationsReference";
import { MacroLibrary } from "@/components/tools/MacroLibrary";

/**
 * Prescriber tools drawer content. Each tool is a self-contained section so new
 * tools can be appended below as they are added.
 */
export function ToolsPanel() {
  return (
    <div className="space-y-5">
      <GlpSwitchCalculator />
      <GapTreatmentCalculator />
      <ComplexRepeatsGuide />
      <ContraindicationsReference collapsible />
      <MacroLibrary collapsible />
    </div>
  );
}

import { TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContraindicationsReference } from "@/components/tools/ContraindicationsReference";
import { TOOL_MODAL_SHELL_CLASS } from "@/components/tools/toolsModalShell";

export function ContraindicationsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={TOOL_MODAL_SHELL_CLASS}>
        <DialogHeader className="shrink-0 border-b border-border bg-primary/5 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <TriangleAlert className="h-5 w-5 text-red-600" />
            Contraindications Reference
          </DialogTitle>
          <DialogDescription>
            Search conditions, review decision rules, and check prescribing guidance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ContraindicationsReference embedded />
        </div>
      </DialogContent>
    </Dialog>
  );
}

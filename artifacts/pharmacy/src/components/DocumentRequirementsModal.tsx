import React from "react";
import { Wallet, Video, ClipboardCheck, ShieldCheck, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  documentRulesFor,
  type RuleSection,
  type RuleSpan,
} from "@/lib/documentRequirementRules";

function iconForDoc(docId: string): typeof Wallet {
  if (docId === "government-id") return Wallet;
  if (docId === "full-body-video" || docId === "weight-scale-video") return Video;
  if (docId === "previous-prescription") return ClipboardCheck;
  if (docId === "previous-bmi-verification") return ShieldCheck;
  return FileText;
}

function Spans({ spans }: { spans: RuleSpan[] }) {
  return (
    <>
      {spans.map((s, i) => (
        <span key={i} className={cn(s.bold && "font-semibold text-violet-900")}>
          {s.text}
        </span>
      ))}
    </>
  );
}

function SectionView({ section }: { section: RuleSection }) {
  if (section.kind === "table") {
    return (
      <div className="overflow-hidden rounded-2xl border border-violet-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-violet-50/70 text-xs font-bold uppercase tracking-wider text-violet-700">
              <th className="border-b border-violet-200 px-4 py-3">{section.columns[0]}</th>
              <th className="border-b border-violet-200 px-4 py-3">{section.columns[1]}</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map(([req, detail], i) => (
              <tr key={i} className="align-top">
                <td
                  className={cn(
                    "px-4 py-3 font-semibold text-violet-900",
                    i < section.rows.length - 1 && "border-b border-violet-100",
                  )}
                >
                  {req}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-violet-700",
                    i < section.rows.length - 1 && "border-b border-violet-100",
                  )}
                >
                  {detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-violet-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-violet-700">
        {section.heading}
      </div>
      {section.items.map((spans, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl bg-violet-50/70 px-4 py-3 text-sm text-violet-800"
        >
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
          <span className="leading-relaxed">
            <Spans spans={spans} />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DocumentRequirementsModal({
  docId,
  open,
  onOpenChange,
}: {
  docId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rules = documentRulesFor(docId);
  const Icon = iconForDoc(docId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="space-y-0 border-b border-violet-100 px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-left text-lg font-bold text-violet-900">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            {rules.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {rules.intro ? (
            <p className="text-sm leading-relaxed text-violet-700">
              <Spans spans={rules.intro} />
            </p>
          ) : null}
          {rules.sections.map((section, i) => (
            <SectionView key={i} section={section} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

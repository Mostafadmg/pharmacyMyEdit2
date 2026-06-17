import React, { useState } from "react";
import {
  Upload,
  IdCard,
  Video,
  FileText,
  Plus,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocStatus = "verified" | "uploaded" | "pending";

function StatusPill({ status }: { status: DocStatus }) {
  const config = {
    verified: {
      label: "Verified",
      className: "bg-[#ecfdf3] text-[#166534] border-[#86efac]",
      dot: "bg-[#22c55e]",
    },
    uploaded: {
      label: "Uploaded",
      className: "bg-[#ecfdf3] text-[#166534] border-[#86efac]",
      dot: "bg-[#22c55e]",
    },
    pending: {
      label: "Pending",
      className: "bg-[#fef9c3] text-[#854d0e] border-[#fde047]",
      dot: "bg-[#eab308]",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        config.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

function ExampleThumb({
  label,
  good,
}: {
  label: string;
  good: boolean;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div
        className={cn(
          "aspect-[4/3] rounded-lg border-2 flex items-center justify-center text-[10px] font-medium text-center px-1",
          good
            ? "border-[#86efac] bg-[#f0fdf4] text-[#166534]"
            : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
        )}
      >
        {good ? (
          <Check className="h-5 w-5 text-[#22c55e]" />
        ) : (
          <X className="h-5 w-5 text-[#ef4444]" />
        )}
      </div>
      <p className="mt-1.5 text-[10px] font-semibold text-gray-600 text-center leading-tight">
        {label}
      </p>
    </div>
  );
}

type DocPanelProps = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: DocStatus;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function DocPanel({
  id,
  icon,
  title,
  subtitle,
  status,
  children,
  defaultOpen = true,
}: DocPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-gray-50/80 transition-colors lg:cursor-default lg:pointer-events-none"
        aria-expanded={open}
        aria-controls={`${id}-body`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ee] text-[#314a40]">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm sm:text-base">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
        </div>
        <StatusPill status={status} />
        <ChevronDown
          className={cn(
            "h-5 w-5 text-gray-400 shrink-0 transition-transform lg:hidden",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={`${id}-body`}
        className={cn(
          "border-t border-gray-100 flex-1 flex flex-col",
          !open && "hidden lg:block",
        )}
      >
        <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">{children}</div>
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#f8faf9] border border-gray-100 px-4 py-3">
      <p className="text-xs font-bold text-[#314a40] mb-2">{title}</p>
      <div className="text-xs text-gray-600 leading-relaxed space-y-1.5">
        {children}
      </div>
    </div>
  );
}

export default function PatientUploadDocumentsHub() {
  return (
    <PatientAccountLayout
      title="Upload Documents"
      subtitle="Complete all three sections below so our prescriber can review your order."
      icon={<Upload className="h-5 w-5" />}
      progress={{ completed: 2, total: 3 }}
    >
      <div className="grid gap-4 lg:gap-5 lg:grid-cols-3 items-start">
        {/* Photo ID */}
        <DocPanel
          id="photo-id"
          icon={<IdCard className="h-5 w-5" />}
          title="Photo ID"
          subtitle="Secure identity verification by Yoti"
          status="verified"
        >
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#e8eef5] to-[#d4dce8] aspect-[4/3] flex items-center justify-center">
            <div className="text-center px-4">
              <IdCard className="h-10 w-10 text-[#314a40]/40 mx-auto mb-2" />
              <p className="text-xs font-medium text-[#314a40]/70">
                Passport / driving licence preview
              </p>
            </div>
          </div>

          <Button className="w-full h-11 rounded-xl bg-[#314a40] hover:bg-[#2a4038] text-white font-semibold">
            Re-verify with Yoti
          </Button>

          <div className="flex gap-2">
            <ExampleThumb label="Clear & Complete" good />
            <ExampleThumb label="Blurry or Cut off" good={false} />
          </div>

          <InfoBlock title="View Guidelines">
            <ul className="list-disc pl-4 space-y-1">
              <li>Use a valid passport or UK driving licence</li>
              <li>Ensure all four corners are visible</li>
              <li>Good lighting — no glare or shadows</li>
              <li>Takes about 2 minutes to complete</li>
            </ul>
          </InfoBlock>

          <InfoBlock title="What you'll need">
            <ul className="list-disc pl-4 space-y-1">
              <li>A valid photo ID document</li>
              <li>A device with a working camera</li>
              <li>A well-lit room</li>
            </ul>
          </InfoBlock>

          <InfoBlock title="Why Yoti?">
            <p>
              Yoti is a trusted identity verification provider used by pharmacies
              and the NHS. Your ID is encrypted and only shared with our clinical
              team for verification purposes.
            </p>
          </InfoBlock>
        </DocPanel>

        {/* Video verification */}
        <DocPanel
          id="video"
          icon={<Video className="h-5 w-5" />}
          title="Video Verification"
          subtitle="Full body & weight scale recordings"
          status="uploaded"
        >
          <div className="grid grid-cols-2 gap-2">
            {(["Full body", "Weight scale"] as const).map((label) => (
              <div
                key={label}
                className="rounded-xl bg-gray-900 aspect-video flex flex-col items-center justify-center text-white relative overflow-hidden"
              >
                <Video className="h-6 w-6 opacity-60 mb-1" />
                <span className="text-[11px] font-medium">{label}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#b8f0c8] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                  Recorded
                </span>
              </div>
            ))}
          </div>

          <Button className="w-full h-11 rounded-xl bg-[#314a40] hover:bg-[#2a4038] text-white font-semibold">
            Re-record Videos
          </Button>

          <InfoBlock title="Recording instructions">
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Full body video (10 sec)</strong> — stand facing the
                camera, arms at sides, then turn 360°
              </li>
              <li>
                <strong>Weight scale video (5 sec)</strong> — step on scales with
                numbers clearly visible
              </li>
              <li>Film in a well-lit room wearing fitted clothing</li>
              <li>Hold your phone steady throughout</li>
            </ul>
          </InfoBlock>

          <InfoBlock title="Why we need these videos">
            <p>
              For weight-loss treatments our prescriber must confirm your current
              weight and BMI. Videos help us verify your identity and ensure safe
              prescribing.
            </p>
          </InfoBlock>
        </DocPanel>

        {/* Previous prescription */}
        <DocPanel
          id="prescription"
          icon={<FileText className="h-5 w-5" />}
          title="Previous Prescription"
          subtitle="Proof of recent medication & dosage"
          status="pending"
          defaultOpen
        >
          <button
            type="button"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 aspect-[4/3] text-gray-500 hover:border-[#314a40] hover:text-[#314a40] hover:bg-[#f5faf7] transition-colors w-full"
          >
            <Plus className="h-9 w-9 mb-2 stroke-[1.5]" />
            <span className="text-sm font-bold tracking-wide">ADD</span>
          </button>

          <div className="flex gap-2">
            <ExampleThumb label="Clear & Legible" good />
            <ExampleThumb label="Glare Or Obscured" good={false} />
          </div>

          <InfoBlock title="Your proof must show">
            <ul className="list-disc pl-4 space-y-1">
              <li>Your full name</li>
              <li>Date of prescription</li>
              <li>Medication name and strength</li>
              <li>Prescriber details (pharmacy or GP)</li>
            </ul>
          </InfoBlock>

          <InfoBlock title="Why we need previous prescriptions">
            <p>
              If you are requesting a higher dose or switching medication, we need
              proof of your current treatment to prescribe safely and in line with
              NICE guidance.
            </p>
          </InfoBlock>
        </DocPanel>
      </div>
    </PatientAccountLayout>
  );
}

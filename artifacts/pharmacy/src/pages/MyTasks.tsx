import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import {
  formatOrderPlacedShort,
  medicationLabelFromOrder,
} from "@/lib/patientOrderContext";
import { productImageForCondition } from "@/lib/patientOrderProgress";

type DocumentSlotStatus = "required" | "uploaded" | "verified" | "rejected";

type DocumentSlot = {
  docId: string;
  status: DocumentSlotStatus;
};

type Consultation = {
  id: string;
  conditionId?: string;
  conditionName: string;
  status: string;
  createdAt: string;
  prescriptionItems?: Array<{
    name?: string;
    strength?: string;
    quantity?: string;
  }>;
  documentSlots?: DocumentSlot[];
  documentsNeedAttention?: boolean;
};

function resolveDocumentSlots(c: Consultation): DocumentSlot[] {
  return c.documentSlots ?? [];
}

function needsDocumentAction(c: Consultation): boolean {
  const slots = resolveDocumentSlots(c);
  if (slots.length > 0) {
    return slots.some((s) => s.status === "required" || s.status === "rejected");
  }
  return Boolean(c.documentsNeedAttention);
}

function greetingPrefix(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function patientFirstName(): string {
  const raw = localStorage.getItem("patient_name")?.trim();
  if (!raw) return "there";
  return raw.split(/\s+/)[0] ?? raw;
}

const DOSE_WEEK_RANGES: Array<{ mg: number; weeks: string }> = [
  { mg: 2.5, weeks: "Weeks 1–4" },
  { mg: 5, weeks: "Weeks 5–8" },
  { mg: 7.5, weeks: "Weeks 9–12" },
  { mg: 10, weeks: "Weeks 13–16" },
  { mg: 12.5, weeks: "Weeks 17–20" },
  { mg: 15, weeks: "Weeks 21–24" },
  { mg: 0.25, weeks: "Weeks 1–4" },
  { mg: 0.5, weeks: "Weeks 5–8" },
  { mg: 1, weeks: "Weeks 9–12" },
  { mg: 1.7, weeks: "Weeks 13–16" },
  { mg: 2.4, weeks: "Weeks 17–20" },
];

function weeksForStrength(strength: string): string | null {
  const match = strength.match(/([\d.]+)\s*mg/i);
  if (!match) return null;
  const mg = Number(match[1]);
  const row = DOSE_WEEK_RANGES.find((d) => Math.abs(d.mg - mg) < 0.01);
  return row?.weeks ?? null;
}

function taskProductTitle(c: Consultation): string {
  const rxName = c.prescriptionItems?.[0]?.name?.trim();
  if (rxName) return rxName;
  return medicationLabelFromOrder(c);
}

function taskVariantLine(c: Consultation): string | null {
  const item = c.prescriptionItems?.[0];
  const strength = item?.strength?.trim();
  const quantity = item?.quantity?.trim();

  if (strength) {
    const weeks = weeksForStrength(strength);
    return weeks ? `${strength} (${weeks})` : strength;
  }
  if (quantity) return quantity;
  return null;
}

function HeroCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 12.2 11 14.7l4.8-5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8v5m0 3h.01M3.5 18.5 11 5a1.2 1.2 0 0 1 2 0l7.5 13.5a1.2 1.2 0 0 1-1 1.8H4.5a1.2 1.2 0 0 1-1-1.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 9h16M8 3v3M16 3v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V5m0 0L8 9m4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TasksListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MyTasks() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ consultations: Consultation[] }>(
          "/api/patient/consultations",
          { auth: "patient" },
        );
        if (!cancelled) setConsultations(data.consultations ?? []);
      } catch {
        if (!cancelled) setConsultations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingTasks = useMemo(
    () =>
      consultations
        .filter(needsDocumentAction)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [consultations],
  );

  const taskCount = pendingTasks.length;
  const greeting = `${greetingPrefix()}, ${patientFirstName()}`;

  return (
    <PatientAccountLayout
      title={greeting}
      subtitle={
        taskCount === 0
          ? "You're all caught up — no documents need uploading right now."
          : `You have ${taskCount} task${taskCount === 1 ? "" : "s"} that need your attention.`
      }
      icon={<HeroCheckIcon />}
      statsChip={
        taskCount > 0
          ? { label: "Pending tasks", value: String(taskCount) }
          : undefined
      }
    >
      <div className="em-tasks">
        <div className="em-tasks-head">
          <h3 className="em-tasks-title">
            <span className="em-tasks-ic">
              <TasksListIcon />
            </span>
            Your Tasks
          </h3>
          {taskCount > 0 ? (
            <span className="em-tasks-badge">{taskCount} pending</span>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : taskCount === 0 ? (
          <div className="em-task-empty">
            <div className="em-empty-ic">
              <HeroCheckIcon />
            </div>
            <p className="em-empty-title">No pending tasks</p>
            <p className="em-empty-sub">
              When we need documents from you, they will appear here.
            </p>
          </div>
        ) : (
          pendingTasks.map((task) => {
            const title = taskProductTitle(task);
            const variant = taskVariantLine(task);
            const imageUrl = productImageForCondition(
              task.conditionId,
              task.prescriptionItems?.[0]?.name ?? title,
            );

            return (
              <div key={task.id} className="em-task-card">
                <div className="em-task-left">
                  <div className="em-task-img">
                    {imageUrl ? (
                      <img src={imageUrl} alt={title} />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          background: "#f0f0f0",
                        }}
                      />
                    )}
                  </div>
                  <div className="em-task-info">
                    <span className="em-task-tag">
                      <WarningIcon />
                      Action needed
                    </span>
                    <h4 className="em-task-name">{title}</h4>
                    {variant ? <p className="em-task-variant">{variant}</p> : null}
                    <p className="em-task-date">
                      <CalendarIcon />
                      Ordered {formatOrderPlacedShort(task.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="em-task-action">
                  <Link
                    href="/pages/upload-documents"
                    className="em-btn em-btn-primary btn-upload"
                  >
                    <UploadIcon />
                    Upload Document
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PatientAccountLayout>
  );
}

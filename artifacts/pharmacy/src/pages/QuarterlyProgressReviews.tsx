import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { apiFetch } from "@/lib/api";
import { buildConsultationDocumentFocusPath } from "@/lib/consultationDocumentFocus";
import {
  buildReviewTimeline,
  countDispatchedPens,
  type ReviewTimelineStep,
} from "@/lib/progressReviewTimeline";
import { toast } from "sonner";

type DocumentSlot = {
  docId: string;
  status: string;
};

type Consultation = {
  id: string;
  conditionName: string;
  status: string;
  answers?: Record<string, unknown>;
  documentSlots?: DocumentSlot[];
};

type ShopOrder = {
  status: string;
  prescriptionItems?: Array<{ quantity?: string }> | null;
  items?: Array<{ quantity?: number }> | null;
};

function ReviewsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8v4l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function TimelineStep({ step }: { step: ReviewTimelineStep }) {
  return (
    <div className={`qr-step is-${step.state}`}>
      <div className="qr-step-dot">
        {step.state === "completed" ? <CheckIcon /> : null}
        {step.state === "locked" ? <LockIcon /> : null}
      </div>
      <div className="qr-step-body">
        <div className="qr-step-label">{step.label}</div>
        <div className="qr-step-sub">{step.subtitle}</div>
        <span className="qr-step-state">{step.stateLabel}</span>
      </div>
    </div>
  );
}

function pickConsultation(rows: Consultation[]): Consultation | null {
  const active = rows.filter((r) => r.status !== "cancelled");
  const pool = active.length > 0 ? active : rows;
  const wl = pool.find((r) =>
    /weight|mounjaro|wegovy|tirzepatide|semaglutide/i.test(r.conditionName),
  );
  return wl ?? pool[0] ?? null;
}

export default function QuarterlyProgressReviews() {
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  const firstName = useMemo(() => {
    const raw = localStorage.getItem("patient_name")?.trim();
    if (!raw) return "there";
    return raw.split(/\s+/)[0] ?? "there";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [consultationRes, orderRes] = await Promise.all([
        apiFetch<{ consultations: Consultation[] }>("/api/patient/consultations", {
          auth: "patient",
        }),
        apiFetch<{ orders: ShopOrder[] }>("/api/orders", { auth: "patient" }),
      ]);
      setConsultations(consultationRes.consultations ?? []);
      setOrders(orderRes.orders ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load progress reviews");
      setConsultations([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const consultation = useMemo(() => pickConsultation(consultations), [consultations]);
  const pensDispensed = useMemo(() => countDispatchedPens(orders), [orders]);

  const timeline = useMemo(
    () =>
      buildReviewTimeline({
        pensDispensed,
        documentSlots: consultation?.documentSlots ?? [],
        answers: consultation?.answers,
      }),
    [pensDispensed, consultation],
  );

  const captureHref = consultation
    ? buildConsultationDocumentFocusPath(consultation.id, "full-body-video")
    : "/pages/upload-documents";

  return (
    <PatientAccountLayout
      title="Progress Reviews"
      subtitle={`Hi ${firstName}, your treatment includes periodic video check-ins to keep things safe and on track.`}
      icon={<ReviewsIcon />}
    >
      {loading ? (
        <div className="qr-loading-wrap">
          <div className="qr-loading-spinner" role="status" aria-label="Loading" />
        </div>
      ) : (
        <>
          {timeline.activeMilestone ? (
            <div className="qr-hero">
              <div className="qr-hero-eyebrow">Review due</div>
              <h3>{timeline.activeMilestone.heroTitle}</h3>
              <p>{timeline.activeMilestone.heroBody}</p>
              <Link href={captureHref} className="qr-hero-btn">
                <VideoIcon />
                <span>Record review videos</span>
              </Link>
              <p className="qr-hero-hint">Opens secure recording page · Best on mobile</p>
            </div>
          ) : (
            <div className="qr-restful">
              <div className="qr-restful-icon">
                <CheckIcon />
              </div>
              <div>
                <h3>You&apos;re all caught up</h3>
                <p>
                  No review is due right now. We&apos;ll email you when your next check-in is
                  ready.
                </p>
              </div>
            </div>
          )}

          <div className="qr-timeline-card">
            <p className="qr-timeline-card-title">Your review timeline</p>
            <div className="qr-timeline">
              {timeline.steps.map((step) => (
                <TimelineStep key={step.id} step={step} />
              ))}
            </div>

            <div className="qr-why">
              <p>
                <strong>Why we ask for these</strong>
              </p>
              <p>
                Periodic video reviews let our prescribers confirm your treatment remains safe
                and effective and that your dose is still right for you. Videos are only seen by
                our clinical team and stored securely.
              </p>
            </div>
          </div>
        </>
      )}
    </PatientAccountLayout>
  );
}

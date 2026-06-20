import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { buildConsultationDocumentFocusPath } from "@/lib/consultationDocumentFocus";
import { displayConsultationNumber } from "@/lib/patientOrderContext";
import { toast } from "sonner";
import {
  getSlotMeta,
  PATIENT_IMAGE_ACCEPT,
  validatePatientDocumentFile,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";

type DocumentSlotStatus = "required" | "uploaded" | "verified" | "rejected";

type DocumentSlot = {
  docId: string;
  docTitle: string;
  status: DocumentSlotStatus;
  uploadedAt?: string;
  uploadCount?: number;
};

type Consultation = {
  id: string;
  consultationNumber?: string | null;
  conditionName: string;
  status: string;
  documentSlots?: DocumentSlot[];
};

type DocPreview = {
  dataUrl: string;
  uploads?: { dataUrl: string }[];
};

const ID_GUIDE_IMG =
  "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/Container_3.png?v=1770738449";
const RX_GUIDE_IMG =
  "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/Container_6.png?v=1770738703";

function pickTargetConsultation(rows: Consultation[]): Consultation | null {
  const active = rows.filter((r) => r.status !== "cancelled");
  const pool = active.length > 0 ? active : rows;
  if (pool.length === 0) return null;

  const priority = [
    "more_info_needed",
    "red_flag",
    "patient_responded",
    "pending",
    "approved",
  ] as const;

  for (const status of priority) {
    const found = pool.find((r) => r.status === status);
    if (found) return found;
  }
  return pool[0];
}

function slotFor(consultation: Consultation | null, docId: string): DocumentSlot | undefined {
  return consultation?.documentSlots?.find((s) => s.docId === docId);
}

function isSlotComplete(status?: DocumentSlotStatus): boolean {
  return status === "uploaded" || status === "verified";
}

function badgeClass(status: "pending" | "uploaded" | "verified" | "partial"): string {
  return `ud-card-badge ${status}`;
}

function badgeLabel(status: "pending" | "uploaded" | "verified" | "partial"): string {
  if (status === "verified") return "Verified";
  if (status === "uploaded") return "Uploaded";
  if (status === "partial") return "In progress";
  return "Pending";
}

function HeroUploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function ChevronDown() {
  return (
    <svg className="ud-card-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GuidelinesToggle({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <>
      <button
        type="button"
        className={`ud-view-guidelines-label${collapsed ? " is-collapsed" : ""}`}
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <ChevronDown />
        <span>{title}</span>
      </button>
      <div className={`ud-guidelines-detail${collapsed ? " is-collapsed" : ""}`}>
        <div className="ud-guidelines-detail-inner">{children}</div>
      </div>
    </>
  );
}

function UdCard({
  cardKey,
  title,
  subtitle,
  badge,
  complete,
  defaultExpanded = true,
  children,
}: {
  cardKey: string;
  title: string;
  subtitle: string;
  badge: "pending" | "uploaded" | "verified" | "partial";
  complete: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`ud-card${complete ? " is-complete" : ""}${expanded ? " is-expanded" : ""}`}
      data-key={cardKey}
    >
      <button
        type="button"
        className="ud-card-header"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="ud-card-icon">{cardKey === "id_card" ? <IdIcon /> : cardKey === "video_verification" ? <VideoIcon /> : <RxIcon />}</div>
        <div className="ud-card-info">
          <p className="ud-card-title">{title}</p>
          <p className="ud-card-subtitle">{subtitle}</p>
        </div>
        <span className={badgeClass(badge)}>{badgeLabel(badge)}</span>
        <ChevronDown />
      </button>
      <div className="ud-card-body">
        <div className="ud-card-body-inner">{children}</div>
      </div>
    </div>
  );
}

function IdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8.5" cy="11" r="2.5" />
      <path d="M14 10h4M14 14h2" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function RxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

async function fetchDocPreview(
  consultationId: string,
  docId: EvidenceSlotId,
): Promise<DocPreview | null> {
  try {
    return await apiFetch<DocPreview>(
      `/api/patient/consultations/${consultationId}/documents/${docId}`,
      { auth: "patient" },
    );
  } catch {
    return null;
  }
}

async function uploadDocument(
  consultationId: string,
  docId: EvidenceSlotId,
  file: File,
): Promise<void> {
  const check = validatePatientDocumentFile(file, docId);
  if (!check.ok) throw new Error(check.message);

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const meta = getSlotMeta(docId);
  await apiFetch(`/api/consultations/${consultationId}/patient-documents`, {
    method: "POST",
    auth: "patient",
    body: JSON.stringify({
      docId,
      dataUrl,
      messageBody: `Uploaded ${meta.title} via Upload Documents.`,
    }),
  });
}

export default function PatientUploadDocumentsHub() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Partial<Record<EvidenceSlotId, DocPreview>>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rxFileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadRef = useRef<{ docId: EvidenceSlotId } | null>(null);

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ consultations: Consultation[] }>(
        "/api/patient/consultations",
        { auth: "patient" },
      );
      setConsultations(data.consultations ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load consultations");
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConsultations();
  }, [loadConsultations]);

  const consultation = useMemo(
    () => pickTargetConsultation(consultations),
    [consultations],
  );

  const idSlot = slotFor(consultation ?? null, "government-id");
  const fullBodySlot = slotFor(consultation ?? null, "full-body-video");
  const weightSlot = slotFor(consultation ?? null, "weight-scale-video");
  const rxSlot = slotFor(consultation ?? null, "previous-prescription");

  const idComplete = isSlotComplete(idSlot?.status);
  const fullBodyDone = isSlotComplete(fullBodySlot?.status);
  const weightDone = isSlotComplete(weightSlot?.status);
  const videoComplete = fullBodyDone && weightDone;
  const videoPartial = (fullBodyDone || weightDone) && !videoComplete;
  const rxComplete = isSlotComplete(rxSlot?.status);

  const progress = useMemo(() => {
    let completed = 0;
    if (idComplete) completed++;
    if (videoComplete) completed++;
    if (rxComplete) completed++;
    return { completed, total: 3 };
  }, [idComplete, videoComplete, rxComplete]);

  const idBadge: "pending" | "uploaded" | "verified" | "partial" =
    idSlot?.status === "verified"
      ? "verified"
      : idComplete
        ? "uploaded"
        : "pending";

  const videoBadge: "pending" | "uploaded" | "verified" | "partial" = videoComplete
    ? "uploaded"
    : videoPartial
      ? "partial"
      : "pending";

  const rxBadge: "pending" | "uploaded" | "verified" | "partial" = rxComplete
    ? "uploaded"
    : "pending";

  const loadPreviews = useCallback(async (cId: string) => {
    const slots: EvidenceSlotId[] = [
      "government-id",
      "full-body-video",
      "weight-scale-video",
      "previous-prescription",
    ];
    const results = await Promise.all(
      slots.map(async (docId) => {
        const preview = await fetchDocPreview(cId, docId);
        return [docId, preview] as const;
      }),
    );
    const next: Partial<Record<EvidenceSlotId, DocPreview>> = {};
    for (const [docId, preview] of results) {
      if (preview) next[docId] = preview;
    }
    setPreviews(next);
  }, []);

  useEffect(() => {
    if (!consultation?.id) {
      setPreviews({});
      return;
    }
    void loadPreviews(consultation.id);
  }, [consultation?.id, loadPreviews]);

  const triggerUpload = (docId: EvidenceSlotId, input: HTMLInputElement | null) => {
    if (!consultation) {
      toast.error("Start a consultation before uploading documents.");
      return;
    }
    pendingUploadRef.current = { docId };
    input?.click();
  };

  const handleFileSelected = async (file: File | undefined) => {
    const pending = pendingUploadRef.current;
    if (!file || !pending || !consultation) return;

    setUploading(true);
    try {
      await uploadDocument(consultation.id, pending.docId, file);
      toast.success("Document uploaded successfully.");
      await loadConsultations();
      await loadPreviews(consultation.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      pendingUploadRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (rxFileInputRef.current) rxFileInputRef.current.value = "";
    }
  };

  const idPreviewUrl = previews["government-id"]?.dataUrl;
  const fullBodyUrl = previews["full-body-video"]?.dataUrl;
  const weightUrl = previews["weight-scale-video"]?.dataUrl;
  const rxUploads =
    previews["previous-prescription"]?.uploads?.map((u) => u.dataUrl).filter(Boolean) ??
    (previews["previous-prescription"]?.dataUrl
      ? [previews["previous-prescription"]!.dataUrl]
      : []);
  const rxCount = rxUploads.length;

  const orderRef = consultation
    ? displayConsultationNumber(consultation.consultationNumber, consultation.id)
    : null;
  const consultationLabel = consultation
    ? `${consultation.conditionName} · ${orderRef}`
    : null;

  return (
    <PatientAccountLayout
      title="Upload Documents"
      subtitle="Complete all three sections below so our prescriber can review your order."
      icon={<HeroUploadIcon />}
      progress={progress}
      flushContent
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={PATIENT_IMAGE_ACCEPT}
        hidden
        onChange={(e) => void handleFileSelected(e.target.files?.[0])}
      />
      <input
        ref={rxFileInputRef}
        type="file"
        accept={getSlotMeta("previous-prescription").accept}
        hidden
        onChange={(e) => {
          pendingUploadRef.current = { docId: "previous-prescription" };
          void handleFileSelected(e.target.files?.[0]);
        }}
      />

      {loading ? (
        <div className="ud-cards-container">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {consultationLabel ? (
            <p className="ud-hub-context">
              Showing documents for <strong>{consultationLabel}</strong>.{" "}
              <Link href={buildConsultationDocumentFocusPath(consultation!.id)}>
                View in My Consultations
              </Link>
            </p>
          ) : (
            <p className="ud-hub-context">
              No active consultation found.{" "}
              <Link href="/consultation">Start a consultation</Link> to upload your documents.
            </p>
          )}

          <div className="ud-cards-container">
            <UdCard
              cardKey="id_card"
              title="Photo ID"
              subtitle="Secure identity verification by Yoti"
              badge={idBadge}
              complete={idComplete}
              defaultExpanded={!idComplete}
            >
              {idPreviewUrl ? (
                <div className="ud-preview-area is-visible">
                  <img src={idPreviewUrl} alt="Verified ID" />
                  <p>Need to redo your ID verification?</p>
                  <button
                    type="button"
                    className="ud-reupload-btn"
                    disabled={uploading || !consultation}
                    onClick={() => triggerUpload("government-id", fileInputRef.current)}
                  >
                    <RefreshIcon />
                    Re-verify with Yoti
                  </button>
                </div>
              ) : (
                <div className="ud-upload-zone">
                  <div className="ud-upload-zone-icon">
                    <IdIcon />
                  </div>
                  <p>Drag and drop your photo ID here, or</p>
                  <button
                    type="button"
                    className="ud-browse-link"
                    disabled={uploading || !consultation}
                    onClick={() => triggerUpload("government-id", fileInputRef.current)}
                  >
                    browse to upload
                  </button>
                  <p className="ud-accepted-types">JPG, PNG, WEBP, HEIC</p>
                </div>
              )}

              <div className="ud-guidelines-row">
                <img src={ID_GUIDE_IMG} alt="Photo ID examples" loading="lazy" />
              </div>
              <GuidelinesToggle title="View Guidelines">
                <p className="ud-gd-title">What you&apos;ll need:</p>
                <ul>
                  <li>A valid government-issued photo ID (passport, driving licence, or national ID)</li>
                  <li>A device with a camera (phone or laptop webcam)</li>
                  <li>Good lighting and a clear view of your face</li>
                  <li>Around 2 minutes to complete the flow</li>
                </ul>
                <div className="ud-why-section">
                  <p><strong>Why Yoti?</strong></p>
                  <p>
                    Yoti verifies your identity to a regulated standard required for prescribing
                    medication. Your ID and biometric data are handled under Yoti&apos;s secure,
                    GDPR-compliant infrastructure — we only receive the verified result and a copy
                    of your ID for your patient record.
                  </p>
                </div>
              </GuidelinesToggle>
            </UdCard>

            <UdCard
              cardKey="video_verification"
              title="Video Verification"
              subtitle="Full body & weight scale recordings"
              badge={videoBadge}
              complete={videoComplete}
              defaultExpanded={idComplete && !videoComplete}
            >
              <div className="ud-video-slots">
                <div className={`ud-video-slot${fullBodyUrl ? " is-filled" : ""}`}>
                  {fullBodyUrl ? (
                    <video
                      className="ud-video-slot-preview"
                      src={`${fullBodyUrl}#t=0.1`}
                      playsInline
                      muted
                      loop
                      preload="metadata"
                    />
                  ) : (
                    <div className="ud-video-slot-icon">
                      <VideoIcon />
                    </div>
                  )}
                  <div className="ud-video-slot-label">Video 1</div>
                  <div className="ud-video-slot-title">Full body</div>
                  <div className="ud-video-slot-status">
                    <span className="ud-video-slot-status-dot" />
                    <span>{fullBodyDone ? "Recorded" : "Not recorded"}</span>
                  </div>
                </div>

                <div className={`ud-video-slot${weightUrl ? " is-filled" : ""}`}>
                  {weightUrl ? (
                    <video
                      className="ud-video-slot-preview"
                      src={`${weightUrl}#t=0.1`}
                      playsInline
                      muted
                      loop
                      preload="metadata"
                    />
                  ) : (
                    <div className="ud-video-slot-icon">
                      <VideoIcon />
                    </div>
                  )}
                  <div className="ud-video-slot-label">Video 2</div>
                  <div className="ud-video-slot-title">Weight scale</div>
                  <div className="ud-video-slot-status">
                    <span className="ud-video-slot-status-dot" />
                    <span>{weightDone ? "Recorded" : "Not recorded"}</span>
                  </div>
                </div>
              </div>

              {consultation ? (
                <Link
                  href={buildConsultationDocumentFocusPath(
                    consultation.id,
                    "full-body-video",
                  )}
                  className="ud-capture-btn"
                >
                  <VideoIcon />
                  <span>Re-record Videos</span>
                </Link>
              ) : (
                <button type="button" className="ud-capture-btn" disabled>
                  <VideoIcon />
                  <span>Re-record Videos</span>
                </button>
              )}
              <p className="ud-capture-hint">Opens secure recording page · Best on mobile</p>

              <GuidelinesToggle title="View Guidelines">
                <p className="ud-gd-title">Full Body Video (10 seconds)</p>
                <ul>
                  <li>Clearly shows your face and full body</li>
                  <li>Stand up and slowly turn 360°</li>
                  <li>Fitted clothing for accurate assessment</li>
                  <li>Good lighting, stable camera</li>
                </ul>
                <p className="ud-gd-title">Weight Scale Video (5 seconds)</p>
                <ul>
                  <li>Stand on scale with both feet visible</li>
                  <li>Weight reading clearly shown on display</li>
                  <li>Reading should be settled, not fluctuating</li>
                  <li>Numbers sharp and readable</li>
                </ul>
                <div className="ud-why-section">
                  <p><strong>Why we need these videos</strong></p>
                  <p>
                    Short videos let our prescribers assess your suitability for treatment and
                    verify your current weight more accurately than photos alone. Both are only
                    viewed by our clinical team and stored securely.
                  </p>
                </div>
              </GuidelinesToggle>
            </UdCard>

            <UdCard
              cardKey="previous_prescription"
              title="Previous Prescription"
              subtitle="Proof of recent medication & dosage"
              badge={rxBadge}
              complete={rxComplete}
              defaultExpanded={idComplete && videoComplete && !rxComplete}
            >
              {rxCount > 0 ? (
                <p className="ud-multi-upload-count">
                  <strong>{rxCount}</strong> document{rxCount > 1 ? "s" : ""} uploaded
                </p>
              ) : null}

              <div className="ud-multi-preview-grid">
                {rxUploads.map((url, i) => (
                  <div key={`${url.slice(0, 32)}-${i}`} className="ud-multi-preview-item">
                    <img src={url} alt={`Prescription ${i + 1}`} />
                    <span className="ud-multi-badge">✓</span>
                  </div>
                ))}
                <button
                  type="button"
                  className="ud-multi-add-more"
                  title="Upload another document"
                  disabled={uploading || !consultation}
                  onClick={() => triggerUpload("previous-prescription", rxFileInputRef.current)}
                >
                  <PlusIcon />
                  <span>Add</span>
                </button>
              </div>

              <div className="ud-guidelines-row">
                <img src={RX_GUIDE_IMG} alt="Prescription examples" loading="lazy" />
              </div>
              <GuidelinesToggle title="View Guidelines">
                <p className="ud-gd-title">Your proof of prescription must clearly show:</p>
                <ul>
                  <li>Proof of previous prescription or dispensing label</li>
                  <li>Full name visible</li>
                  <li>Date of order/supply visible</li>
                  <li>Medication name & strength visible</li>
                </ul>
                <div className="ud-why-section">
                  <p><strong>Why we need previous prescriptions</strong></p>
                  <p>
                    If you&apos;re ordering any dose above 2.5mg but haven&apos;t previously
                    purchased from us, we need proof that you&apos;ve been prescribed this
                    medication before. This ensures your safety and that the dose is appropriate
                    for you.
                  </p>
                </div>
              </GuidelinesToggle>
            </UdCard>
          </div>
        </>
      )}
    </PatientAccountLayout>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { usePatientsContext } from "@/context/PatientsContext";
import { useToast } from "@/hooks/use-toast";
import {
  hasDisplayValue,
  isRxClinicallyPreChecked,
  patientAddressOrUndefined,
  prescriptionSourceCode,
} from "@/lib/pmrStatus";
import { postPmrClinicalCheck } from "@/lib/pmrWorkflowApi";
import {
  prescriptionPdfEmbedUrl,
  prescriptionPdfUrl,
} from "@/lib/pharmacistSession";
import { PrescriptionPdfViewer } from "@/components/PrescriptionPdfViewer";
import { PatientPmrModal } from "@/components/PatientPmrModal";
import {
  ClinicalCheckToolbar,
  GpPrescribingSection,
  MedicationCheckSection,
  PatientMatchSection,
  type EditablePrescriptionItem,
  type ItemDecision,
} from "@/components/ClinicalCheckSections";

function formatSex(sex?: string | null): string | undefined {
  if (!sex?.trim()) return undefined;
  return sex.charAt(0).toUpperCase() + sex.slice(1);
}

function formatDobWithAge(consultation: {
  patientAge?: number | null;
  answers?: Record<string, unknown>;
}): string | undefined {
  const answers = consultation.answers ?? {};
  const fromAnswers =
    (answers.dateOfBirth as string | undefined) ??
    (answers.dob as string | undefined);

  let dobLabel: string | undefined;
  let age = consultation.patientAge ?? null;

  if (fromAnswers) {
    try {
      const born = new Date(fromAnswers);
      dobLabel = born.toLocaleDateString("en-GB");
      if (age == null && !Number.isNaN(born.getTime())) {
        const today = new Date();
        age =
          today.getFullYear() -
          born.getFullYear() -
          (today <
          new Date(today.getFullYear(), born.getMonth(), born.getDate())
            ? 1
            : 0);
      }
    } catch {
      dobLabel = fromAnswers;
    }
  } else if (age != null) {
    const year = new Date().getFullYear() - age;
    dobLabel = `Born ≈ ${year}`;
  }

  if (!dobLabel) return age != null ? `Age ${age}` : undefined;
  if (age != null) return `${dobLabel} · age ${age}`;
  return dobLabel;
}

function formatNhsNumber(consultation: {
  answers?: Record<string, unknown>;
  identityVerificationRef?: string | null;
}): string | undefined {
  const answers = consultation.answers ?? {};
  const fromAnswers =
    (answers.nhsNumber as string | undefined) ??
    (answers.nhs_number as string | undefined);
  if (fromAnswers?.trim()) return fromAnswers.trim();
  const idRef = consultation.identityVerificationRef?.trim();
  if (idRef && hasDisplayValue(idRef) && !idRef.toLowerCase().startsWith("idv-")) {
    return idRef;
  }
  return undefined;
}

export function ClinicalCheck() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [, navigate] = useLocation();
  const { approved, approvedLoading, refreshApproved } = usePatientsContext();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [itemDecisions, setItemDecisions] = useState<
    Record<number, ItemDecision>
  >({});
  const [editedItems, setEditedItems] = useState<EditablePrescriptionItem[]>(
    [],
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftQty, setDraftQty] = useState("");
  const [draftSig, setDraftSig] = useState("");
  const [pmrModalOpen, setPmrModalOpen] = useState(false);

  const consultation = useMemo(
    () => approved.find((c) => c.id === id) ?? null,
    [approved, id],
  );

  const items = editedItems.length > 0 ? editedItems : (consultation?.prescriptionItems ?? []);

  useEffect(() => {
    if (!consultation?.prescriptionItems) return;
    setEditedItems(consultation.prescriptionItems.map((item) => ({ ...item })));
    setItemDecisions({});
    setEditingIndex(null);
  }, [consultation?.id, consultation?.prescriptionItems]);

  const allAccepted =
    items.length > 0 &&
    items.every((_, idx) => itemDecisions[idx] === "accept");
  const anyRejected = items.some((_, idx) => itemDecisions[idx] === "reject");
  const canComplete = allAccepted && !anyRejected;

  const totalSteps = 2 + items.length;

  useEffect(() => {
    if (!consultation || approvedLoading) return;
    if (isRxClinicallyPreChecked(consultation)) {
      navigate(`/queue`);
    }
  }, [consultation, approvedLoading, navigate]);

  async function completeCheck(action: "accept" | "do_not_dispense") {
    if (!consultation) return;
    setSubmitting(true);
    try {
      await postPmrClinicalCheck(consultation.id, { action });
      toast({
        title:
          action === "accept"
            ? "Clinical check complete"
            : "Prescription parked",
        description:
          action === "accept"
            ? "Ready to pick from dispensary stock."
            : "Marked do not dispense — moved to Parked.",
      });
      refreshApproved();
      navigate("/queue");
    } catch (err) {
      toast({
        title: "Could not save clinical check",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(index: number) {
    const item = items[index];
    if (!item) return;
    setEditingIndex(index);
    setDraftQty(item.quantity ?? "");
    setDraftSig(item.sig ?? "");
  }

  function saveEdit() {
    if (editingIndex === null) return;
    setEditedItems((prev) =>
      prev.map((item, idx) =>
        idx === editingIndex
          ? { ...item, quantity: draftQty, sig: draftSig }
          : item,
      ),
    );
    setEditingIndex(null);
  }

  if (approvedLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading prescription…
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">Prescription not found.</p>
        <Link href="/queue" className="text-sm text-primary hover:underline">
          Back to board
        </Link>
      </div>
    );
  }

  const pdfUrl = prescriptionPdfUrl(consultation.id);
  const pdfEmbedUrl = prescriptionPdfEmbedUrl(consultation.id);
  const rxDate = consultation.reviewedAt
    ? new Date(consultation.reviewedAt).toLocaleDateString("en-GB")
    : new Date(consultation.createdAt).toLocaleDateString("en-GB");
  const patientMatched = Boolean(consultation.patientEmail && consultation.patientName);
  const treatmentType =
    consultation.previousConsultationId != null ? "Repeat" : "Acute";
  const sourceLabel = prescriptionSourceCode(consultation);
  const rxSubtitle = [
    consultation.conditionName,
    consultation.prescriptionItems?.[0]?.name,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/30">
      <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">
        <aside className="lg:w-[45%] xl:w-[42%] shrink-0 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border/50 max-h-[42vh] lg:max-h-none p-4 sm:p-5 lg:p-6">
          <PrescriptionPdfViewer
            pdfUrl={pdfUrl}
            embedUrl={pdfEmbedUrl}
            title={`Prescription — ${consultation.patientName}`}
            headerLabel={sourceLabel}
            headerSubtitle={rxSubtitle || consultation.patientName}
            statusLabel="Awaiting check"
            className="flex-1 min-h-0"
            testId="clinical-check-prescription-pdf"
          />
        </aside>

        <section className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 lg:py-6">
            <div className="max-w-3xl mx-auto">
              <GpPrescribingSection
                step={1}
                isLast={totalSteps === 1}
                rxDate={rxDate}
                itemCount={items.length}
                treatmentType={treatmentType}
                conditionName={consultation.conditionName}
              />

              <PatientMatchSection
                step={2}
                isLast={totalSteps === 2}
                patientName={consultation.patientName || "Unknown patient"}
                dateOfBirth={formatDobWithAge(consultation)}
                sex={formatSex(consultation.patientSex)}
                nhsNumber={formatNhsNumber(consultation)}
                address={patientAddressOrUndefined(consultation)}
                allergies={consultation.allergies}
                surgery={consultation.gpSurgery}
                patientMatched={patientMatched}
                showDeliveryBadge={
                  consultation.consentToDelivery !== false ||
                  Boolean(consultation.preferredDeliveryMethod)
                }
                onPatientNameClick={() => setPmrModalOpen(true)}
              />

              {items.map((item, idx) => (
                <MedicationCheckSection
                  key={`${item.name}-${idx}`}
                  step={3 + idx}
                  isLast={idx === items.length - 1}
                  item={item}
                  decision={itemDecisions[idx] ?? null}
                  onDecision={(d) =>
                    setItemDecisions((prev) => ({ ...prev, [idx]: d }))
                  }
                  editing={editingIndex === idx}
                  onEdit={() => startEdit(idx)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingIndex(null)}
                  draftQty={draftQty}
                  draftSig={draftSig}
                  onDraftQty={setDraftQty}
                  onDraftSig={setDraftSig}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <ClinicalCheckToolbar
        submitting={submitting}
        canComplete={canComplete}
        anyRejected={anyRejected}
        onBack={() => navigate("/queue")}
        onPrint={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
        onSkip={() => navigate("/queue")}
        onSaveExit={() => navigate("/queue")}
        onComplete={() => void completeCheck("accept")}
        onPark={() => void completeCheck("do_not_dispense")}
      />

      <PatientPmrModal
        open={pmrModalOpen}
        onOpenChange={setPmrModalOpen}
        patientEmail={consultation.patientEmail}
        patientName={consultation.patientName}
        allergies={consultation.allergies}
        nhsNumber={formatNhsNumber(consultation)}
        address={patientAddressOrUndefined(consultation)}
      />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Pencil,
  Eye,
  ClipboardCheck,
  MessageSquare,
  FileText,
  Clock,
  Users,
  TrendingUp,
  StickyNote,
  Activity as ActivityIcon,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Phone,
  Plus,
  Bookmark,
  Pin,
  Flag as FlagIcon,
  Mail,
  AlertTriangle,
  Send,
  XCircle,
  X,
} from "lucide-react";
import {
  getGetConsultationQueryKey,
  useGetConsultation,
  useListConsultations,
  useReviewConsultation,
  type Consultation,
  type ConsultationReviewInputAction,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ClinicalReviewBmiHistory } from "@/components/PatientMeasurementTracker";
import { MonitoringTab } from "@/components/MonitoringTab";
import { DocumentsTabPro } from "@/components/DocumentsTabPro";
import { MessagesTab } from "@/components/MessagesTab";
import { PatientChatPanel } from "@/components/PatientChatPanel";
import { WeightLossClinicalReview, WEIGHT_LOSS_BUNDLED_ANSWER_KEYS } from "@/components/WeightLossClinicalReview";
import { DateField } from "@/components/DateField";
import { PatientDetailsEditorDialog } from "@/components/PatientDetailsEditorDialog";
import { toIsoDate } from "@workspace/date-picker";
import { OrderHistoryTab } from "@/components/OrderHistoryTab";
import { BmiCalculatorDialog } from "@/components/BmiCalculatorDialog";
import { isInjectableWeightLossOrder } from "@/lib/clinicalReview";
import { apiFetch } from "@/lib/api";
import { showVerificationFeedbackToast } from "@/lib/verificationFeedbackToast";
import {
  deliveryAddressFromProfile,
  fmtAddress,
  fmtDob,
  fmtGp,
  fmtName,
  PROFILE_FIELD_META,
  profileFromConsultation,
  type PatientProfileState,
} from "@/lib/patientProfile";
import {
  type ActivityEvent,
  type ActivityOrderSection,
  ACTIVITY_KIND_STYLES,
  ACTIVITY_LEGEND_KINDS,
  activityEventBorderClass,
  activityForDocumentReview,
  activityForDocumentRequirementChange,
  activityForWaitTag,
  activityForUploadLinkSent,
  activityForMedicationChange,
  activityForPrescriptionApproved,
  activityForProfileEdits,
  activityForTabVerified,
  activityForUrgent,
  buildMultiOrderActivityTimeline,
  communicationsFromConsultationMessages,
  createActivityEvent,
  groupActivityEvents,
  orderStatusBadgeClass,
  readSessionActivity,
  type PatientCommunication,
  writeSessionActivity,
} from "@/lib/orderActivity";
import { plainActivityText } from "@/lib/plainText";
import {
  bmiHighlightClass,
  formatEthnicityLabel,
  resolveConsultationBmi,
  getPatientJourneyType,
  JOURNEY_BADGE,
  parseOrderMedication,
} from "@/lib/orderPatientUi";
import { OrderPatientHeader, ActionCard, ClinicalReviewOrderSummary, ClinicalReviewNhsScr } from "@/components/rx";
import { ClinicalQaList } from "@/components/rx/ClinicalQaDisplay";
import { RX } from "@/lib/orderTheme";
import {
  buildWaitTag,
  upsertSessionWaitTag,
} from "@/lib/orderWaitingTags";
import { evaluateWeightChangeMonitoring } from "@/lib/weightChangeMonitoring";
import {
  countUnreadMessages,
  countUnreadNotes,
  markMessagesSeen,
  markNotesSeen,
  readStoredNotes,
  writeStoredNotes,
  type ClinicalNote,
} from "@/lib/tabUnreadState";

type TabId =
  | "clinical"
  | "consultation"
  | "documents"
  | "messages"
  | "history"
  | "counselling"
  | "monitoring"
  | "notes"
  | "activity";

const TABS: {
  id: TabId;
  label: string;
  icon: typeof ClipboardCheck;
  badge?: string;
}[] = [
  { id: "clinical", label: "Clinical Review", icon: ClipboardCheck },
  { id: "consultation", label: "Consultation", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "history", label: "Order History", icon: Clock },
  { id: "counselling", label: "Patient Counselling", icon: Users },
  { id: "monitoring", label: "Monitoring", icon: TrendingUp },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "messages", label: "Messages", icon: Mail },
];

const VERIFIABLE_TABS = [
  "clinical",
  "consultation",
  "documents",
  "history",
  "counselling",
  "monitoring",
] as const satisfies readonly TabId[];

type VerifiableTabId = (typeof VERIFIABLE_TABS)[number];

type VerificationRecord = {
  verifiedBy: string;
  verifiedAt: string;
};

type VerificationState = Partial<Record<VerifiableTabId, VerificationRecord>>;

const CURRENT_PHARMACIST_NAME = "Mostafa Damghani";

const CHECKLIST_ITEMS: { id: VerifiableTabId; label: string }[] = [
  { id: "clinical", label: "Clinical Review" },
  { id: "consultation", label: "Consultation" },
  { id: "documents", label: "Documents" },
  { id: "history", label: "Order History" },
  { id: "counselling", label: "Patient Counselling" },
  { id: "monitoring", label: "Monitoring" },
];

function orderRefFromId(id: string, consultationNumber?: string | null): string {
  if (consultationNumber?.trim()) return consultationNumber.trim();
  return "#" + id.replace(/-/g, "").toUpperCase().slice(-5);
}

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function isVerifiableTabId(value: TabId): value is VerifiableTabId {
  return VERIFIABLE_TABS.includes(value as VerifiableTabId);
}

function tabFromLocation(location: string): TabId | null {
  const [, search = ""] = location.split("?");
  const tab = new URLSearchParams(search).get("tab");
  return isTabId(tab) ? tab : null;
}

function verificationStorageKey(orderId: string): string {
  return `pharmacare:rx-review-verifications:${orderId}`;
}

function readVerificationState(orderId: string): VerificationState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(verificationStorageKey(orderId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as VerificationState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeVerificationState(orderId: string, state: VerificationState) {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(state).length === 0) {
      window.localStorage.removeItem(verificationStorageKey(orderId));
      return;
    }
    window.localStorage.setItem(
      verificationStorageKey(orderId),
      JSON.stringify(state),
    );
  } catch {
    /* localStorage unavailable */
  }
}

function useOrderVerifications(orderId: string) {
  const [state, setState] = useState<VerificationState>(() =>
    readVerificationState(orderId),
  );

  useEffect(() => {
    writeVerificationState(orderId, state);
  }, [orderId, state]);

  const markDone = (section: VerifiableTabId) => {
    setState((current) => ({
      ...current,
      [section]: {
        verifiedBy: CURRENT_PHARMACIST_NAME,
        verifiedAt: new Date().toISOString(),
      },
    }));
  };

  const undo = (section: VerifiableTabId) => {
    setState((current) => {
      const next = { ...current };
      delete next[section];
      return next;
    });
  };

  return { markDone, state, undo };
}

function formatVerifiedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `at ${time} on ${date}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetail({ id }: { id: string }) {
  const { data: c, isLoading } = useGetConsultation(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [tab, setTab] = useState<TabId>(
    () => tabFromLocation(location) ?? "clinical",
  );
  const [messageDraft, setMessageDraft] = useState("");
  const [chatClosed, setChatClosed] = useState(false);
  const [patientChatOpen, setPatientChatOpen] = useState(() =>
    new URLSearchParams(location.split("?")[1] ?? "").get("chat") === "open",
  );

  useEffect(() => {
    const onTogglePatientChat = () => setPatientChatOpen((current) => !current);
    const onOpenPatientChat = () => setPatientChatOpen(true);
    window.addEventListener("pharmacare:toggle-patient-chat", onTogglePatientChat);
    window.addEventListener("pharmacare:open-patient-chat", onOpenPatientChat);
    return () => {
      window.removeEventListener("pharmacare:toggle-patient-chat", onTogglePatientChat);
      window.removeEventListener("pharmacare:open-patient-chat", onOpenPatientChat);
    };
  }, []);

  useEffect(() => {
    if (new URLSearchParams(location.split("?")[1] ?? "").get("chat") === "open") {
      setPatientChatOpen(true);
    }
  }, [location]);

  const {
    markDone: markSectionDone,
    state: verifications,
    undo: undoSectionDone,
  } = useOrderVerifications(id);

  const [sessionActivity, setSessionActivity] = useState<ActivityEvent[]>([]);
  const [inboxRevision, setInboxRevision] = useState(0);
  const [notesRevision, setNotesRevision] = useState(0);
  const [patientOrders, setPatientOrders] = useState<Consultation[]>([]);
  const [commsByOrderId, setCommsByOrderId] = useState<
    Record<string, PatientCommunication[]>
  >({});

  useEffect(() => {
    if (!c) return;
    setSessionActivity(readSessionActivity(c.id));
  }, [c?.id]);

  useEffect(() => {
    if (!c?.patientEmail) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch<{ consultations: Consultation[] }>(
          `/api/consultations/patient/${encodeURIComponent(c.patientEmail)}`,
        );
        if (!cancelled) setPatientOrders(res.consultations ?? []);
      } catch {
        if (!cancelled) setPatientOrders(c ? [c] : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [c?.patientEmail, c?.id]);

  useEffect(() => {
    if (!c?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch<{
          messages: Array<{
            id: string;
            senderRole: string;
            senderName: string;
            body: string;
            createdAt: string;
            kind?: string;
          }>;
        }>(`/api/consultations/${c.id}/messages`);
        if (cancelled) return;
        setCommsByOrderId((prev) => ({
          ...prev,
          [c.id]: communicationsFromConsultationMessages(
            res.messages ?? [],
            c.patientName,
          ),
        }));
      } catch {
        /* API offline - queue still works; messages tab may be empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [c?.id, c?.patientName]);

  useEffect(() => {
    if (patientOrders.length === 0) return;
    let cancelled = false;
    void (async () => {
      const next: Record<string, PatientCommunication[]> = {};
      await Promise.all(
        patientOrders.map(async (order) => {
          try {
            const res = await apiFetch<{
              messages: Array<{
                id: string;
                senderRole: string;
                senderName: string;
                body: string;
                createdAt: string;
                kind?: string;
              }>;
            }>(`/api/consultations/${order.id}/messages`);
            next[order.id] = communicationsFromConsultationMessages(
              res.messages ?? [],
              order.patientName,
            );
          } catch {
            next[order.id] = [];
          }
        }),
      );
      if (!cancelled) setCommsByOrderId(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientOrders]);

  const activitySections = useMemo((): ActivityOrderSection[] => {
    if (!c) return [];
    const orders =
      patientOrders.length > 0
        ? patientOrders
        : [c];
    const communicationsByConsultationId: Record<
      string,
      PatientCommunication[]
    > = { ...commsByOrderId };
    communicationsByConsultationId[c.id] = commsByOrderId[c.id] ?? [];

    const sessionByConsultationId: Record<string, ActivityEvent[]> = {
      [c.id]: sessionActivity,
    };
    for (const order of orders) {
      if (order.id !== c.id && !sessionByConsultationId[order.id]) {
        sessionByConsultationId[order.id] = readSessionActivity(order.id);
      }
    }

    return buildMultiOrderActivityTimeline({
      currentConsultationId: c.id,
      consultations: orders,
      communicationsByConsultationId,
      sessionByConsultationId,
    });
  }, [c, patientOrders, commsByOrderId, sessionActivity]);

  const activePatientComms = useMemo(() => {
    const comms = commsByOrderId[c?.id ?? ""] ?? [];
    return [...comms].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    );
  }, [c?.id, commsByOrderId]);

  const storedNotes = useMemo(
    () => (c ? readStoredNotes(c.id) : []),
    [c?.id, notesRevision],
  );

  const unreadMessageCount = useMemo(
    () => (c ? countUnreadMessages(c.id, activePatientComms) : 0),
    [c?.id, activePatientComms, inboxRevision],
  );

  const unreadNotesCount = useMemo(
    () => (c ? countUnreadNotes(c.id, storedNotes) : 0),
    [c?.id, storedNotes, notesRevision],
  );

  useEffect(() => {
    if (!c || tab !== "messages") return;
    markMessagesSeen(c.id);
    setInboxRevision((n) => n + 1);
  }, [tab, c?.id]);

  useEffect(() => {
    if (!c || tab !== "notes") return;
    markNotesSeen(
      c.id,
      storedNotes.map((n) => n.id),
    );
    setNotesRevision((n) => n + 1);
  }, [tab, c?.id, storedNotes]);

  const addActivityEntry = (ev: ActivityEvent) => {
    if (!c) return;
    const tagged = { ...ev, consultationId: ev.consultationId ?? c.id };
    setSessionActivity((prev) => {
      const next = [tagged, ...prev];
      writeSessionActivity(c.id, next);
      return next;
    });
  };

  const markSectionDoneWithLog = (section: VerifiableTabId) => {
    markSectionDone(section);
    showVerificationFeedbackToast(section, CURRENT_PHARMACIST_NAME);
    addActivityEntry(
      activityForTabVerified(
        section,
        new Date().toISOString(),
        CURRENT_PHARMACIST_NAME,
      ),
    );
  };

  const logDocumentReview = (payload: {
    docId: string;
    docTitle: string;
    status: "verified" | "rejected";
    emailSent?: boolean;
    templateTitle?: string;
    note?: string;
  }) => {
    addActivityEntry(
      activityForDocumentReview(
        payload.docTitle,
        payload.status,
        CURRENT_PHARMACIST_NAME,
        {
          emailSent: payload.emailSent,
          note: payload.note,
          templateTitle: payload.templateTitle,
        },
      ),
    );
    if (payload.status === "rejected" && c) {
      const tag = buildWaitTag({
        id: `doc-${payload.docId}`,
        kind: "pending_document_upload",
        detail: `${payload.docTitle}${payload.templateTitle ? ` (${payload.templateTitle})` : ""} — ${payload.emailSent ? "upload link emailed, awaiting re-upload" : "rejected, awaiting re-upload"}.`,
        source: payload.emailSent ? "upload_link" : "document_reject",
        relatedDocId: payload.docId,
      });
      upsertSessionWaitTag(c.id, tag);
      addActivityEntry(activityForWaitTag(tag, CURRENT_PHARMACIST_NAME));
    }
  };

  const logUploadLinkSent = (payload: {
    docId: string;
    docTitle: string;
    emailSent?: boolean;
  }) => {
    if (!c) return;
    const tag = buildWaitTag({
      id: `doc-${payload.docId}`,
      kind: "pending_document_upload",
      detail: `${payload.docTitle} — ${payload.emailSent ? "upload link emailed, awaiting patient upload" : "upload request recorded, awaiting patient upload"}.`,
      source: "upload_link",
      relatedDocId: payload.docId,
    });
    upsertSessionWaitTag(c.id, tag);
    addActivityEntry(
      activityForUploadLinkSent(
        payload.docTitle,
        CURRENT_PHARMACIST_NAME,
        payload.emailSent,
      ),
    );
  };

  const logDocumentRequirementChange = (payload: {
    requirement: "required" | "not_required";
    emailSent?: boolean;
  }) => {
    addActivityEntry(
      activityForDocumentRequirementChange(
        payload.requirement,
        CURRENT_PHARMACIST_NAME,
      ),
    );
    if (payload.requirement === "required" && payload.emailSent && c) {
      const tag = buildWaitTag({
        id: "doc-previous-prescription",
        kind: "pending_document_upload",
        detail:
          "Previous prescription — marked required and upload link emailed, awaiting patient upload.",
        source: "requirement_email",
        relatedDocId: "previous-prescription",
      });
      upsertSessionWaitTag(c.id, tag);
      addActivityEntry(activityForWaitTag(tag, CURRENT_PHARMACIST_NAME));
    }
  };

  const logMedicationChange = (
    input:
      | { fromLabel: string; toLabel: string }
      | { changes: Array<{ field: string; from: string; to: string }> },
  ) => {
    addActivityEntry(
      activityForMedicationChange(input, CURRENT_PHARMACIST_NAME),
    );
  };

  const appendPatientComm = (
    consultationId: string,
    entry: PatientCommunication,
  ) => {
    setCommsByOrderId((prev) => ({
      ...prev,
      [consultationId]: [...(prev[consultationId] ?? []), entry],
    }));
  };

  const logOutgoingCommunication = (message: string) => {
    if (!c) return;
    const nowIso = new Date().toISOString();
    const preview = shortenText(message, 96);
    appendPatientComm(c.id, {
      id: `msg-${Date.now()}`,
      direction: "outgoing",
      status: "awaiting_response",
      title: `${CURRENT_PHARMACIST_NAME} sent a message to ${c.patientName}`,
      preview,
      message,
      at: nowIso,
      actor: CURRENT_PHARMACIST_NAME,
    });
    addActivityEntry(
      createActivityEvent({
        atIso: nowIso,
        kind: "message_out",
        consultationId: c.id,
        title: `${CURRENT_PHARMACIST_NAME} sent a message to ${c.patientName}`,
        body: preview,
        expandableBody: message,
        actor: CURRENT_PHARMACIST_NAME,
      }),
    );
    const waitTag = buildWaitTag({
      id: `msg-${Date.now()}`,
      kind: "pending_customer_response",
      detail: preview,
      source: "message",
    });
    upsertSessionWaitTag(c.id, waitTag);
    addActivityEntry(activityForWaitTag(waitTag, CURRENT_PHARMACIST_NAME));
    void apiFetch(`/api/consultations/${c.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: message, kind: "message" }),
    })
      .then(async () => {
        const res = await apiFetch<{
          messages: Array<{
            id: string;
            senderRole: string;
            senderName: string;
            body: string;
            createdAt: string;
            kind?: string;
          }>;
        }>(`/api/consultations/${c.id}/messages`);
        setCommsByOrderId((prev) => ({
          ...prev,
          [c.id]: communicationsFromConsultationMessages(
            res.messages ?? [],
            c.patientName,
          ),
        }));
      })
      .catch(() => {
        toast({
          title: "Message saved locally",
          description: "Could not reach the server - check API connection.",
          variant: "destructive",
        });
      });
  };

  const logIncomingReply = (message: string) => {
    if (!c) return;
    const nowIso = new Date().toISOString();
    const preview = shortenText(message, 96);
    appendPatientComm(c.id, {
      id: `reply-${Date.now()}`,
      direction: "incoming",
      status: "patient_responded",
      title: `${c.patientName} replied`,
      preview,
      message,
      at: nowIso,
      actor: c.patientName,
    });
    addActivityEntry(
      createActivityEvent({
        atIso: nowIso,
        kind: "message_in",
        title: `${c.patientName} replied - review needed`,
        body: preview,
        expandableBody: message,
        actor: c.patientName,
      }),
    );
    setTab("messages");
  };

  useEffect(() => {
    const nextTab = tabFromLocation(location);
    if (nextTab && nextTab !== tab) {
      setTab(nextTab);
    }
  }, [location, tab]);

  const handleTabChange = (next: TabId) => {
    // #region agent log
    fetch("http://127.0.0.1:7633/ingest/75db917f-84df-454f-82c7-2e6c9a6aa114", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "00879a",
      },
      body: JSON.stringify({
        sessionId: "00879a",
        hypothesisId: "H6",
        location: "OrderDetail.tsx:handleTabChange",
        message: "tab click",
        data: { from: tab, to: next },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    setTab(next);
    const [path, search = ""] = location.split("?");
    const params = new URLSearchParams(search);
    params.set("tab", next);
    navigate(`${path}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 py-6 w-full max-w-[118rem] mx-auto overflow-x-hidden">
        <div className="h-10 bg-muted rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(320px,420px)] gap-5">
          <div className="space-y-4">
            <div className="h-56 bg-muted rounded-2xl animate-pulse" />
            <div className="h-32 bg-muted rounded-2xl animate-pulse" />
            <div className="h-40 bg-muted rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-14 bg-muted rounded-3xl animate-pulse" />
            <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-28 bg-muted rounded-2xl animate-pulse" />
            <div className="h-48 bg-muted rounded-2xl animate-pulse" />
            <div className="h-32 bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (!c) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">Consultation not found.</p>
        <Link href="/queue">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rx-page-inner max-w-[118rem] overflow-x-hidden">
      <OrderPatientHeader
        c={c}
        onMedicationChanged={logMedicationChange}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(320px,360px)] xl:gap-7">
        {/* LEFT  -  Patient sidebar */}
        <div className="space-y-4 min-w-0 w-full">
            <PatientCardPro
              c={c}
              onProfileSaved={(changes) =>
                addActivityEntry(
                  activityForProfileEdits(changes, CURRENT_PHARMACIST_NAME),
                )
              }
              onConsultationRefresh={() =>
                queryClient.invalidateQueries({
                  queryKey: getGetConsultationQueryKey(id),
                })
              }
            />
            <StatsGrid
              c={c}
              onMeasurementsSaved={() =>
                queryClient.invalidateQueries({
                  queryKey: getGetConsultationQueryKey(id),
                })
              }
            />
            <AutoFlags c={c} />
        </div>

          {/* CENTER  -  Tab content */}
          <div className="relative z-30 min-w-0 w-full overflow-visible">
            <TabsBar
              current={tab}
              onChange={handleTabChange}
              verifications={verifications}
              unreadCounts={{
                messages: unreadMessageCount,
                notes: unreadNotesCount,
              }}
            />
            <div className="rx-panel relative z-0 mt-4 min-w-0 overflow-hidden border-border !p-4 sm:!p-6 shadow-sm">
            {tab === "clinical" && (
              <ClinicalReviewTab
                c={c}
                onUndo={() => undoSectionDone("clinical")}
                onVerify={() => markSectionDoneWithLog("clinical")}
                verification={verifications.clinical}
                onMedicationChanged={logMedicationChange}
              />
            )}
            {tab === "consultation" && (
              <ConsultationTab
                c={c}
                onUndo={() => undoSectionDone("consultation")}
                onVerify={() => markSectionDoneWithLog("consultation")}
                verification={verifications.consultation}
              />
            )}
            {tab === "documents" && (
              <DocumentsTabPro
                consultationId={c.id}
                onUndo={() => undoSectionDone("documents")}
                onVerify={() => markSectionDoneWithLog("documents")}
                verification={verifications.documents}
                onDocumentReview={logDocumentReview}
                onDocumentRequirementChange={logDocumentRequirementChange}
                onUploadLinkSent={logUploadLinkSent}
              />
            )}
            {tab === "history" && (
              <OrderHistoryTab
                currentConsultationId={c.id}
                orders={
                  patientOrders.length > 0 ? patientOrders : [c]
                }
                onUndo={() => undoSectionDone("history")}
                onVerify={() => markSectionDoneWithLog("history")}
                verification={verifications.history}
              />
            )}
            {tab === "counselling" && (
              <CounsellingTab
                onUndo={() => undoSectionDone("counselling")}
                onVerify={() => markSectionDoneWithLog("counselling")}
                verification={verifications.counselling}
                patientName={c.patientName}
              />
            )}
            {tab === "monitoring" && (
              <MonitoringTab
                c={c}
                onUndo={() => undoSectionDone("monitoring")}
                onVerify={() => markSectionDoneWithLog("monitoring")}
                verification={verifications.monitoring}
              />
            )}
            {tab === "notes" && (
              <NotesTab
                consultationId={c.id}
                onNotesChange={() => setNotesRevision((n) => n + 1)}
              />
            )}
            {tab === "activity" && <ActivityTab sections={activitySections} />}
            {tab === "messages" && (
              <MessagesTab
                consultationId={c.id}
                patientName={c.patientName}
                communications={activePatientComms}
                onCompose={logOutgoingCommunication}
                unreadCount={unreadMessageCount}
              />
            )}
          </div>
          </div>

          {/* RIGHT  -  Decision panel */}
          <div className="space-y-4 min-w-0 w-full lg:col-span-2 xl:col-span-1 xl:col-start-3 xl:sticky xl:top-6 xl:self-start">
            <DecisionPanel
              consultationId={c.id}
              patientName={c.patientName}
              patientAge={c.patientAge}
              conditionName={c.conditionName}
              onSelectTab={handleTabChange}
              verifications={verifications}
              onLog={addActivityEntry}
              communications={activePatientComms}
              onNoteCommunication={logOutgoingCommunication}
            />
          </div>
        </div>

      <PatientChatPanel
        open={patientChatOpen}
        onOpenChange={setPatientChatOpen}
        patientName={c.patientName}
        communications={activePatientComms}
        messageDraft={messageDraft}
        onMessageDraftChange={setMessageDraft}
        chatClosed={chatClosed}
        onToggleChatClosed={() => setChatClosed((current) => !current)}
        sendDisabled={!messageDraft.trim()}
        onSend={() => {
          if (!messageDraft.trim()) {
            toast({ title: "Write a message first", variant: "destructive" });
            return;
          }
          if (chatClosed) setChatClosed(false);
          logOutgoingCommunication(messageDraft.trim());
          setMessageDraft("");
        }}
      />
    </div>
  );
}

export default OrderDetail;

// --- LEFT RAIL -------------------------------------------------------------
function PatientCardPro({
  c,
  onProfileSaved,
  onConsultationRefresh,
}: {
  c: Consultation;
  onProfileSaved?: (
    changes: Array<{ field: string; from: string; to: string }>,
  ) => void;
  onConsultationRefresh?: () => void;
}) {
  const { toast } = useToast();

  const initialProfile = useMemo(
    () => profileFromConsultation(c),
    [c],
  );

  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
    setDraft(initialProfile);
  }, [initialProfile]);

  const openEditor = () => {
    setDraft(profile);
    setEditing(true);
  };

  const pendingChanges = PROFILE_FIELD_META.filter(
    (f) => draft[f.key] !== profile[f.key],
  );

  const saveProfile = async () => {
    if (pendingChanges.length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const changes = pendingChanges.map((f) => ({
      field: f.label,
      from: profile[f.key],
      to: draft[f.key],
    }));
    try {
      const deliveryAddress = deliveryAddressFromProfile(draft);
      await apiFetch<Consultation>(`/api/consultations/${c.id}/patient-details`, {
        method: "PATCH",
        body: JSON.stringify({
          patientName: fmtName(draft),
          patientEmail: draft.email.trim(),
          deliveryAddress: deliveryAddress || undefined,
          gpName: draft.gpDoctorName.trim() || undefined,
          gpSurgery: draft.gpSurgery.trim() || undefined,
          gpAddress: draft.gpAddress.trim() || undefined,
        }),
      });
      fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          consultationId: c.id,
          changes,
          editedBy: CURRENT_PHARMACIST_NAME,
        }),
      }).catch(() => {
        /* server log unavailable - changes still saved */
      });
      setProfile(draft);
      onConsultationRefresh?.();
      onProfileSaved?.(changes);
      toast({
        title: `${pendingChanges.length} field${pendingChanges.length > 1 ? "s" : ""} updated`,
        description: pendingChanges.map((f) => f.label).join(", "),
      });
      setEditing(false);
    } catch (err) {
      toast({
        title: "Could not save patient details",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const initials =
    [draft.firstName, draft.surname]
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .toUpperCase() || (profile.firstName[0] ?? "?").toUpperCase();
  const journey = getPatientJourneyType(c);
  const journeyMeta = JOURNEY_BADGE[journey];

  const infoRows: { label: string; value: string }[] = [
    { label: "ORDER NO", value: orderRefFromId(c.id, (c as { consultationNumber?: string | null }).consultationNumber) },
    { label: "DOB", value: fmtDob(profile, c.patientAge) },
    { label: "PHONE", value: profile.phone || "-" },
    { label: "EMAIL", value: profile.email || "-" },
    { label: "ADDRESS", value: fmtAddress(profile) },
    { label: "GP", value: fmtGp(profile) },
  ];

  return (
    <>
      <div className="rx-surface overflow-hidden">
        {/* -- Header: avatar + name + single Edit button -- */}
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl bg-primary font-bold text-sm text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="wrap-break-word font-serif text-base font-bold leading-tight tracking-tight text-secondary">
                  {fmtName(profile)}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        journeyMeta.dotClassName,
                      )}
                    />
                    {journeyMeta.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={openEditor}
              className="flex shrink-0 items-center gap-1.5 rx-btn-outline text-xs !px-3 !py-1.5"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
        </div>

        {/* -- Info rows with dividers -- */}
        <div className="px-4 py-2">
          <dl>
            {infoRows.map((r, i) => (
              <div key={r.label}>
                {i > 0 && <div className="border-t border-border" />}
                <div className="flex items-start gap-3 py-2.5">
                  <dt className="w-[68px] shrink-0 pt-0.5 rx-label-caps">
                    {r.label}
                  </dt>
                  <dd className="text-sm text-foreground leading-relaxed min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                    {r.value === "-" ? (
                      <span className="text-muted-foreground/60 italic text-xs">
                        Not set
                      </span>
                    ) : (
                      r.value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <PatientDetailsEditorDialog
        open={editing}
        onOpenChange={setEditing}
        profile={profile}
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        pendingChanges={pendingChanges}
        onSave={() => void saveProfile()}
        patientAge={c.patientAge}
      />
    </>
  );
}

function StatsGrid({
  c,
  onMeasurementsSaved,
}: {
  c: Consultation;
  onMeasurementsSaved?: () => void;
}) {
  const { toast } = useToast();
  const [bmiDialogOpen, setBmiDialogOpen] = useState(false);
  const bmiNum = resolveConsultationBmi(c);
  const bmiValue = bmiNum != null ? bmiNum.toFixed(1) : "-";
  const ethnicityLabel =
    formatEthnicityLabel((c.answers as Record<string, unknown>)?.ethnicity) ??
    "-";

  const showBmi = isInjectableWeightLossOrder(c);

  const cells = [
    ...(showBmi
      ? [
          {
            value: bmiValue,
            label: "BMI",
            valueClass:
              bmiNum != null ? bmiHighlightClass(bmiNum) : "text-foreground",
            editable: true,
          },
        ]
      : []),
    {
      value: c.patientAge ? `${c.patientAge}` : "-",
      suffix: "yrs",
      label: "Age",
    },
    {
      value: c.patientSex
        ? c.patientSex.charAt(0).toUpperCase() + c.patientSex.slice(1)
        : "-",
      label: "Sex",
    },
    { value: ethnicityLabel, label: "Ethnicity" },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="flex min-h-[5.5rem] flex-col justify-between rx-stat-cell"
          >
            <div className="flex items-start gap-1 min-w-0">
              <span
                className={cn(
                  "font-bold leading-tight tracking-tight tabular-nums",
                  cell.label === "Ethnicity" && cell.value !== "-"
                    ? "text-sm line-clamp-2"
                    : "text-2xl truncate",
                  cell.valueClass ?? "text-foreground",
                )}
                title={cell.label === "Ethnicity" ? cell.value : undefined}
              >
                {cell.value}
              </span>
              {cell.suffix && (
                <span className="text-sm font-medium text-muted-foreground pt-1 shrink-0">
                  {cell.suffix}
                </span>
              )}
              {cell.editable && (
                <button
                  type="button"
                  className="ml-0.5 mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  aria-label="Edit BMI"
                  onClick={() => setBmiDialogOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {cell.label}
            </span>
          </div>
        ))}
      </div>

      {showBmi ? (
        <BmiCalculatorDialog
          consultation={c}
          open={bmiDialogOpen}
          onOpenChange={setBmiDialogOpen}
          onSaved={() => {
            onMeasurementsSaved?.();
            toast({
              title: "BMI updated",
              description:
                "Height, weight, and calculated BMI saved for this order.",
            });
          }}
        />
      ) : null}
    </>
  );
}

type FlagTone = "red" | "green" | "amber" | "stone";

function AutoFlags({ c }: { c: Consultation }) {
  const { data: allConsults } = useListConsultations({ limit: 200 });
  const weightAlert = useMemo(
    () =>
      evaluateWeightChangeMonitoring(c, allConsults?.consultations ?? []),
    [c, allConsults?.consultations],
  );

  const flags: { tone: FlagTone; label: string }[] = [];

  if (isInjectableWeightLossOrder(c) && weightAlert) {
    flags.push({
      tone: weightAlert.kind === "gain_7" ? "red" : "amber",
      label: `Complex patient - ${weightAlert.pctChange > 0 ? "+" : ""}${weightAlert.pctChange}% weight vs last order`,
    });
  }

  if (c.currentMedications && c.currentMedications !== "None") {
    flags.push({ tone: "red", label: "Currently on other medications" });
  }
  if (c.allergies && c.allergies !== "None") {
    flags.push({ tone: "red", label: "Has allergies" });
  }
  if (c.patientAge != null && (c.patientAge < 18 || c.patientAge > 75)) {
    flags.push({
      tone: "red",
      label: `Outside 18-75 (age: ${c.patientAge})`,
    });
  }
  flags.push(
    c.hasRedFlag
      ? { tone: "red", label: "Red flag raised" }
      : { tone: "green", label: "No red flags" },
  );
  flags.push(
    c.hasPhoto
      ? { tone: "green", label: "Photo uploaded" }
      : { tone: "amber", label: "No photo provided" },
  );
  flags.push(
    c.previousConsultationId
      ? { tone: "green", label: "Repeat from prior consult" }
      : { tone: "stone", label: "First-time consult" },
  );

  const duplicateMatches =
    (c as {
      duplicatePatientMatches?: Array<{
        name: string;
        email: string;
        pmrNumber?: string | null;
        isRecommendedPrimary?: boolean;
      }>;
    }).duplicatePatientMatches ?? [];
  const riskFlagsList = (c as { riskFlags?: string[] }).riskFlags ?? [];
  if (
    duplicateMatches.length > 0 ||
    riskFlagsList.includes("possible_duplicate_patient")
  ) {
    const primary =
      duplicateMatches.find((m) => m.isRecommendedPrimary) ??
      duplicateMatches[0];
    flags.push({
      tone: "amber",
      label: primary?.pmrNumber
        ? `Possible duplicate — check ${primary.pmrNumber}`
        : "Possible duplicate patient (same name + DOB)",
    });
  }

  const toneCls: Record<FlagTone, { bg: string; dot: string }> = {
    red: { bg: "bg-rx-decline-surface text-rx-decline", dot: "bg-rx-decline-surface0" },
    green: { bg: "bg-muted text-foreground", dot: "bg-primary" },
    amber: { bg: "bg-rx-cs-surface text-rx-cs", dot: "bg-rx-cs-surface0" },
    stone: { bg: "bg-muted/40 text-foreground", dot: "bg-muted-foreground" },
  };

  return (
    <div className="rx-surface p-5">
      <div className="flex items-center gap-1.5 rx-label-caps mb-3.5">
        <FlagIcon className="h-3 w-3" /> Auto-flags
      </div>
      <ul className="space-y-2">
        {flags.map((f, i) => (
          <li
            key={i}
            className={cn(
              "rounded-xl px-3 py-2 text-sm flex items-center gap-2.5",
              toneCls[f.tone].bg,
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                toneCls[f.tone].dot,
              )}
            />
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- CENTER: TABS BAR ------------------------------------------------------
function TabsBar({
  current,
  onChange,
  verifications,
  unreadCounts = {},
}: {
  current: TabId;
  onChange: (t: TabId) => void;
  verifications: VerificationState;
  unreadCounts?: Partial<Record<"messages" | "notes", number>>;
}) {
  const contRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prevTabRef = useRef<TabId>(current);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const updateScrollAffordance = useCallback(() => {
    const el = contRef.current;
    if (!el) return;
    setShowPrev(el.scrollLeft > 4);
    setShowNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    updateScrollAffordance();
    el.addEventListener("scroll", updateScrollAffordance, { passive: true });
    const ro = new ResizeObserver(updateScrollAffordance);
    ro.observe(el);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("resize", updateScrollAffordance);
    return () => {
      el.removeEventListener("scroll", updateScrollAffordance);
      ro.disconnect();
      window.removeEventListener("resize", updateScrollAffordance);
    };
  }, [updateScrollAffordance, current, unreadCounts.messages, unreadCounts.notes]);

  const scrollTabIntoView = useCallback(
    (tabId: TabId, previousTabId: TabId) => {
      const btn = btnRefs.current[tabId];
      const el = contRef.current;
      if (!btn || !el) {
        // #region agent log
        fetch("http://127.0.0.1:7633/ingest/75db917f-84df-454f-82c7-2e6c9a6aa114", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "00879a",
          },
          body: JSON.stringify({
            sessionId: "00879a",
            hypothesisId: "H3",
            location: "OrderDetail.tsx:scrollTabIntoView:earlyReturn",
            message: "scroll skipped — missing btn or container",
            data: { tabId, hasBtn: Boolean(btn), hasEl: Boolean(el) },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        return;
      }

      const wrap = btn.parentElement as HTMLElement | null;
      const target = wrap ?? btn;
      const pad = 16;
      const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);

      const tabOffsetLeft = (id: TabId) => {
        const node = btnRefs.current[id];
        if (!node) return 0;
        const outer = node.parentElement ?? node;
        return outer.offsetLeft;
      };

      const tabOffsetRight = (id: TabId) => {
        const node = btnRefs.current[id];
        if (!node) return 0;
        const outer = node.parentElement ?? node;
        return outer.offsetLeft + outer.offsetWidth;
      };

      const tabLeft = target.offsetLeft;
      const tabRight = tabLeft + target.offsetWidth;
      const viewLeft = el.scrollLeft;
      const viewRight = viewLeft + el.clientWidth;

      const tabIndex = TABS.findIndex((t) => t.id === tabId);
      const prevIndex = TABS.findIndex((t) => t.id === previousTabId);
      const movingRight = tabIndex > prevIndex;
      const movingLeft = tabIndex < prevIndex;
      const tabChanged = tabId !== previousTabId;

      const minScroll = Math.max(0, tabRight + pad - el.clientWidth);
      const maxScroll = Math.max(0, tabLeft - pad);

      let nextLeft = el.scrollLeft;
      let branch = "noChange";
      if (tabLeft < viewLeft + pad) {
        nextLeft = tabLeft - pad;
        branch = "clippedLeft";
      } else if (tabRight > viewRight - pad) {
        nextLeft = tabRight + pad - el.clientWidth;
        branch = "clippedRight";
      }

      let lookAheadApplied = false;
      let lookBackApplied = false;
      let peekRevealRight: number | null = null;
      let peekRevealLeft: number | null = null;

      if (tabChanged && movingRight && tabIndex < TABS.length - 1) {
        const lookAhead = Math.min(TABS.length - 1, tabIndex + 2);
        peekRevealRight = tabOffsetRight(TABS[lookAhead].id) + pad - el.clientWidth;
        if (peekRevealRight > nextLeft) {
          nextLeft = Math.min(peekRevealRight, maxScroll);
          lookAheadApplied = true;
          branch = "peekRightCapped";
        }
      } else if (tabChanged && movingLeft && tabIndex > 0) {
        const lookBack = Math.max(0, tabIndex - 2);
        peekRevealLeft = tabOffsetLeft(TABS[lookBack].id) - pad;
        if (peekRevealLeft < nextLeft) {
          nextLeft = Math.max(peekRevealLeft, minScroll);
          lookBackApplied = true;
          branch = "peekLeftCapped";
        }
      }

      if (tabIndex === 0) {
        nextLeft = 0;
        branch = "snapFirst";
      } else if (tabIndex === TABS.length - 1) {
        nextLeft = maxLeft;
        branch = "snapLast";
      } else if (minScroll <= maxScroll) {
        nextLeft = Math.max(minScroll, Math.min(nextLeft, maxScroll));
      } else {
        nextLeft = Math.max(
          0,
          Math.min((tabLeft + tabRight) / 2 - el.clientWidth / 2, maxLeft),
        );
        branch = "centerWideTab";
      }

      const clampedLeft = Math.max(0, Math.min(nextLeft, maxLeft));
      const fullyVisible =
        tabLeft >= viewLeft + pad - 1 && tabRight <= viewRight + pad + 1;

      // #region agent log
      fetch("http://127.0.0.1:7633/ingest/75db917f-84df-454f-82c7-2e6c9a6aa114", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "00879a",
        },
        body: JSON.stringify({
          sessionId: "00879a",
          runId: "post-fix-v2",
          hypothesisId: "H7",
          location: "OrderDetail.tsx:scrollTabIntoView",
          message: "tab scroll computed",
          data: {
            tabId,
            tabIndex,
            previousTabId,
            prevIndex,
            movingRight,
            movingLeft,
            tabChanged,
            scrollBefore: el.scrollLeft,
            nextLeft: clampedLeft,
            scrollDelta: clampedLeft - el.scrollLeft,
            maxLeft,
            minScroll,
            maxScroll,
            tabLeft,
            tabRight,
            viewLeft,
            viewRight,
            peekRevealRight,
            peekRevealLeft,
            fullyVisible,
            branch,
            lookAheadApplied,
            lookBackApplied,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      el.scrollTo({
        left: clampedLeft,
        behavior: "smooth",
      });
      window.setTimeout(updateScrollAffordance, 320);
    },
    [updateScrollAffordance],
  );

  useEffect(() => {
    const previousTabId = prevTabRef.current;
    prevTabRef.current = current;
    const frame = requestAnimationFrame(() => {
      scrollTabIntoView(current, previousTabId);
    });
    const t = window.setTimeout(updateScrollAffordance, 80);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
    };
  }, [current, scrollTabIntoView, updateScrollAffordance]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = contRef.current;
    if (!el) return;
    const step =
      Math.max(240, Math.round(el.clientWidth * 0.88)) * direction;
    el.scrollBy({ left: step, behavior: "smooth" });
    window.setTimeout(updateScrollAffordance, 320);
  };

  const navBtnClass = (enabled: boolean) =>
    cn(
      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-opacity hover:bg-muted hover:text-foreground",
      enabled ? "opacity-100" : "pointer-events-none opacity-0",
    );

  return (
    <div className="rx-tabs-track group/tabs">
      <button
        type="button"
        aria-label="Scroll tabs left"
        disabled={!showPrev}
        onClick={() => scrollByPage(-1)}
        className={navBtnClass(showPrev)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={contRef}
        className="rx-tabs-scroll"
        role="tablist"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            (e.currentTarget as HTMLDivElement).scrollBy({
              left: e.deltaY,
              behavior: "auto",
            });
            updateScrollAffordance();
          }
        }}
      >
        <div ref={innerRef} className="inline-flex min-w-full items-center gap-1.5 py-0.5 pr-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = current === t.id;
          const verified =
            isVerifiableTabId(t.id) && Boolean(verifications[t.id]);
          const unread =
            t.id === "messages"
              ? unreadCounts.messages ?? 0
              : t.id === "notes"
                ? unreadCounts.notes ?? 0
                : 0;
          return (
            <span
              key={t.id}
              className="relative shrink-0 scroll-mx-3"
            >
              <button
                ref={(r) => {
                  btnRefs.current[t.id] = r;
                }}
                onClick={() => onChange(t.id)}
                data-testid={`tab-${t.id}`}
                role="tab"
                aria-selected={active}
                className={cn(
                  "relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-[13px] sm:text-sm rounded-full border transition-all whitespace-nowrap",
                  active
                    ? "z-10 bg-primary text-primary-foreground border-primary font-semibold shadow-md ring-2 ring-primary/25"
                    : verified
                      ? "bg-primary/8 text-primary border-primary/25 font-medium hover:bg-primary/12"
                      : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
                  verified &&
                    !unread &&
                    !active &&
                    "after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:z-10 after:h-2.5 after:w-2.5 after:rounded-full after:bg-primary after:ring-[1.5px] after:ring-card",
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{t.label}</span>
                {t.badge && (
                  <span
                    className={cn(
                      "ml-0.5 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 text-[10px] font-semibold rounded-full",
                      active
                        ? "bg-primary-foreground/20 text-white"
                        : "bg-rose-100 text-rose-600",
                    )}
                  >
                    {t.badge}
                  </span>
                )}
                {unread > 0 ? (
                  <span
                    className={cn(
                      "ml-0.5 flex min-h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none shadow-sm",
                      active
                        ? "bg-white text-rose-600 ring-1 ring-white/80"
                        : "bg-rose-600 text-white ring-2 ring-card",
                    )}
                    aria-label={`${unread} unread`}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </button>
            </span>
          );
        })}
        </div>
      </div>
      <button
        type="button"
        aria-label="Scroll tabs right"
        disabled={!showNext}
        onClick={() => scrollByPage(1)}
        className={navBtnClass(showNext)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// --- CLINICAL REVIEW TAB ---------------------------------------------------
function ClinicalReviewTab({
  c,
  onUndo,
  onVerify,
  verification,
}: {
  c: Consultation;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
  onMedicationChanged?: (payload: {
    changes: Array<{ field: string; from: string; to: string }>;
  }) => void;
}) {
  const [scrOpen, setScrOpen] = useState(false);
  const weightLoss = isInjectableWeightLossOrder(c);

  return (
    <div className="space-y-5">
      <ClinicalReviewOrderSummary c={c} />

      {weightLoss ? <ClinicalReviewBmiHistory consultation={c} /> : null}

      <ClinicalReviewNhsScr onOpenScr={() => setScrOpen(true)} />

      <VerificationAction
        actionLabel="Mark Clinical Review as done"
        label="Clinical Review"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />

      <Dialog open={scrOpen} onOpenChange={setScrOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>NHS Summary Care Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Current medicines
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {c.currentMedications || "No current medicines recorded."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-rx-cs-surface/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                Allergies
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {c.allergies || "No allergies recorded."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 sm:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Clinical summary
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                SCR lookup opened for this review. Confirm prescribed medicines,
                allergies, and relevant contraindications before marking the
                clinical review complete.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setScrOpen(false)} className="rounded-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- CONSULTATION TAB ------------------------------------------------------
function VerificationAction({
  actionLabel,
  label,
  onUndo,
  onVerify,
  verification,
}: {
  actionLabel: string;
  label: string;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  if (verification) {
    return (
      <div className="rx-verified-banner">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {label} verified
              </div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Verified by {verification.verifiedBy}{" "}
                {formatVerifiedAt(verification.verifiedAt)}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onUndo}
            className="h-9 shrink-0 rounded-full border-border bg-card px-4 text-primary hover:bg-muted"
          >
            Undo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={onVerify}
      className="w-full min-h-12 whitespace-normal break-words bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-sm text-base"
    >
      <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" /> {actionLabel}
    </Button>
  );
}

// -- Human-readable question labels (mapped from the consultation rule-set) --
const ANSWER_LABELS: Record<string, string> = {
  // - Contact / identity
  full_name: "Full legal name",
  dob: "Date of birth",
  phone: "Mobile phone",
  delivery_address: "Delivery address",
  assigned_sex: "Assigned sex at birth",

  // - Ethnicity + BMI
  ethnicity: "Ethnicity",
  height_cm: "Height (cm)",
  height_ft: "Height (ft)",
  height_in: "Height (in)",
  weight_kg: "Current weight (kg)",
  weight_st: "Current weight (stones)",
  weight_lbs: "Current weight (lbs)",
  highest_adult_weight: "Highest adult weight",
  target_weight: "Target weight",
  bmi: "Calculated BMI",

  // - Core safety (Step 5)
  age_18_75: "Are you aged between 18 and 75?",
  pregnant_or_breastfeeding: "Pregnant, breastfeeding or planning pregnancy?",
  glp1_allergy_history:
    "Allergic reaction to GLP-1 medication (Wegovy / Mounjaro / Ozempic / Saxenda)?",
  mtc_or_men2_history:
    "Personal or family history of medullary thyroid cancer (MTC) or MEN2?",
  eating_disorder_history:
    "History of eating disorder (anorexia, bulimia, BED)?",

  // - Medical history (Step 6)
  excluding_conditions: "Diagnosed with any listed excluding condition?",
  diabetes_meds_beyond_metformin:
    "Type 2 diabetes - on medication other than metformin?",

  // - Medications (Step 7)
  currently_taking_meds:
    "Currently taking prescribed / OTC / recreational drugs?",
  other_health_conditions: "Other health conditions not listed above?",
  oral_contraceptive: "Currently taking an oral contraceptive?",
  new_to_injectables: "New to injectable weight-loss medications?",

  // - Lifestyle (Step 8)
  alcohol_units_per_week: "Alcohol (units per week)",
  smoker: "Smoker?",
  activity_level: "Activity level",
  tried_before: "Previous weight-loss methods tried",

  // - Agreement + GP
  consent_agreement: "Agreement to all treatment conditions",
  gp_consent: "Consent to notify / share with GP",
  gp_name: "GP surgery name",
  gp_address: "GP surgery address",
  gp_phone: "GP surgery phone",

  // - Treatment choice
  selected_plan: "Selected prescription plan",
  addons: "Add-on items selected",

  // - Repeat flow questions (R1-R6)
  weight_today: "Current weight today",
  changes_since_last_order: "Changes since last order",
  side_effects_since_last: "Any side effects since last order?",
  side_effects_hospitalisation: "Hospitalisation since last order?",
  side_effects_vomiting_diarrhoea: "Vomiting or diarrhoea?",
  side_effects_injection_site: "Injection site reactions?",
  new_meds_since: "New medications since last order?",
  hospital_since: "Hospital admission since last order?",
  dose_change: "Dose preference (stay / step-up / step-down)",

  // - Transfer flow questions (T1-T8)
  previous_provider: "Previous provider name",
  current_dose: "Current medicine & dose",
  last_dose_date: "Date of last dose",
  time_on_medicine: "Time on current medicine",
  highest_dose_tolerated: "Highest dose successfully tolerated",
  reason_for_switching: "Reason for switching provider",
  side_effects_previous: "Side effects on previous medicine?",
  transfer_evidence_url: "Prescription label / order evidence",

  // - Legacy seed data keys + generic weight-loss
  goal: "Weight loss goal",
  weight_loss_goal: "Weight loss goal",
  previous_attempts: "Previous weight-loss attempts",
  current_medication: "Current medication",
  diabetes: "Diabetes",
  thyroid: "Thyroid disease",

  // - Generic clinical keys (other conditions)
  symptoms: "Symptoms reported",
  duration: "Duration of symptoms",
  first_episode: "First episode?",
  blood_in_urine: "Blood in urine?",
  fever: "Fever present?",
  pain_location: "Pain location",
  numbness: "Numbness / tingling",
  bladder_or_bowel_changes: "Bladder / bowel changes?",
  recent_injury: "Recent injury?",
  pain_score: "Pain score (0-10)",
};

const JOURNEY_META: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  new: {
    label: "New Patient",
    dot: "bg-lime-500",
    badge: "bg-lime-50 text-lime-700 border-lime-200",
  },
  existing: {
    label: "Existing Patient",
    dot: "bg-sky-500",
    badge: "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-200",
  },
  transferring: {
    label: "Transferring",
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-200",
  },
};

// -- Value display maps -----------------------------------------------------
const JOURNEY_DISPLAY: Record<string, string> = {
  new: "New Patient - Starting Treatment",
  existing: "Existing Patient - Reorder Next Dose",
  transferring: "Transferring from Another Provider",
};
const ETHNICITY_DISPLAY: Record<string, string> = {
  asian: "Asian or Asian British",
  black: "Black, African, Caribbean or Black British",
  "middle-eastern": "Middle Eastern",
  mixed: "Mixed or Multiple Ethnicities",
  white: "White",
  other: "Other ethnic group",
  "prefer-not-to-say": "Prefer not to say",
};
const SEX_DISPLAY: Record<string, string> = {
  male: "Male",
  female: "Female",
  "prefer-not-to-say": "Prefer not to say",
};
const DOSE_CHANGE_DISPLAY: Record<string, string> = {
  stay: "Stay on current dose",
  "step-up": "Step up to next dose",
  "step-down": "Step down to lower dose",
};

function formatAnswerValue(key: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    if (v.length === 0) return "-";
    // Add-ons: [{id, qty}]
    if (typeof v[0] === "object" && v[0] !== null && "id" in v[0]) {
      return (v as Array<{ id: string; qty?: number }>)
        .map(
          (a) =>
            `${String(a.id).replace(/-/g, " ")}${a.qty && a.qty > 1 ? ` -${a.qty}` : ""}`,
        )
        .join(", ");
    }
    return (v as unknown[]).map(String).join(", ");
  }
  const s = String(v);
  // Enum lookups
  if (key === "journey_stage") return JOURNEY_DISPLAY[s] ?? s;
  if (key === "ethnicity") return ETHNICITY_DISPLAY[s] ?? s;
  if (key === "assigned_sex") return SEX_DISPLAY[s] ?? s;
  if (key === "dose_change") return DOSE_CHANGE_DISPLAY[s] ?? s;
  if (key === "changes_since_last_order") {
    const map: Record<string, string> = {
      new_diagnosis: "New diagnosis or change in health condition",
      new_medication_allergy:
        "Started new medication / changed medication / developed allergy",
      no_changes: "No changes",
    };
    return map[s] ?? s;
  }
  // yes/no normalise
  if (s.toLowerCase() === "yes") return "Yes";
  if (s.toLowerCase() === "no") return "No";
  return s;
}

function getLabelForKey(key: string): string {
  return (
    ANSWER_LABELS[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// Keys to exclude from the Q&A list (already shown elsewhere)
// -- Keys excluded from the Q&A table (shown in metrics strip instead) ----
const SKIP_KEYS_QA = new Set([
  "journey_stage",
  "bmi",
  "height_cm",
  "weight_kg",
  "dob",
  "assigned_sex",
  "ethnicity",
  "diagnosed_conditions_details",
  "current_medications_details",
  "other_health_conditions_details",
  "changing_from_provider",
  "last_injection_timing",
  "last_injection_date",
  "documents_pending",
  "patient_documents",
  "patient_documents_uploaded_at",
  "document_reviews",
  "consultation_type",
  "selected_plan",
  "addons",
]);

// -- Keys shown with amber left-border regardless of answer value ----------
const AMBER_BORDER_KEYS = new Set([
  "oral_contraceptive",
  "new_to_injectables",
  "diabetes_meds_beyond_metformin",
  "excluding_conditions",
  "changes_since_last_order",
  "side_effects_since_last",
  "side_effects_hospitalisation",
  "side_effects_vomiting_diarrhoea",
  "side_effects_injection_site",
  "new_meds_since",
  "hospital_since",
  "side_effects_previous",
  "previous_provider",
  "current_dose",
  "last_dose_date",
  "time_on_medicine",
  "highest_dose_tolerated",
]);

// -- Keys that are clinically critical if answered "yes" -------------------
const HARD_STOP_KEYS = new Set([
  "pregnant_or_breastfeeding",
  "glp1_allergy_history",
  "mtc_or_men2_history",
  "eating_disorder_history",
  "blood_in_urine",
  "fever",
]);

// -- Full question text exactly as shown to patients -----------------------
const FULL_Q: Record<string, string> = {
  age_18_75: "Are you aged between 18 and 75?",
  pregnant_or_breastfeeding:
    "Are you currently pregnant, breastfeeding, or planning to become pregnant or breastfeed while using this medication?",
  glp1_allergy_history:
    "Have you ever had an allergic reaction to Wegovy, Mounjaro, Ozempic, Saxenda, or other GLP-1 medications?",
  mtc_or_men2_history:
    "Do you or a family member have a history of medullary thyroid cancer or MEN2?",
  eating_disorder_history:
    "Have you ever had an eating disorder (e.g., anorexia, bulimia)?",
  excluding_conditions:
    "Have you been diagnosed with or had surgery for any of the following? Pancreatitis, Gallstones or gallbladder problems, Inflammatory bowel disease (Crohn's, ulcerative colitis), Gastroparesis or delayed stomach emptying, Chronic malabsorption, Bariatric or gastric surgery, Liver disease, Kidney disease, Type 1 Diabetes, Diabetic eye disease (retinopathy), Heart disease or rhythm issues, Cancer, Serious condition needing hospitalisation, Other condition not listed above",
  diabetes_meds_beyond_metformin:
    "If you have Type 2 Diabetes, are you taking any medications other than metformin?",
  currently_taking_meds:
    "Are you currently taking any prescribed, over-the-counter, or recreational drugs?",
  other_health_conditions:
    "Do you have any previous or current health conditions?",
  oral_contraceptive: "Are you taking an oral contraceptive?",
  new_to_injectables:
    "Are you new to using injectable weight loss medications?",
  changing_from_provider:
    "Are you changing from a different provider?",
  last_injection_timing: "When was your last injection?",
  consent_agreement: "By proceeding, I confirm and agree to the following",
  gp_consent:
    "I consent to PharmaCare contacting my GP and share information about my prescription.",
  // Repeat flow
  weight_today: "What is your current weight today?",
  changes_since_last_order:
    "Since your last order, have there been any changes in your medical history?",
  side_effects_since_last:
    "Have you had any side effects since your last order?",
  side_effects_hospitalisation:
    "Have you been hospitalised since your last order?",
  side_effects_vomiting_diarrhoea:
    "Have you had vomiting or diarrhoea since your last order?",
  side_effects_injection_site:
    "Have you had injection site reactions since your last order?",
  new_meds_since: "Have you started any new medications since your last order?",
  hospital_since: "Have you been admitted to hospital since your last order?",
  dose_change:
    "Would you like to stay on the same dose, step up, or step down?",
  // Transfer flow
  previous_provider: "What was the name of your previous provider?",
  current_dose: "What medicine and dose are you currently on?",
  last_dose_date:
    "When did you last take an injectable weight-loss medication?",
  time_on_medicine: "How long have you been on your current medicine?",
  highest_dose_tolerated:
    "What is the highest dose you have successfully tolerated?",
  reason_for_switching: "Why are you switching from your previous provider?",
  side_effects_previous:
    "Did you experience any side effects with your previous medicine?",
  // Lifestyle / legacy seed keys
  goal: "What is your weight loss goal?",
  weight_loss_goal: "What is your weight loss goal?",
  tried_before:
    "Have you tried other weight-loss methods before (diet, gym, surgery, medication)?",
  previous_attempts: "What previous weight-loss attempts have you made?",
  current_medication:
    "Are you currently taking any medication for weight loss?",
  diabetes: "Do you have diabetes?",
  thyroid: "Do you have thyroid disease?",
  // Generic
  symptoms: "What symptoms are you experiencing?",
  duration: "How long have you had these symptoms?",
  first_episode: "Is this your first episode of these symptoms?",
  blood_in_urine: "Have you noticed blood in your urine?",
  fever: "Do you have a fever?",
  smoker: "Are you a smoker?",
  activity_level: "What is your activity level?",
  alcohol_units_per_week: "How many units of alcohol do you drink per week?",
  selected_plan: "Which treatment plan did you select?",
  addons: "Did you add any supplementary items to your order?",
};

// GP / consent / identity keys are rendered as plain label-value rows, not Q&A
const GP_CONSENT_KEYS = new Set([
  "gp_name",
  "gp_address",
  "gp_phone",
  "gp_consent",
  "consent_agreement",
  "consent_to_treatment",
  "consent_share_with_gp",
  "consent_to_delivery",
  "consent_data_processing",
  "identity_verification_method",
  "identity_verification_ref",
]);

function getFullQuestion(key: string): string {
  return (
    FULL_Q[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function ConsultationTab({
  c,
  onUndo,
  onVerify,
  verification,
}: {
  c: Consultation;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const answers = c.answers ?? {};

  // -- Journey type tag ------------------------------------------------------
  const journeyRaw =
    typeof answers.journey_stage === "string" ? answers.journey_stage : null;
  const journeyMeta =
    (journeyRaw ? JOURNEY_META[journeyRaw] : null) ??
    (c.previousConsultationId ? JOURNEY_META.existing : JOURNEY_META.new);

  // -- Clinical metrics (verified fields take priority over self-reported) ---
  const bmiVal =
    c.bmi ?? (typeof answers.bmi === "number" ? answers.bmi : null);
  const heightVal =
    c.verifiedHeightCm ??
    c.heightCm ??
    (typeof answers.height_cm === "number" ? answers.height_cm : null);
  const weightVal =
    c.verifiedWeightKg ??
    c.weightKg ??
    (typeof answers.weight_kg === "number" ? answers.weight_kg : null);

  const bmiColor =
    bmiVal == null
      ? "text-foreground"
      : bmiVal >= 50
        ? "text-rose-700 font-bold"
        : bmiVal >= 35
          ? "text-amber-700 font-bold"
          : bmiVal >= 27
            ? "text-emerald-700 font-bold"
            : "text-rose-600 font-bold";

  // -- Current dose from prescription items or answers -----------------------
  const doseLabel = c.prescriptionItems?.[0]
    ? `${c.prescriptionItems[0].name} ${c.prescriptionItems[0].strength}`
    : typeof answers.selected_plan === "string"
      ? answers.selected_plan
      : null;

  const submittedAt = `${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(c.createdAt))}, ${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(c.createdAt))}`;

  // -- Patient initials for avatar -------------------------------------------
  const nameParts = (c.patientName || "").trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : (nameParts[0]?.[0] ?? "?").toUpperCase();

  // -- Q&A entries - ordered by FULL_Q priority, rest alphabetical ----------
  const ORDERED_KEYS = [
    "age_18_75",
    "pregnant_or_breastfeeding",
    "glp1_allergy_history",
    "mtc_or_men2_history",
    "eating_disorder_history",
    "excluding_conditions",
    "diabetes_meds_beyond_metformin",
    "currently_taking_meds",
    "other_health_conditions",
    "oral_contraceptive",
    "new_to_injectables",
    "side_effects_since_last",
    "new_meds_since",
    "hospital_since",
    "dose_change",
    "previous_provider",
    "current_dose",
    "last_dose_date",
    "time_on_medicine",
    "highest_dose_tolerated",
    "reason_for_switching",
    "side_effects_previous",
    "consent_agreement",
    "gp_consent",
    "tried_before",
    "goal",
    "weight_loss_goal",
    "previous_attempts",
    "current_medication",
    "diabetes",
    "thyroid",
    "symptoms",
    "duration",
    "first_episode",
    "blood_in_urine",
    "fever",
    "smoker",
    "activity_level",
    "alcohol_units_per_week",
    "selected_plan",
    "addons",
  ];

  const allAnswerKeys = Object.keys(answers).filter(
    (k) => !SKIP_KEYS_QA.has(k),
  );
  const orderedKeys = [
    ...ORDERED_KEYS.filter((k) => allAnswerKeys.includes(k)),
    ...allAnswerKeys.filter((k) => !ORDERED_KEYS.includes(k)),
  ];

  // GP rows to display inline at the bottom (from top-level fields)
  const gpRows = [
    { label: "Practice / GP Name", value: c.gpName || c.gpSurgery || "" },
    { label: "Practice / GP Address", value: c.gpAddress || "" },
    { label: "GP Phone", value: c.gpPhone || "" },
  ].filter((r) => r.value);

  // YES / NO answer pill - outlined style, YES=green, NO=rose, hard-stop=rose-filled
  const AnswerPill = ({
    value,
    flagged,
  }: {
    value: string;
    flagged: boolean;
  }) => {
    const lower = value.toLowerCase();
    const isYes = lower === "yes";
    const isNo = lower === "no";

    if (!isYes && !isNo) {
      // Free-text answer box
      return (
        <span
          className={cn(
            "inline-flex text-[12px] font-medium px-3 py-1.5 rounded-lg leading-snug text-right max-w-[200px] break-words",
            flagged
              ? "bg-rx-cs-surface text-rx-cs border border-border"
              : "bg-muted/40 text-foreground border border-border",
          )}
        >
          {value}
        </span>
      );
    }

    if (flagged && isYes) {
      // Hard-stop - filled rose (danger)
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 border border-rx-decline-border shrink-0 whitespace-nowrap">
          <span className="h-2 w-2 rounded-full bg-rx-decline-surface0 shrink-0" /> YES
        </span>
      );
    }

    if (isYes) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-rx-approve-surface text-primary border border-rx-approve-border shrink-0 whitespace-nowrap">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" /> YES
        </span>
      );
    }

    // NO - rose outlined
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-rx-decline-surface text-rx-decline border border-rx-decline-border shrink-0 whitespace-nowrap">
        <span className="h-2 w-2 rounded-full bg-rx-decline-surface0 shrink-0" /> NO
      </span>
    );
  };

  return (
    <div className="od2-tab-panel space-y-5" data-panel="consultation">
      <div className="od2-cons-header flex items-start justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <h3 className="od2-cons-title text-[1.35rem] font-semibold tracking-tight text-foreground">
            Patient consultation
          </h3>
          <p className="od2-cons-subtitle mt-1 text-sm text-muted-foreground">
            Submitted {submittedAt}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0",
            journeyMeta.badge,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", journeyMeta.dot)} />
          {journeyMeta.label}
        </span>
      </div>

      <div className="od2-cons-stats flex flex-wrap items-stretch gap-3">
        {[
          {
            label: "Current BMI",
            value: bmiVal != null ? bmiVal.toFixed(2) : "-",
            tone:
              bmiVal != null && bmiVal >= 35
                ? "text-rose-700"
                : bmiVal != null && bmiVal >= 27
                  ? "text-amber-700"
                  : "text-emerald-700",
          },
          {
            label: "Height",
            value: heightVal != null ? `${heightVal.toFixed(1)} cm` : "-",
            tone: "text-foreground",
          },
          {
            label: "Current Weight",
            value: weightVal != null ? `${weightVal.toFixed(1)} kg` : "-",
            tone: "text-foreground",
          },
          {
            label: "Dose",
            value: doseLabel ?? "-",
            tone: "text-foreground",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="od2-cons-stat min-w-36 flex-1 rounded-2xl border border-border bg-muted/40 px-4 py-3"
          >
            <div className="cs-lbl text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {stat.label}
            </div>
            <div
              className={cn(
                "cs-val mt-1 text-[1.05rem] font-semibold leading-tight",
                stat.tone,
              )}
            >
              {stat.value}
            </div>
          </div>
        ))}
        <div className="cs-avatar-wrap flex h-[4.35rem] w-[4.35rem] shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm ring-4 ring-emerald-100 select-none">
          <div className="cs-avatar text-xl font-bold leading-none">
            {initials}
          </div>
        </div>
      </div>

      {c.hasRedFlag && (
        <div className="flex items-center gap-2 rounded-2xl border border-rx-decline-border bg-rx-decline-surface px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Red flag detected - urgent pharmacist review required.
        </div>
      )}

      {(() => {
        const duplicateMatches =
          (c as {
            duplicatePatientMatches?: Array<{
              name: string;
              email: string;
              pmrNumber?: string | null;
              isRecommendedPrimary?: boolean;
            }>;
          }).duplicatePatientMatches ?? [];
        const riskFlags = (c as { riskFlags?: string[] }).riskFlags ?? [];
        const primary =
          duplicateMatches.find((m) => m.isRecommendedPrimary) ??
          duplicateMatches[0];
        if (
          !riskFlags.includes("possible_duplicate_patient") &&
          duplicateMatches.length === 0
        ) {
          return null;
        }
        return (
          <div className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Possible duplicate patient (same name + date of birth)
            </div>
            {primary ? (
              <p className="text-xs leading-relaxed pl-6">
                Recommended primary record:{" "}
                <strong>{primary.name}</strong>
                {primary.pmrNumber ? ` (${primary.pmrNumber})` : ""} —{" "}
                <span className="font-mono">{primary.email}</span>
              </p>
            ) : null}
          </div>
        );
      })()}

      {isInjectableWeightLossOrder(c) ? (
        <div className="border-t border-border pt-6">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-secondary">
            Clinical history
          </p>
          <WeightLossClinicalReview c={c} />
        </div>
      ) : null}

      <div className="border-t border-border pt-6">
        <div className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-secondary">
          Consultation questions
        </div>

        {(() => {
          type RenderRow = {
            key: string;
            label: string;
            value: string;
            tone: "neutral" | "green" | "yellow";
            answerTone: "yes" | "no" | "text";
          };

          const rows: RenderRow[] = [];
          const gpKeySet = new Set(gpRows.map((r) => r.label));

          const makeRow = (
            key: string,
            label: string,
            value: string,
          ): RenderRow => {
            const lower = value.trim().toLowerCase();
            const isBoolean = lower === "yes" || lower === "no";
            const isChangedRow = label.startsWith("CHANGED:");
            const isOriginalRow = label.endsWith("Original Answer");
            let tone: RenderRow["tone"] = "neutral";

            if (isOriginalRow) tone = "yellow";
            else if (isChangedRow || isBoolean) tone = "green";

            return {
              key,
              label,
              value,
              tone,
              answerTone: isBoolean ? (lower === "yes" ? "yes" : "no") : "text",
            };
          };

          for (const k of orderedKeys) {
            if (
              isInjectableWeightLossOrder(c) &&
              WEIGHT_LOSS_BUNDLED_ANSWER_KEYS.has(k)
            ) {
              continue;
            }
            const raw = answers[k];
            const value = formatAnswerValue(k, raw);
            if (!value || value === "-") continue;
            rows.push(makeRow(k, getFullQuestion(k), value));
          }

          for (const r of gpRows) {
            rows.push(makeRow(r.label, r.label, r.value));
          }

          const changeGroups = new Map<string, { reason?: string; original?: string }>();

          for (const [key, raw] of Object.entries(answers)) {
            if (raw === null || raw === undefined || raw === "") continue;

            const directMatch = key.match(
              /^(?:changed[_-])?(.+?)(?:[_-](reason|original(?:_answer)?))$/i,
            );
            if (directMatch) {
              const base = directMatch[1].replace(/[_-]+$/, "");
              const part = directMatch[2].toLowerCase().startsWith("reason")
                ? "reason"
                : "original";
              const entry = changeGroups.get(base) ?? {};
              entry[part] = formatAnswerValue(base, raw);
              changeGroups.set(base, entry);
              continue;
            }

            if (typeof raw === "object" && !Array.isArray(raw)) {
              const nested = raw as Record<string, unknown>;
              const nestedBase = key.replace(/^changed[_-]/i, "");
              const nestedReason =
                nested.reason ?? nested.current ?? nested.value ?? nested.new;
              const nestedOriginal =
                nested.original ?? nested.previous ?? nested.originalAnswer;

              if (nestedReason !== undefined || nestedOriginal !== undefined) {
                const entry = changeGroups.get(nestedBase) ?? {};
                if (nestedReason !== undefined) {
                  entry.reason = formatAnswerValue(nestedBase, nestedReason);
                }
                if (nestedOriginal !== undefined) {
                  entry.original = formatAnswerValue(nestedBase, nestedOriginal);
                }
                changeGroups.set(nestedBase, entry);
              }
            }
          }

          for (const [base, change] of changeGroups.entries()) {
            const question = getFullQuestion(base);
            if (change.reason) {
              rows.push(
                makeRow(
                  `${base}-reason`,
                  `CHANGED: ${question} - Reason`,
                  change.reason,
                ),
              );
            }
            if (change.original) {
              rows.push(
                makeRow(
                  `${base}-original`,
                  `CHANGED: ${question} - Original Answer`,
                  change.original,
                ),
              );
            }
          }

          const qaRows = rows.filter((r) => !gpKeySet.has(r.key));
          const gpOnlyRows = rows.filter((r) => gpKeySet.has(r.key));

          if (qaRows.length === 0 && gpOnlyRows.length === 0) {
            return (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-[15px] text-muted-foreground italic">
                No questionnaire answers recorded for this consultation.
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {qaRows.length > 0 ? (
                <ClinicalQaList
                  rows={qaRows.map((row) => ({
                    question: row.label,
                    value: row.value,
                  }))}
                />
              ) : null}
              {gpOnlyRows.length > 0 ? (
                <>
                  {qaRows.length > 0 ? (
                    <div className="border-t border-border" aria-hidden />
                  ) : null}
                  <ClinicalQaList
                    title="GP details"
                    rows={gpOnlyRows.map((row) => ({
                      question: row.label,
                      value: row.value,
                    }))}
                  />
                </>
              ) : null}
            </div>
          );
        })()}
      </div>

      <div className="od2-tab-completion-footer pt-2">
        <VerificationAction
          actionLabel="Mark Consultation as done"
          label="Consultation"
          onUndo={onUndo}
          onVerify={onVerify}
          verification={verification}
        />
      </div>
    </div>
  );
}

function DocumentsTab({
  onUndo,
  onVerify,
  verification,
}: {
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const docs = [
    {
      title: "Government-issued ID",
      sub: "Verified at upload time",
      uploaded: "Uploaded 18 May 2026, 16:26",
      status: "verified" as const,
    },
    {
      title: "Full Body Video",
      sub: "Self-recorded patient verification",
      uploaded: "Uploaded 21 May 2026, 14:10",
      status: "pending" as const,
    },
    {
      title: "Weight Scale Video",
      sub: "Scale reading verification",
      uploaded: "Uploaded 21 May 2026, 14:10",
      status: "pending" as const,
    },
    {
      title: "Previous Prescription",
      sub: "Patient-uploaded copy",
      uploaded: "Uploaded 18 May 2026, 16:13",
      status: "pending" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Documents</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Patient-uploaded ID and clinical documents. Each is reviewed and
          verified by a prescriber.
        </p>
        <p className="italic text-xs text-muted-foreground mt-1">
          Demo content - wire up to real records in a future task.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill color="emerald">1 verified</FilterPill>
        <FilterPill color="amber">3 Pending for review</FilterPill>
        <FilterPill color="rose">0 rejected</FilterPill>
        <FilterPill color="stone">0 not uploaded</FilterPill>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {docs.map((d) => (
          <div
            key={d.title}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="relative bg-muted h-32 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
              <span
                className={cn(
                  "absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                  d.status === "verified"
                    ? "bg-emerald-600 text-white"
                    : "bg-rx-cs-surface0 text-white",
                )}
              >
                <CheckCircle2 className="h-3 w-3" />
                {d.status === "verified" ? "Verified" : "Pending for review"}
              </span>
            </div>
            <div className="p-3">
              <div className="font-semibold text-sm text-foreground">
                {d.title}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{d.sub}</div>
              <div className="text-[11px] text-muted-foreground mt-2">
                {d.uploaded}
              </div>
              <div className="mt-3 space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs cursor-pointer"
                >
                  View
                </Button>
                {d.status === "verified" ? (
                  <div className="text-[11px] text-emerald-700 inline-flex items-center gap-1 px-2 py-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified by Yoti
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs text-rose-700 border-rx-decline-border hover:bg-rx-decline-surface cursor-pointer"
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-rx-cs-surface border border-border rounded-xl p-3 text-xs text-amber-900 flex gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">
            Complete all document verification first.
          </div>
          <div>
            Outstanding: Full Body Video (pending review), Weight Scale Video
            (pending review), Previous Prescription (pending review)
          </div>
        </div>
      </div>

      <VerificationAction
        actionLabel="Mark Documents as done"
        label="Documents"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
    </div>
  );
}

function FilterPill({
  color,
  children,
}: {
  color: "emerald" | "amber" | "rose" | "stone";
  children: React.ReactNode;
}) {
  const cls: Record<string, string> = {
    emerald: "bg-muted text-primary border-border",
    amber: "bg-rx-cs-surface text-rx-cs border-border",
    rose: "bg-rx-decline-surface text-rx-decline border-rx-decline-border",
    stone: "bg-muted/40 text-muted-foreground border-border",
  };
  return (
    <span className={cn("text-xs px-2.5 py-1 rounded-full border", cls[color])}>
      {children}
    </span>
  );
}

// --- PATIENT COUNSELLING TAB -----------------------------------------------
const COUNSELLING_TEMPLATES = [
  { title: "Wegovy - 1.7mg", body: "Escalation single pen from 1mg to 1.7mg." },
  {
    title: "Wegovy - Maintenance 1.7mg",
    body: "Repeat order at the same 1.7mg dose.",
  },
  {
    title: "Wegovy - Staying at 1.7mg",
    body: "Holding at current dose of 1.7mg rather than escalating.",
  },
  {
    title: "Wegovy - Reduce from 2.4mg to 1.7mg",
    body: "Dose reduction from 2.4mg down to 1.7mg.",
  },
  {
    title: "Wegovy - Reduce from 1.7mg to 1mg",
    body: "Dose reduction from 1.7mg down to 1mg.",
  },
  {
    title: "Wegovy - Managing side effects",
    body: "Practical guidance for nausea, constipation, diarrhoea and reflux on Wegovy.",
  },
  {
    title: "Wegovy - Restart after a treatment gap",
    body: "Restart guidance after more than 2 missed Wegovy doses.",
  },
  {
    title: "Wegovy - Switching from Mounjaro",
    body: "Patient moving from Mounjaro to Wegovy - restart at 0.25mg.",
  },
  {
    title: "Wegovy - Pregnancy & contraception",
    body: "Pregnancy, planning, contraception, and breastfeeding guidance on Wegovy.",
  },
  {
    title: "Wegovy - Stopping treatment",
    body: "Safe discontinuation guidance for Wegovy.",
  },
  {
    title: "Wegovy - 6-month review",
    body: "NICE TA875 5% weight loss review at 6 months on maintenance dose.",
  },
  {
    title: "Wegovy - Red flag / urgent symptoms",
    body: "Urgent escalation when red-flag symptoms are reported.",
  },
];

function CounsellingTab({
  onUndo,
  onVerify,
  verification,
  patientName,
}: {
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
  patientName?: string | null;
}) {
  const [med, setMed] = useState("Wegovy");
  const [dose, setDose] = useState("1.7mg");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<
    { id: string; title: string; body: string; at: string }[]
  >([]);
  const { toast } = useToast();
  const [userTemplates, setUserTemplates] = useState<
    { title: string; body: string }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(
        "pharmacare:counselling_templates",
      );
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const allTemplates = useMemo(
    () => [...COUNSELLING_TEMPLATES, ...userTemplates],
    [userTemplates],
  );
  const selectedTemplate =
    allTemplates.find((t) => t.title === selected) ?? null;
  const visibleTemplates = allTemplates.filter((template) => {
    const matchesMedication = template.title
      .toLowerCase()
      .startsWith(med.toLowerCase());
    const matchesDose =
      dose === "All doses" ||
      dose === "Bundles" ||
      template.title.toLowerCase().includes(dose.toLowerCase()) ||
      template.body.toLowerCase().includes(dose.toLowerCase());
    const matchesCategory =
      cat === "All" ||
      template.title.toLowerCase().includes(cat.toLowerCase().split(" ")[0]) ||
      template.body.toLowerCase().includes(cat.toLowerCase().split(" ")[0]);
    return matchesMedication && matchesDose && matchesCategory;
  });

  useEffect(() => {
    if (!selectedTemplate) return;
    const name = patientName ?? "";
    const bodyWithName = selectedTemplate.body
      .replace(/{{\s*patient_name\s*}}/gi, name)
      .replace(/{{\s*patientName\s*}}/gi, name)
      .replace(/{{\s*name\s*}}/gi, name)
      .replace(/{{\s*patient\s*}}/gi, name);
    setDraft(
      `Hi ${name ? name + "," : ""} please read the following counselling information carefully:\n\n${bodyWithName}\n\nReply in the secure thread if you have any questions or symptoms to report.`,
    );
  }, [selectedTemplate]);

  const sendCounselling = () => {
    if (!selectedTemplate || !draft.trim()) {
      toast({
        title: "Select a counselling template first",
        variant: "destructive",
      });
      return;
    }
    setSent((current) => [
      {
        id: String(Date.now()),
        title: selectedTemplate.title,
        body: draft.trim(),
        at: new Date().toISOString(),
      },
      ...current,
    ]);
    toast({ title: "Counselling message sent to patient thread" });
  };

  const saveUserTemplates = (next: { title: string; body: string }[]) => {
    try {
      window.localStorage.setItem(
        "pharmacare:counselling_templates",
        JSON.stringify(next),
      );
    } catch {}
  };

  const createTemplate = () => {
    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title || !body) {
      toast({ title: "Provide a title and body", variant: "destructive" });
      return;
    }
    const exists =
      userTemplates.some((t) => t.title === title) ||
      COUNSELLING_TEMPLATES.some((t) => t.title === title);
    if (exists) {
      toast({
        title: "A template with that title already exists",
        variant: "destructive",
      });
      return;
    }
    const next = [{ title, body }, ...userTemplates];
    setUserTemplates(next);
    saveUserTemplates(next);
    setCreateOpen(false);
    setNewTitle("");
    setNewBody("");
    setSelected(title);
    toast({ title: "Template saved" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-serif text-xl font-semibold tracking-tight text-secondary">
          Patient counselling
        </h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Send templated guidance via the secure thread. Personalise before
          sending.
        </p>
        <p className="italic text-xs text-muted-foreground/80 mt-1.5">
          Demo content - wire up to real records in a future task.
        </p>
      </div>

      <div className={cn(RX.panel, "rounded-3xl p-4 shadow-sm sm:p-5")}>
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Template filters
        </div>
        <div className="space-y-4">
          <FilterRow label="MEDICATION">
            {["Mounjaro", "Wegovy"].map((m) => (
              <Chip key={m} active={med === m} onClick={() => setMed(m)}>
                {m}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="DOSE">
            {[
              "All doses",
              "0.25mg",
              "0.5mg",
              "1mg",
              "1.7mg",
              "2.4mg",
              "Bundles",
            ].map((d) => (
              <Chip key={d} active={dose === d} onClick={() => setDose(d)}>
                {d}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="CATEGORY">
            {[
              "All",
              "Order counselling",
              "Staying / Reducing Dose",
              "Side effects",
              "Restart after gap",
              "Switching medication",
              "Pregnancy / contraception",
              "Stopping treatment",
              "6-month review",
              "Red flag / urgent",
            ].map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </div>

      <div className={cn(RX.panel, "rounded-3xl p-4 shadow-sm sm:p-5")}>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Templates ({visibleTemplates.length})
            </div>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="h-7 rounded-full px-3 py-1 text-xs"
            >
              + New template
            </Button>
          </div>
          {selectedTemplate && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Selected: {selectedTemplate.title}
            </span>
          )}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((t) => (
            <button
              key={t.title}
              onClick={() => setSelected(t.title)}
              className={cn(
                "min-w-0 rounded-2xl border bg-background p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
                selected === t.title
                  ? "border-primary bg-accent/40 ring-1 ring-primary/15"
                  : "border-border",
              )}
            >
              <div className="flex items-start gap-3">
                <Bookmark className="mt-0.5 h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 break-words">
                  <div className="font-semibold text-sm leading-tight tracking-tight text-foreground">
                    {t.title}
                  </div>
                  <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t.body}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {visibleTemplates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              No templates match the selected filters.
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2.5">
          Email / secure message
        </div>
        <div className={cn(RX.panel, "rounded-3xl p-4 shadow-sm sm:p-5")}>
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground [overflow-wrap:anywhere]">
                      {selectedTemplate.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Secure patient thread
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={sendCounselling}
                  className="h-10 rounded-full px-5"
                >
                  <Send className="h-4 w-4 mr-2" /> Send counselling
                </Button>
              </div>
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-[min(50vh,24rem)] w-full resize-y rounded-2xl border-border bg-background p-4 text-[15px] leading-7 text-foreground focus-visible:ring-primary/20"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-16 text-center text-sm text-muted-foreground">
              <Mail className="h-7 w-7 mx-auto mb-3 text-muted-foreground/50" />
              Select a template above to open the full-width email composer.
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2.5">
          Recently Sent
        </div>
        {sent.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-6 text-center text-sm text-muted-foreground bg-background/80">
            No templates sent yet for this conversation.
          </div>
        ) : (
          <ul className="space-y-2">
            {sent.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm"
              >
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-primary/80">
                  Sent by {CURRENT_PHARMACIST_NAME} {formatVerifiedAt(item.at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <VerificationAction
        actionLabel="Mark Patient Counselling as done"
        label="Patient Counselling"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          elevated
          className="flex max-h-[min(92dvh,52rem)] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 sm:w-[min(56rem,calc(100vw-2rem))]"
        >
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left sm:px-8">
            <DialogTitle className="font-serif text-lg font-semibold text-secondary">
              Create counselling template
            </DialogTitle>
            <p className="mt-1 text-sm font-normal text-muted-foreground">
              Draft the message patients receive - use a large preview area below.
            </p>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5 sm:px-8">
            <label className="block shrink-0">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Title
              </span>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Wegovy - Managing side effects"
                className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="flex min-h-0 flex-1 flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Body
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                Use{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-medium text-foreground">
                  {"{{patient_name}}"}
                </code>{" "}
                or{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-medium text-foreground">
                  {"{{name}}"}
                </code>{" "}
                for the patient&apos;s name.
              </p>
              <Textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Write the counselling email content here..."
                className="mt-2 min-h-[min(42vh,22rem)] flex-1 resize-y rounded-2xl border-border bg-background p-4 text-[15px] leading-7 text-foreground shadow-inner focus-visible:ring-primary/20 sm:min-h-[min(48vh,26rem)]"
              />
            </label>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-muted/40 px-6 py-4 sm:px-8">
            <Button
              variant="outline"
              className="rounded-full border-border bg-card px-5 text-primary hover:bg-muted"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createTemplate}
              className="rounded-full px-5"
            >
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start">
      <span className="pt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
        {label}:
      </span>
      <div className="flex min-w-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3.5 py-1.5 rounded-full border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}


function Milestone({
  label,
  sub,
  done,
}: {
  label: string;
  sub: string;
  done?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          done
            ? "bg-muted text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {done ? (
          <CheckCircle2 className="h-4.5 w-4.5" />
        ) : (
          <Clock className="h-4.5 w-4.5" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground tracking-tight">
          {label}
        </div>
        {sub && (
          <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// --- NOTES TAB -------------------------------------------------------------
function NotesTab({
  consultationId,
  onNotesChange,
}: {
  consultationId: string;
  onNotesChange?: () => void;
}) {
  const [notes, setNotes] = useState<ClinicalNote[]>(() =>
    readStoredNotes(consultationId),
  );
  const [draft, setDraft] = useState("");
  const [pinned, setPinned] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setNotes(readStoredNotes(consultationId));
  }, [consultationId]);

  const persistNotes = (next: ClinicalNote[]) => {
    setNotes(next);
    writeStoredNotes(consultationId, next);
    onNotesChange?.();
  };

  const postNote = () => {
    if (!draft.trim()) {
      toast({ title: "Add a note first", variant: "destructive" });
      return;
    }
    const next: ClinicalNote[] = [
      {
        id: String(Date.now()),
        body: draft.trim(),
        at: new Date().toISOString(),
        pinned,
        author: CURRENT_PHARMACIST_NAME,
      },
      ...notes,
    ];
    persistNotes(next);
    markNotesSeen(
      consultationId,
      next.map((n) => n.id),
    );
    setDraft("");
    setPinned(false);
    toast({ title: "Note added to this review" });
  };

  return (
    <section className="space-y-5" aria-labelledby="clinical-notes-title">
      <header className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2
            id="clinical-notes-title"
            className="font-serif text-xl font-semibold tracking-tight text-secondary"
          >
            Clinical Notes
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Free-form clinical commentary. Visible to all prescribers on this
            patient. Pin important notes.
          </p>
          <div className="mt-2 inline-flex select-none items-center gap-1.5 rounded-full border border-rx-cs-border bg-rx-cs-surface px-2.5 py-1 text-[11px] font-medium text-rx-cs">
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <path d="M12 8h.01" />
            </svg>
            Demo content — wire up to real records in a future task.
          </div>
        </div>
      </header>

      {/* Composer card */}
      <div className="overflow-hidden rounded-2xl border border-border border-l-4 border-l-secondary bg-card shadow-sm">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
            MD
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a clinical note about this patient..."
            rows={3}
            className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3">
          <label className="inline-flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Pin this note</span>
          </label>
          <Button
            type="button"
            size="sm"
            onClick={postNote}
            className="rounded-full px-4 shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            Add note
          </Button>
        </div>
      </div>

      {/* Notes list or empty state */}
      {notes.length === 0 ? (
        <EmptyNotes />
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-2xl p-4 shadow-sm border transition-colors",
                n.pinned
                  ? "border-rx-hold-border bg-rx-hold-surface"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {(n.author || CURRENT_PHARMACIST_NAME)
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {n.author || CURRENT_PHARMACIST_NAME}
                    </span>
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rx-hold-border bg-card px-2 py-0.5 text-[10px] font-semibold text-rx-hold">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </span>
                    )}
                  </div>
                  <div className="mb-2 mt-0.5 text-xs text-muted-foreground">
                    {new Date(n.at).toLocaleDateString("en-GB")} ·{" "}
                    {new Date(n.at).toLocaleTimeString("en-GB")}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {n.body}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NoteComposer({
  value,
  onChange,
  onPost,
  pinned,
  onTogglePinned,
}: {
  value?: string;
  onChange?: (v: string) => void;
  onPost?: () => void;
  pinned?: boolean;
  onTogglePinned?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          MD
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Add a clinical note about this patient..."
          className="min-h-10 resize-none border-0 p-0 text-sm focus-visible:ring-0"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onTogglePinned}
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            pinned ? "font-semibold text-primary" : "text-muted-foreground",
          )}
        >
          <Pin className="h-3 w-3" /> Pin
        </button>
        <Button
          size="sm"
          onClick={onPost}
          className="h-8 rounded-full px-3 shadow-sm"
        >
          Post note
        </Button>
      </div>
    </div>
  );
}

function EmptyNotes() {
  return (
    <section
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-14"
      aria-label="No clinical notes"
    >
      <div className="relative mb-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/60">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <span
          className="pointer-events-none absolute -right-1 -top-2 select-none text-sm text-rx-hold"
          aria-hidden="true"
        >
          ?
        </span>
        <span
          className="pointer-events-none absolute -left-3 top-1 select-none text-[10px] text-muted-foreground/40"
          aria-hidden="true"
        >
          ?
        </span>
        <span
          className="pointer-events-none absolute -bottom-1 -left-2 select-none text-[10px] text-rx-hold"
          aria-hidden="true"
        >
          ?
        </span>
        <span
          className="pointer-events-none absolute -bottom-2 right-0 select-none text-sm text-muted-foreground/40"
          aria-hidden="true"
        >
          ?
        </span>
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">
        No clinical notes yet
      </h3>
      <p className="text-center text-sm text-muted-foreground">
        Be the first to add a clinical note about this patient.
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Your notes will appear here.
      </p>
    </section>
  );
}

// --- ACTIVITY TAB ----------------------------------------------------------
function shortenText(text: string, max = 110): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

function formatCommTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActivityTab({ sections }: { sections: ActivityOrderSection[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsedOrders, setCollapsedOrders] = useState<
    Record<string, boolean | undefined>
  >({});
  const legendRef = useRef<HTMLDivElement | null>(null);
  const legendChipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const scrollLegendChipIntoView = (kind: string) => {
    const chip = legendChipRefs.current[kind];
    const el = legendRef.current;
    if (!chip || !el) return;

    const kindIndex = ACTIVITY_LEGEND_KINDS.indexOf(kind as (typeof ACTIVITY_LEGEND_KINDS)[number]);
    const nextKind = ACTIVITY_LEGEND_KINDS[kindIndex + 1];
    const nextChip = nextKind ? legendChipRefs.current[nextKind] : null;
    const padding = 16;

    if (nextChip) {
      const revealEnd = nextChip.offsetLeft + nextChip.offsetWidth + padding;
      if (revealEnd > el.scrollLeft + el.clientWidth) {
        el.scrollTo({
          left: Math.min(revealEnd - el.clientWidth, el.scrollWidth - el.clientWidth),
          behavior: "smooth",
        });
        return;
      }
    }

    chip.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  };

  const orderSectionCollapsed = (section: ActivityOrderSection) => {
    const stored = collapsedOrders[section.consultationId];
    if (stored !== undefined) return stored;
    return !section.isCurrent;
  };

  const toggleOrderSection = (section: ActivityOrderSection) => {
    setCollapsedOrders((prev) => ({
      ...prev,
      [section.consultationId]: !orderSectionCollapsed(section),
    }));
  };

  const renderEvent = (ev: ActivityEvent, key: string) => {
    const style = ACTIVITY_KIND_STYLES[ev.kind];
    const isExpanded = Boolean(expanded[key]);
    const initials = ev.actor
      ? ev.actor
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : null;

    return (
      <li
        key={key}
        className={cn(
          "rounded-2xl border p-4 transition-colors border-l-4",
          style.card,
          activityEventBorderClass(ev.kind),
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-2",
              style.icon,
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-card/80" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    style.badge,
                  )}
                >
                  {style.label}
                </span>
                <p className="font-semibold text-[13px] text-foreground leading-snug">
                  {plainActivityText(ev.title)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full border",
                  style.time,
                )}
              >
                {ev.time}
              </span>
            </div>
            <div className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed">
              {(() => {
                const fullRaw = ev.expandableBody ?? ev.body;
                const fullText = plainActivityText(fullRaw);
                const previewMax = 96;
                const compactLen = fullRaw.replace(/\s+/g, " ").trim().length;
                const canExpand = compactLen > previewMax;
                const displayText =
                  canExpand && !isExpanded
                    ? plainActivityText(shortenText(fullRaw, previewMax))
                    : fullText;

                return (
                  <p className={cn(canExpand && isExpanded && "whitespace-pre-wrap")}>
                    <span>{displayText}</span>
                    {canExpand ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((current) => ({
                              ...current,
                              [key]: !current[key],
                            }))
                          }
                          className="inline text-[11px] font-semibold text-primary hover:text-primary/80 align-baseline"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      </>
                    ) : null}
                  </p>
                );
              })()}
            </div>
            {ev.actor && (
              <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/60">
                <div className="h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                  {initials}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {ev.actor}
                </span>
              </div>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          Activity log
        </h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          This order is shown first with its activity expanded. Earlier orders
          are collapsed by default  -  click a header to expand. Within each
          order, the most recent activity appears at the top.
        </p>
        <div className="relative mt-4 min-w-0">
          <div
            ref={legendRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
          {ACTIVITY_LEGEND_KINDS.map((kind) => {
            const meta = ACTIVITY_KIND_STYLES[kind];
            return (
              <button
                key={kind}
                type="button"
                ref={(node) => {
                  legendChipRefs.current[kind] = node;
                }}
                onClick={() => scrollLegendChipIntoView(kind)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-transform hover:scale-[1.02]",
                  meta.badge,
                )}
              >
                <span
                  className={cn("h-2 w-2 rounded-full shrink-0", meta.legendDot)}
                />
                {meta.label}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/50 px-6 py-10 text-center text-sm text-muted-foreground">
          No activity recorded for this patient yet.
        </div>
      ) : null}

      {sections.map((section, sectionIndex) => {
        const dayGroups = groupActivityEvents(section.events);
        const isOrderCollapsed = orderSectionCollapsed(section);
        const activityCount = section.events.length;

        return (
          <div key={section.consultationId} className="space-y-4">
            <button
              type="button"
              onClick={() => toggleOrderSection(section)}
              aria-expanded={!isOrderCollapsed}
              className={cn(
                "w-full text-left rounded-2xl border-2 px-4 py-4 shadow-sm transition-colors",
                "hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                section.isCurrent
                  ? "border-primary bg-rx-approve-surface ring-2 ring-primary/15"
                  : "border-border bg-card border-l-4 border-l-muted-foreground/40 hover:border-primary/25",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        section.isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground text-primary-foreground",
                      )}
                    >
                      {section.isCurrent ? "This order" : "Previous order"}
                    </span>
                    {section.isRepeat ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-rx-cs bg-rx-cs-surface border border-rx-cs-border rounded-full px-2 py-0.5">
                        Repeat patient
                      </span>
                    ) : null}
                    <span className="text-[10px] font-semibold text-muted-foreground bg-card border border-border rounded-full px-2 py-0.5">
                      {activityCount} {activityCount === 1 ? "event" : "events"}
                      {isOrderCollapsed ? " (hidden)" : ""}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "font-mono text-xl font-bold tracking-tight tabular-nums",
                          section.isCurrent ? "text-primary" : "text-foreground",
                        )}
                      >
                        {section.summary.orderRef}
                      </p>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          orderStatusBadgeClass(section.summary.statusTone),
                        )}
                      >
                        {section.summary.statusLabel}
                      </span>
                    </div>
                    <p className="text-[15px] font-semibold leading-snug text-foreground">
                      {plainActivityText(section.summary.consultationName)}
                    </p>
                    <p className="text-sm font-medium text-foreground/80">
                      {plainActivityText(section.summary.medicationLabel)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {plainActivityText(section.placedAtLabel)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-sm font-semibold",
                      section.isCurrent ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {isOrderCollapsed
                      ? "Click to show activity for this order"
                      : "Click to hide activity for this order"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card",
                      section.isCurrent
                        ? "border-primary/40 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {isOrderCollapsed ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </span>
                  {!section.isCurrent ? (
                    <Link
                      href={`/orders/${section.consultationId}?tab=activity`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-primary hover:text-primary/80 border border-rx-approve-border bg-card rounded-lg px-3 py-2"
                    >
                      Open order
                    </Link>
                  ) : null}
                </div>
              </div>
            </button>

            {!isOrderCollapsed && dayGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground italic px-1">
                Only the system order placement is recorded so far.
              </p>
            ) : !isOrderCollapsed ? (
              <div
                className={cn(
                  "relative pl-4 border-l-2 ml-2 space-y-4",
                  section.isCurrent ? "border-primary/30" : "border-border",
                )}
              >
                {dayGroups.map((day) => (
                  <div key={`${section.consultationId}-${day.date}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground bg-card px-1">
                        {day.date}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <ul className="space-y-2.5">
                      {day.events.map((ev, i) =>
                        renderEvent(
                          ev,
                          `${section.consultationId}-${day.date}-${i}-${ev.atIso}`,
                        ),
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {sectionIndex < sections.length - 1 ? (
              <div className="relative py-5">
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
                <p className="relative mx-auto w-fit bg-card px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Previous order
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// --- RIGHT RAIL: DECISION PANEL --------------------------------------------
type ActionKind =
  | "approve"
  | "prescriber_hold"
  | "cs_hold"
  | "reject"
  | "urgent";

function DecisionPanel({
  consultationId,
  patientName,
  patientAge,
  conditionName,
  onSelectTab,
  verifications,
  onLog,
  communications,
  onNoteCommunication,
}: {
  consultationId: string;
  patientName?: string;
  patientAge?: number;
  conditionName?: string;
  onSelectTab: (tab: TabId) => void;
  verifications: VerificationState;
  onLog: (ev: ActivityEvent) => void;
  communications: PatientCommunication[];
  onNoteCommunication: (message: string) => void;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState<ActionKind | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [urgentMarked, setUrgentMarked] = useState(false);
  const [contactMethod, setContactMethod] = useState("Phone call");
  const [contactNote, setContactNote] = useState("");
  // CS hold resubmission checkboxes
  const [resubDocs, setResubDocs] = useState({
    id: false,
    video: false,
    scale: false,
    prescription: false,
  });
  // -- Prescription Approval Panel (RXA drawer) form state ------------------
  const [rxaStep, setRxaStep] = useState<1 | 2>(1);
  const [rxaScrStatus, setRxaScrStatus] = useState<
    "" | "accessed" | "not_accessed"
  >("");
  const [rxaScrChecks, setRxaScrChecks] = useState({
    consent: false,
    medications: false,
    allergies: false,
    diagnoses: false,
  });
  const [rxaScrSummary, setRxaScrSummary] = useState("");
  const [rxaScrNotAccessedReason, setRxaScrNotAccessedReason] = useState("");
  const [rxaCommMethod, setRxaCommMethod] = useState<
    "" | "phone" | "secure_message" | "video" | "other"
  >("");
  const [rxaCommOther, setRxaCommOther] = useState("");
  const [rxaCommDate, setRxaCommDate] = useState("");
  const [rxaCommSummary, setRxaCommSummary] = useState("");
  const [rxaEscalated, setRxaEscalated] = useState<"yes" | "no">("no");
  const [rxaEscalatedTo, setRxaEscalatedTo] = useState("");
  const [rxaEscalationNotes, setRxaEscalationNotes] = useState("");
  const [rxaFinalDecision, setRxaFinalDecision] = useState<
    "approved" | "declined" | "deferred"
  >("approved");
  const review = useReviewConsultation();
  const remainingSections = CHECKLIST_ITEMS.filter(
    (item) => !verifications[item.id],
  );
  const checklistComplete = remainingSections.length === 0;
  const latestContact = communications[0] ?? {
    title: "No contact logged yet",
    preview: "Use Log to record a call or message.",
    message: "",
    actor: CURRENT_PHARMACIST_NAME,
    at: new Date().toISOString(),
    status: "awaiting_response" as const,
    direction: "outgoing" as const,
    id: "placeholder",
  };
  const awaitingResponse = communications.filter(
    (comm) => comm.status === "awaiting_response",
  );
  const patientResponded = communications.filter(
    (comm) => comm.status === "patient_responded",
  );

  const submit = async () => {
    if (!open) return;

    if (open === "urgent") {
      setUrgentMarked(true);
      onLog(activityForUrgent(CURRENT_PHARMACIST_NAME));
      toast({ title: "Order marked as urgent" });
      setOpen(null);
      setReason("");
      return;
    }
    if (
      (open === "prescriber_hold" || open === "cs_hold" || open === "reject") &&
      !reason.trim()
    ) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    const actionMap: Record<
      Exclude<ActionKind, "urgent">,
      ConsultationReviewInputAction
    > = {
      approve: "approve",
      prescriber_hold: "more_info",
      cs_hold: "more_info",
      reject: "reject",
    };
    const resubLabels: Record<keyof typeof resubDocs, string> = {
      id: "ID Card",
      video: "Full Body Video",
      scale: "Weight Scale Video",
      prescription: "Previous Prescription",
    };
    const resubList = (Object.keys(resubDocs) as Array<keyof typeof resubDocs>)
      .filter((k) => resubDocs[k])
      .map((k) => resubLabels[k]);
    const noteForAction =
      open === "prescriber_hold"
        ? `[PRESCRIBER_HOLD] ${reason.trim()}`
        : open === "cs_hold"
          ? `[CS_HOLD] ${reason.trim()}${resubList.length > 0 ? ` | Resubmission requested: ${resubList.join(", ")}.` : ""}`
          : reason.trim() || "Approved after completing the clinical checklist.";
    try {
      await review.mutateAsync({
        id: consultationId,
        data: {
          action: actionMap[open],
          pharmacistNote:
            noteForAction,
          rejectReason: open === "reject" ? "other" : undefined,
        },
      });
      // -- Log the action to the activity feed ------------------------------
      const holdDetail = [
        reason.trim(),
        resubList.length > 0
          ? `Resubmission requested: ${resubList.join(", ")}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      const logEntry: Record<Exclude<ActionKind, "urgent">, ActivityEvent> = {
        approve: activityForPrescriptionApproved(
          CURRENT_PHARMACIST_NAME,
          reason.trim(),
        ),
        prescriber_hold: createActivityEvent({
          kind: "prescriber_hold",
          title: "Placed on Prescriber Hold",
          body: shortenText(
            reason.trim() || "Order placed on prescriber hold.",
            96,
          ),
          expandableBody: reason.trim() || undefined,
          actor: CURRENT_PHARMACIST_NAME,
        }),
        cs_hold: createActivityEvent({
          kind: "cs_hold",
          title: "Placed on CS Hold",
          body: shortenText(
            holdDetail || "Order placed on clinical support hold.",
            96,
          ),
          expandableBody: holdDetail || undefined,
          actor: CURRENT_PHARMACIST_NAME,
        }),
        reject: createActivityEvent({
          kind: "declined",
          title: "Prescription declined & refunded",
          body: shortenText(
            reason.trim() || "Order rejected and refund initiated.",
            96,
          ),
          expandableBody: reason.trim() || undefined,
          actor: CURRENT_PHARMACIST_NAME,
        }),
      };
      onLog(logEntry[open]);
      if (open === "cs_hold") {
        const responseTag = buildWaitTag({
          id: "cs-hold-response",
          kind: "pending_customer_response",
          detail: holdDetail || "Awaiting patient reply on CS hold.",
          source: "cs_hold",
        });
        upsertSessionWaitTag(consultationId, responseTag);
        onLog(activityForWaitTag(responseTag, CURRENT_PHARMACIST_NAME));

        const resubSlotIds: Record<keyof typeof resubDocs, string> = {
          id: "government-id",
          video: "full-body-video",
          scale: "weight-scale-video",
          prescription: "previous-prescription",
        };
        for (const key of Object.keys(resubDocs) as Array<
          keyof typeof resubDocs
        >) {
          if (!resubDocs[key]) continue;
          const docTag = buildWaitTag({
            id: `doc-${resubSlotIds[key]}`,
            kind: "pending_document_upload",
            detail: `${resubLabels[key]} — resubmission requested on CS hold, awaiting patient upload.`,
            source: "cs_hold",
            relatedDocId: resubSlotIds[key],
          });
          upsertSessionWaitTag(consultationId, docTag);
          onLog(activityForWaitTag(docTag, CURRENT_PHARMACIST_NAME));
        }
      }
      toast({ title: "Action recorded" });
      setOpen(null);
      setReason("");
      navigate("/queue");
    } catch {
      toast({ title: "Failed to submit action", variant: "destructive" });
    }
  };

  const openDialog = (kind: ActionKind) => {
    setReason("");
    setResubDocs({
      id: false,
      video: false,
      scale: false,
      prescription: false,
    });
    if (kind === "approve" && !checklistComplete) {
      toast({
        title: "Complete the checklist before approving",
        description: `${remainingSections.length} section${remainingSections.length === 1 ? "" : "s"} still pending.`,
        variant: "destructive",
      });
      return;
    }
    if (kind === "approve") {
      setRxaStep(1);
      setRxaScrStatus("");
      setRxaScrChecks({
        consent: false,
        medications: false,
        allergies: false,
        diagnoses: false,
      });
      setRxaScrSummary("");
      setRxaScrNotAccessedReason("");
      setRxaCommMethod("");
      setRxaCommOther("");
      setRxaCommDate("");
      setRxaCommSummary("");
      setRxaEscalated("no");
      setRxaEscalatedTo("");
      setRxaEscalationNotes("");
      setRxaFinalDecision("approved");
    }
    setOpen(kind);
  };

  const logContact = () => {
    if (!contactNote.trim()) {
      toast({ title: "Add contact notes first", variant: "destructive" });
      return;
    }
    onNoteCommunication(
      `${contactMethod}: ${contactNote.trim()}`,
    );
    setContactNote("");
    setContactOpen(false);
    toast({ title: "Contact logged" });
  };

  return (
    <>
      <div className="min-h-[9.5rem] rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-muted text-primary flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="rx-label-caps">
              Returned to review
            </div>
            <div className="text-base sm:text-lg text-foreground font-semibold mt-2 leading-snug">
              Released by Om Khetia
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              19 May 2026 - 15:57
            </div>
            <div className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Provided everything asked for.
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl p-4 shadow-sm border transition-colors duration-500",
          checklistComplete
            ? "bg-card border-border"
            : "bg-linear-to-br from-card to-rx-cs-surface/60 border-border",
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
              checklistComplete
                ? "bg-muted text-primary"
                : "bg-rx-cs-surface text-rx-cs",
            )}
          >
            {checklistComplete ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="text-sm font-semibold text-foreground flex-1">
            Review checklist
          </div>
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums",
              checklistComplete
                ? "bg-muted text-primary"
                : "bg-rx-cs-surface text-rx-cs",
            )}
          >
            {CHECKLIST_ITEMS.length - remainingSections.length}/
            {CHECKLIST_ITEMS.length}
          </span>
        </div>
        <div className="mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                checklistComplete ? "bg-primary" : "bg-rx-cs",
              )}
              style={{
                width: `${((CHECKLIST_ITEMS.length - remainingSections.length) / CHECKLIST_ITEMS.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {CHECKLIST_ITEMS.map((it) => {
            const verified = verifications[it.id];
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab(it.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left transition-all border",
                    verified
                      ? "bg-muted text-foreground hover:bg-muted/80 border-border"
                      : "bg-card/80 text-muted-foreground hover:bg-muted/50 hover:border-border border-transparent",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                        verified
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {verified ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium leading-snug">
                        {it.label}
                      </div>
                      {verified && (
                        <div className="mt-0.5 text-[10px] leading-relaxed text-primary truncate">
                          {verified.verifiedBy}{" "}
                          {formatVerifiedAt(verified.verifiedAt)}
                        </div>
                      )}
                    </div>
                    {!verified && (
                      <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-2">
        <ActionCard
          tone="success"
          title="Approve prescription"
          sub={
            checklistComplete
              ? "Ready - green light the order"
              : `${remainingSections.length} checklist items remaining`
          }
          onClick={() => openDialog("approve")}
          IconCmp={CheckCircle2}
          active={checklistComplete}
        />
        <ActionCard
          tone="info"
          title="Place on Prescriber Hold"
          sub="Clinical query - hold for prescriber review"
          onClick={() => openDialog("prescriber_hold")}
          IconCmp={Lock}
        />
        <ActionCard
          tone="warning"
          title="Place on CS Hold"
          sub="Request resubmission from patient"
          onClick={() => openDialog("cs_hold")}
          IconCmp={Users}
        />
        <ActionCard
          tone="danger"
          title="Decline & refund order"
          sub="Reject prescription and refund"
          onClick={() => openDialog("reject")}
          IconCmp={XCircle}
        />
        {urgentMarked ? (
          <ActionCard
            tone="urgent"
            title="Urgent — undo"
            sub="Remove urgent flag from this order"
            onClick={() => {
              setUrgentMarked(false);
              onLog(activityForUrgent(CURRENT_PHARMACIST_NAME, true));
              toast({ title: "Urgent flag removed" });
            }}
            IconCmp={CheckCircle2}
          />
        ) : (
          <ActionCard
            tone="urgent"
            title="Mark as urgent"
            sub="Flag for immediate prescriber attention"
            onClick={() => setOpen("urgent")}
            IconCmp={FlagIcon}
          />
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Last contacted
          </div>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:bg-rx-approve-surface rounded-full px-2.5 py-1 transition-colors"
          >
            <Plus className="h-3 w-3" /> Log
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-200 px-2 py-0.5 rounded-full">
            <Phone className="h-3 w-3" /> {latestContact.title.replace(/ .*/, "")}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatCommTime(latestContact.at)}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1.5">
          {formatCommTime(latestContact.at)}
        </div>
        <p className="text-[13px] text-foreground mt-2.5 leading-relaxed">
          {latestContact.preview}
        </p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <div className="h-6 w-6 rounded-full bg-rx-approve-surface text-primary flex items-center justify-center text-[10px] font-semibold">
            {latestContact.actor
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
          <span className="text-[12px] text-muted-foreground">
            {latestContact.actor}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Awaiting patient response
            </div>
            <span className="text-[11px] font-semibold rounded-full bg-rx-approve-surface text-primary px-2.5 py-1 border border-border">
              {awaitingResponse.length}
            </span>
          </div>
          <div className="space-y-2">
            {awaitingResponse.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No messages awaiting reply.</p>
            ) : (
              awaitingResponse.slice(0, 2).map((comm) => (
                <div key={comm.id} className="rounded-xl bg-rx-approve-surface/60 border border-border p-3">
                  <div className="text-sm font-semibold text-foreground">{comm.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{comm.preview}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Patient responded - needs review
            </div>
            <span className="text-[11px] font-semibold rounded-full bg-rx-cs-surface text-rx-cs px-2.5 py-1 border border-border">
              {patientResponded.length}
            </span>
          </div>
          <div className="space-y-2">
            {patientResponded.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No patient replies to review.</p>
            ) : (
              patientResponded.slice(0, 2).map((comm) => (
                <div key={comm.id} className="rounded-xl bg-rx-cs-surface/60 border border-border p-3">
                  <div className="text-sm font-semibold text-foreground">{comm.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{comm.preview}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog modal={false} open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-lg shadow-2xl ring-1 ring-stone-200">
          <DialogHeader>
            <DialogTitle>Log patient contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Method
              <select
                value={contactMethod}
                onChange={(event) => setContactMethod(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              >
                <option>Phone call</option>
                <option>Secure message</option>
                <option>Email</option>
                <option>SMS</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Notes
              <Textarea
                value={contactNote}
                onChange={(event) => setContactNote(event.target.value)}
                placeholder="Summarise what happened and any next action..."
                className="mt-1 min-h-28 rounded-xl border-border text-sm normal-case tracking-normal"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={logContact}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -- Prescription Approval Panel - right-side sliding DRAWER -- */}
      {open === "approve" ? (
        <>
          <div
            className="rx-overlay z-[55]"
            onClick={() => !review.isPending && setOpen(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Prescription Approval Panel"
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[520px] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out translate-x-0"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-4 w-4 text-emerald-700" />
            </div>
            <h5 className="font-semibold text-foreground text-[15px]">
              Prescription Approval Panel
            </h5>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rx-cs-surface border border-border text-amber-700 text-[11px] font-semibold select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> In
              review
            </span>
            <button
              type="button"
              onClick={() => !review.isPending && setOpen(null)}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-5 py-3 border-b border-border bg-muted/40/80 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-colors duration-300",
                rxaStep > 1
                  ? "bg-primary text-white"
                  : "bg-emerald-600 text-white ring-2 ring-emerald-200 ring-offset-1",
              )}
            >
              {rxaStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
            </div>
            <span
              className={cn(
                "text-[12px] font-medium",
                rxaStep >= 1 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Safety checks
            </span>
          </div>
          <div
            className={cn(
              "flex-1 mx-3 h-0.5 rounded-full transition-colors duration-500",
              rxaStep > 1 ? "bg-primary" : "bg-muted",
            )}
          />
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-colors duration-300",
                rxaStep === 2
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-200 ring-offset-1"
                  : "bg-muted text-muted-foreground",
              )}
            >
              2
            </div>
            <span
              className={cn(
                "text-[12px] font-medium",
                rxaStep === 2 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Decision
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Patient card */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                  Patient
                </div>
                <div className="text-[13px] font-semibold text-foreground">
                  {patientName || "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                  Age
                </div>
                <div className="text-[13px] font-semibold text-foreground">
                  {patientAge ? `${patientAge} yrs` : "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                  Prescription
                </div>
                <div className="text-[13px] font-semibold text-foreground">
                  {conditionName || "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                  Prescriber
                </div>
                <div className="text-[13px] font-semibold text-foreground">
                  -
                </div>
              </div>
            </div>
          </div>

          {/* -- Step 1: Safety Checks -- */}
          {rxaStep === 1 && (
            <div className="space-y-5">
              {/* SCR section */}
              <div className="space-y-3">
                <h6 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Patient Safety Checks - Summary Care Record (SCR)
                </h6>
                <div className="flex flex-wrap gap-4">
                  {(["accessed", "not_accessed"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() => setRxaScrStatus(val)}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          rxaScrStatus === val
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-border",
                        )}
                      >
                        {rxaScrStatus === val && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <span className="text-[13px] text-foreground">
                        {val === "accessed"
                          ? "SCR Accessed"
                          : "SCR Not Accessed"}
                      </span>
                    </button>
                  ))}
                </div>

                {rxaScrStatus === "accessed" && (
                  <div className="pl-1 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          "consent",
                          "medications",
                          "allergies",
                          "diagnoses",
                        ] as const
                      ).map((key) => (
                        <button
                          key={key}
                          type="button"
                          className="flex items-center gap-2 text-left"
                          onClick={() =>
                            setRxaScrChecks((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                        >
                          <div
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                              rxaScrChecks[key]
                                ? "bg-emerald-600 border-emerald-600"
                                : "border-border bg-card",
                            )}
                          >
                            {rxaScrChecks[key] && (
                              <svg
                                className="h-2.5 w-2.5 text-white"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M2 5l2.5 2.5L8 3"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-[12px] text-foreground">
                            {key === "consent"
                              ? "Consent recorded"
                              : key === "medications"
                                ? "Medications reviewed"
                                : key === "allergies"
                                  ? "Allergies checked"
                                  : "Diagnoses assessed"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        SCR Summary
                      </label>
                      <textarea
                        value={rxaScrSummary}
                        onChange={(e) => setRxaScrSummary(e.target.value)}
                        rows={2}
                        placeholder="Notable findings..."
                        className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-foreground placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                )}

                {rxaScrStatus === "not_accessed" && (
                  <div className="pl-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Reason for not accessing SCR
                    </label>
                    <textarea
                      value={rxaScrNotAccessedReason}
                      onChange={(e) =>
                        setRxaScrNotAccessedReason(e.target.value)
                      }
                      rows={2}
                      placeholder="Reason..."
                      className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-foreground placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Two-way communication */}
              <div className="space-y-3">
                <h6 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Two-Way Communication{" "}
                  <span className="font-normal normal-case text-muted-foreground">
                    (if SCR not used or incomplete)
                  </span>
                </h6>
                <div className="flex flex-wrap gap-4">
                  {(["phone", "secure_message", "video", "other"] as const).map(
                    (val) => (
                      <button
                        key={val}
                        type="button"
                        className="flex items-center gap-2"
                        onClick={() => setRxaCommMethod(val)}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            rxaCommMethod === val
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-border",
                          )}
                        >
                          {rxaCommMethod === val && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <span className="text-[13px] text-foreground">
                          {val === "phone"
                            ? "Phone"
                            : val === "secure_message"
                              ? "Secure Message"
                              : val === "video"
                                ? "Video"
                                : "Other"}
                        </span>
                      </button>
                    ),
                  )}
                </div>

                {rxaCommMethod === "other" && (
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Specify other
                    </label>
                    <input
                      type="text"
                      value={rxaCommOther}
                      onChange={(e) => setRxaCommOther(e.target.value)}
                      placeholder="e.g. video conferencing app..."
                      className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-foreground placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                  </div>
                )}

                <DateField
                  compact
                  label="Date"
                  value={rxaCommDate}
                  max={toIsoDate(new Date())}
                  onChange={setRxaCommDate}
                />

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Discussion Summary <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={rxaCommSummary}
                    onChange={(e) => setRxaCommSummary(e.target.value)}
                    rows={3}
                    placeholder="Summarize the conversation..."
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-foreground placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* -- Step 2: Decision -- */}
          {rxaStep === 2 && (
            <div className="space-y-5">
              {/* Escalation */}
              <div className="space-y-3">
                <h6 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Was escalation required?
                </h6>
                <div className="flex gap-5">
                  {(["yes", "no"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() => setRxaEscalated(val)}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          rxaEscalated === val
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-border",
                        )}
                      >
                        {rxaEscalated === val && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <span className="text-[13px] text-foreground">
                        {val === "yes" ? "Yes" : "No"}
                      </span>
                    </button>
                  ))}
                </div>

                {rxaEscalated === "yes" && (
                  <div className="pl-1 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Escalated to
                      </label>
                      <input
                        type="text"
                        value={rxaEscalatedTo}
                        onChange={(e) => setRxaEscalatedTo(e.target.value)}
                        placeholder="e.g. GP, senior prescriber..."
                        className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-foreground placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Escalation notes
                      </label>
                      <textarea
                        value={rxaEscalationNotes}
                        onChange={(e) => setRxaEscalationNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Final decision */}
              <div className="space-y-3">
                <h6 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Final decision
                </h6>
                <div className="space-y-2.5">
                  {(["approved", "declined", "deferred"] as const).map(
                    (val) => (
                      <button
                        key={val}
                        type="button"
                        className="flex items-center gap-2"
                        onClick={() => setRxaFinalDecision(val)}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            rxaFinalDecision === val
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-border",
                          )}
                        >
                          {rxaFinalDecision === val && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <span className="text-[13px] text-foreground">
                          {val === "approved"
                            ? "Approved for Supply"
                            : val === "declined"
                              ? "Declined"
                              : "Deferred - Awaiting Info"}
                        </span>
                      </button>
                    ),
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Rationale for final decision{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Document the clinical reasoning for your decision..."
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-foreground placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Audit block */}
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Audit
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground">
                      Reviewed by
                    </span>
                    <span className="text-[12px] font-semibold text-foreground">
                      {CURRENT_PHARMACIST_NAME}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground">
                      Decision time
                    </span>
                    <span className="text-[12px] font-semibold text-foreground">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={() => !review.isPending && setOpen(null)}
            disabled={review.isPending}
            className="text-[13px] text-muted-foreground hover:text-foreground font-medium px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-40"
          >
            Save draft & close
          </button>
          <div className="flex items-center gap-2">
            {rxaStep === 2 && (
              <button
                type="button"
                onClick={() => setRxaStep(1)}
                disabled={review.isPending}
                className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            {rxaStep === 1 && (
              <button
                type="button"
                onClick={() => setRxaStep(2)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {rxaStep === 2 && (
              <button
                type="button"
                onClick={submit}
                disabled={review.isPending || !reason.trim()}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                {review.isPending ? "Approving..." : "Approve & issue Rx"}
              </button>
            )}
          </div>
        </div>
          </div>
        </>
      ) : null}

      {/* -- Prescriber Hold dialog -- */}
      <Dialog
        open={open === "prescriber_hold"}
        onOpenChange={(o) => !o && setOpen(null)}
      >
        <DialogContent
          elevated
          className="max-w-2xl w-[min(calc(100vw-2rem),42rem)] gap-0 p-0 overflow-hidden rounded-2xl border-border shadow-2xl max-h-[min(92dvh,880px)]"
        >
          <div className="bg-linear-to-r from-rx-hold-surface to-card px-8 pt-8 pb-6 text-center border-b border-border">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rx-hold-surface mb-5 mx-auto shadow-sm ring-1 ring-rx-hold-border">
              <Lock className="h-8 w-8 text-rx-hold" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl font-bold text-foreground tracking-tight text-center">
                Place on Prescriber Hold
              </DialogTitle>
            </DialogHeader>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
              This order will be held pending prescriber clarification. The
              patient will not be notified until released.
            </p>
          </div>
          <div className="px-8 py-6 space-y-2">
            <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Reason <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the clinical reason for placing on hold..."
              className="min-h-[9rem] rounded-xl border-border text-base leading-relaxed px-4 py-3"
            />
          </div>
          <DialogFooter className="px-8 py-5 gap-3 border-t border-border bg-muted/40/80 sm:justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setOpen(null)}
              className="h-12 px-6 text-base border-rx-decline-border text-rose-700 hover:bg-rx-decline-surface"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={submit}
              disabled={review.isPending || !reason.trim()}
              className="h-12 px-8 text-base bg-rx-hold hover:bg-rx-hold/90 text-white font-semibold"
            >
              {review.isPending ? "Placing..." : "Place on hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -- CS Hold dialog -- */}
      <Dialog
        open={open === "cs_hold"}
        onOpenChange={(o) => !o && setOpen(null)}
      >
        <DialogContent
          elevated
          className="max-w-2xl w-[min(calc(100vw-2rem),42rem)] gap-0 p-0 overflow-hidden rounded-2xl border-border shadow-2xl max-h-[min(92dvh,920px)] overflow-y-auto"
        >
          <div className="bg-linear-to-r from-rx-cs-surface to-card px-8 pt-8 pb-6 border-b border-border">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rx-cs-surface mb-4 ring-1 ring-rx-cs-border">
              <Clock className="h-7 w-7 text-rx-cs" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-foreground text-left">
                Place order on CS hold
              </DialogTitle>
            </DialogHeader>
            <p className="text-base text-muted-foreground leading-relaxed mt-2">
              This will move the order to the CS Hold queue. Only customer support
              can release it back.
            </p>
          </div>

          <div className="px-8 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">
                Reason for placing on hold
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="e.g. Awaiting GP confirmation, BMI inconsistency, missing documentation..."
                className="rounded-xl border-border text-base leading-relaxed px-4 py-3 resize-none min-h-[7rem]"
              />
            </div>

            <div className="rounded-2xl border border-border bg-muted/40/60 p-5">
              <p className="text-base font-bold text-foreground">
                Request resubmission from patient
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 mb-4 leading-relaxed">
                Tick documents the patient needs to re-upload. A single email is
                sent listing only the ticked items.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["id", "ID Card"],
                    ["video", "Full Body Video"],
                    ["scale", "Weight Scale Video"],
                    ["prescription", "Previous Prescription"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 cursor-pointer hover:border-primary/30 hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={resubDocs[key]}
                      onChange={(e) =>
                        setResubDocs((cur) => ({
                          ...cur,
                          [key]: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded border-border accent-amber-600"
                    />
                    <span className="text-base font-medium text-foreground">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-5 gap-3 border-t border-border bg-muted/40/80 sticky bottom-0">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setOpen(null)}
              className="h-12 px-6 text-base border-rx-decline-border text-rose-600 hover:bg-rx-decline-surface"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={submit}
              disabled={review.isPending || !reason.trim()}
              className="h-12 px-8 text-base bg-rx-cs hover:bg-rx-cs/90 text-white font-semibold gap-2"
            >
              <Clock className="h-5 w-5 shrink-0" />
              {review.isPending ? "Placing..." : "Place on hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -- Decline & Refund - right drawer (above patient chat z-70) -- */}
      {open === "reject" ? (
        <>
          <div
            className="rx-overlay z-[78]"
            onClick={() => !review.isPending && setOpen(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Decline and refund order"
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[min(100vw,40rem)] flex-col bg-card shadow-[-12px_0_48px_rgba(0,0,0,0.18)] border-l border-border"
          >
            <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0 bg-linear-to-r from-rx-decline-surface/80 to-card">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-2xl bg-rx-decline-surface flex items-center justify-center shrink-0 shadow-sm">
                  <XCircle className="h-7 w-7 text-rx-decline" />
                </div>
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  Decline &amp; refund order
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !review.isPending && setOpen(null)}
                disabled={review.isPending}
                className="h-11 w-11 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="rounded-2xl border border-rx-decline-border bg-rx-decline-surface p-5 flex gap-4">
                <AlertTriangle className="h-7 w-7 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-base font-bold text-rose-900 mb-3">
                    This action will:
                  </p>
                  <ul className="text-base text-rose-800 space-y-2.5 leading-relaxed">
                    {[
                      "Refund the full amount to the customer's original payment method",
                      "Cancel the order in Shopify and restock inventory",
                      "Send a Shopify cancellation email to the customer",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-rx-decline-surface0 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-base font-bold text-rose-950 mt-4">
                    This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border overflow-hidden divide-y divide-stone-100">
                {[
                  { label: "Patient", value: patientName || "-" },
                  { label: "Order", value: orderRefFromId(consultationId) },
                  { label: "Amount", value: "-" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-5 py-3.5 bg-muted/40/50"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-base font-bold text-foreground block mb-2">
                  Reason for declining &amp; refunding{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={6}
                  placeholder="e.g. Patient does not meet clinical criteria - BMI below threshold and no contraindication justification provided. Refunding in full and cancelling."
                  className="rounded-xl border-border text-base leading-relaxed px-4 py-3 resize-none min-h-[10rem]"
                />
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  This reason is logged to the audit trail and added as a staff note
                  on the Shopify order.
                </p>
              </div>
            </div>

            <div className="shrink-0 px-8 py-5 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/40/90">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setOpen(null)}
                disabled={review.isPending}
                className="h-12 px-8 text-base w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={submit}
                disabled={review.isPending || !reason.trim()}
                className="h-12 px-8 text-base bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2 w-full sm:w-auto"
              >
                <XCircle className="h-5 w-5 shrink-0" />
                {review.isPending ? "Declining..." : "Refund & cancel order"}
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {/* -- Urgent dialog -- */}
      <Dialog
        open={open === "urgent"}
        onOpenChange={(o) => !o && setOpen(null)}
      >
        <DialogContent className="max-w-sm my-12">
          <DialogHeader>
            <DialogTitle>Mark as urgent</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This order will be flagged as urgent and bumped to the top of the
            review queue.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={review.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {review.isPending ? "Marking..." : "Mark as urgent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

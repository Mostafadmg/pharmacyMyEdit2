import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetConsultation, useReviewConsultation, getGetConsultationQueryKey, ConsultationReviewInputAction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { format, formatDistanceToNow } from "date-fns";
import { getCurrentToken } from "@/context/AuthContext";
import PrescriptionBuilder from "@/components/PrescriptionBuilder";
import { type PrescriptionItemDraft, formatPrescriptionItems } from "@/data/medications";

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const currentToken = getCurrentToken();
  return {
    ...(extra ?? {}),
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  more_info_needed: "More Info Needed",
  referred: "Referred",
  red_flag: "Urgent",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706",
  approved: "#16A34A",
  rejected: "#64748B",
  more_info_needed: "#2563EB",
  referred: "#7C3AED",
  red_flag: "#EF4444",
  cancelled: "#94A3B8",
};

function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DEV_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DEV_DOMAIN}/api-server`;
  }
  return "";
}

interface PatientNote {
  id: string;
  patientEmail: string;
  note: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConsultationNote {
  id: string;
  consultationId: string;
  note: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PatientConsultation {
  id: string;
  conditionName: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  prescription: string | null;
  pharmacistNote: string | null;
}

const TABS = ["Overview", "History", "Notes"] as const;
type Tab = typeof TABS[number];

export default function ConsultationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [note, setNote] = useState("");
  const [prescription, setPrescription] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemDraft[]>([]);
  const [referral, setReferral] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Structured action modals
  const [actionModal, setActionModal] = useState<null | "approve" | "more_info" | "refer" | "reject">(null);
  const [successInfo, setSuccessInfo] = useState<null | {
    action: "approve" | "more_info" | "refer" | "reject";
    patientName: string;
    pdfUrl: string | null;
  }>(null);
  const [moreInfoMessage, setMoreInfoMessage] = useState("");
  const [referRecipientType, setReferRecipientType] = useState<string>("gp");
  const [referRecipientName, setReferRecipientName] = useState("");
  const [referUrgency, setReferUrgency] = useState<string>("routine");
  const [referMessage, setReferMessage] = useState("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectExplanation, setRejectExplanation] = useState("");

  const [patientHistory, setPatientHistory] = useState<PatientConsultation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [editText, setEditText] = useState("");

  // Consultation-level notes
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [cNotesLoading, setCNotesLoading] = useState(false);
  const [newCNote, setNewCNote] = useState("");
  const [savingCNote, setSavingCNote] = useState(false);
  const [editingCNote, setEditingCNote] = useState<ConsultationNote | null>(null);
  const [editCText, setEditCText] = useState("");

  // Photo lightbox
  const [lightboxPhotoUrl, setLightboxPhotoUrl] = useState<string | null>(null);

  const { data: consultation, isLoading } = useGetConsultation(id ?? "", {
    query: { enabled: !!id, queryKey: getGetConsultationQueryKey(id ?? "") },
  });

  const reviewMutation = useReviewConsultation({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: getGetConsultationQueryKey(id ?? "") });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setActionModal(null);
        setSubmitting(false);
        const action = variables?.data?.action as "approve" | "more_info" | "refer" | "reject";
        const isApprove = action === "approve";
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const pdfUrl = isApprove && id && domain
          ? `https://${domain}/api/consultations/${id}/prescription.pdf`
          : null;
        setSuccessInfo({
          action,
          patientName: consultation?.patientName ?? "the patient",
          pdfUrl,
        });
      },
      onError: (err: unknown) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const detail =
          (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string")
            ? (err as { message: string }).message
            : "Failed to submit review. Please try again.";
        Alert.alert("Couldn't submit decision", detail);
        setSubmitting(false);
      },
    },
  });

  async function openPrescriptionPdf(url: string) {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert("Unable to open", "Please copy the link manually.");
      }
    }
  }

  const apiBase = getApiBase();
  const pharmacistName = typeof localStorage !== "undefined"
    ? (localStorage.getItem("pharmacist_name") ?? "Pharmacist")
    : "Pharmacist";

  async function loadHistory(email: string) {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/consultations/patient/${encodeURIComponent(email)}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      setPatientHistory(json.consultations ?? []);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadNotes(email: string) {
    setNotesLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/patient-notes/${encodeURIComponent(email)}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      setPatientNotes(json.notes ?? []);
    } catch {
      // ignore
    } finally {
      setNotesLoading(false);
    }
  }

  async function loadConsultationNotes(consultationId: string) {
    setCNotesLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/consultation-notes/${encodeURIComponent(consultationId)}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      setConsultationNotes(json.notes ?? []);
    } catch {
      // ignore
    } finally {
      setCNotesLoading(false);
    }
  }

  useEffect(() => {
    if (consultation?.patientEmail && activeTab === "History") {
      loadHistory(consultation.patientEmail);
    }
    if (activeTab === "Notes") {
      if (consultation?.patientEmail) loadNotes(consultation.patientEmail);
      if (id) loadConsultationNotes(id);
    }
  }, [activeTab, consultation?.patientEmail, id]);

  async function handleAddCNote() {
    if (!newCNote.trim() || !id) return;
    setSavingCNote(true);
    try {
      const res = await fetch(`${apiBase}/api/consultation-notes`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ consultationId: id, note: newCNote.trim() }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setConsultationNotes(prev => [json.note, ...prev]);
      setNewCNote("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to save note.");
    } finally {
      setSavingCNote(false);
    }
  }

  async function handleSaveCEdit() {
    if (!editingCNote || !editCText.trim()) return;
    setSavingCNote(true);
    try {
      const res = await fetch(`${apiBase}/api/consultation-notes/${editingCNote.id}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editCText.trim() }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setConsultationNotes(prev => prev.map(n => n.id === editingCNote.id ? json.note : n));
      setEditingCNote(null);
      setEditCText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to update note.");
    } finally {
      setSavingCNote(false);
    }
  }

  async function handleDeleteCNote(noteId: string) {
    Alert.alert("Delete Note", "Remove this note permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const res = await fetch(`${apiBase}/api/consultation-notes/${noteId}`, {
              method: "DELETE",
              headers: authHeaders(),
            });
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(errBody.error || `Request failed: ${res.status}`);
            }
            setConsultationNotes(prev => prev.filter(n => n.id !== noteId));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert("Error", "Failed to delete note.");
          }
        }
      },
    ]);
  }

  async function handleAddNote() {
    if (!newNote.trim() || !consultation?.patientEmail) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${apiBase}/api/patient-notes`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          patientEmail: consultation.patientEmail,
          note: newNote.trim(),
        }),
      });
      const json = await res.json();
      setPatientNotes(prev => [json.note, ...prev]);
      setNewNote("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingNote || !editText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${apiBase}/api/patient-notes/${editingNote.id}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editText.trim() }),
      });
      const json = await res.json();
      setPatientNotes(prev => prev.map(n => n.id === editingNote.id ? json.note : n));
      setEditingNote(null);
      setEditText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to update note.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    Alert.alert("Delete Note", "Remove this note permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await fetch(`${apiBase}/api/patient-notes/${noteId}`, {
              method: "DELETE",
              headers: authHeaders(),
            });
            setPatientNotes(prev => prev.filter(n => n.id !== noteId));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert("Error", "Failed to delete note.");
          }
        }
      },
    ]);
  }

  function openActionModal(action: "approve" | "more_info" | "refer" | "reject") {
    if (action === "approve") {
      if (prescriptionItems.length === 0) {
        Alert.alert("Prescription required", "Add at least one medication before approving.");
        return;
      }
      const incomplete = prescriptionItems.find(it => !it.name.trim() || !it.strength.trim() || !it.sig.trim());
      if (incomplete) {
        Alert.alert("Incomplete prescription", "Each medication needs a name, strength and dosage instructions.");
        return;
      }
    }
    Haptics.selectionAsync();
    setActionModal(action);
  }

  function submitAction(action: "approve" | "more_info" | "refer" | "reject") {
    const data: any = { action };
    if (action === "approve") {
      data.pharmacistNote = note.trim() || undefined;
      data.prescriptionItems = prescriptionItems;
      data.prescription = formatPrescriptionItems(prescriptionItems) || prescription.trim() || undefined;
    } else if (action === "more_info") {
      if (!moreInfoMessage.trim()) {
        Alert.alert("Required", "Please write a message for the patient.");
        return;
      }
      data.pharmacistNote = moreInfoMessage.trim();
    } else if (action === "refer") {
      if (!referRecipientName.trim()) {
        Alert.alert("Required", "Please enter the recipient name.");
        return;
      }
      data.referRecipientType = referRecipientType;
      data.referRecipientName = referRecipientName.trim();
      data.referUrgency = referUrgency;
      data.pharmacistNote = referMessage.trim() || undefined;
      data.referralInfo = referral.trim() || undefined;
    } else if (action === "reject") {
      if (!rejectReason || !rejectExplanation.trim()) {
        Alert.alert("Required", "Please choose a reason and provide an explanation.");
        return;
      }
      data.rejectReason = rejectReason;
      data.pharmacistNote = rejectExplanation.trim();
    }
    setSubmitting(true);
    reviewMutation.mutate({ id: id ?? "", data });
  }

  // Backwards compat: existing call-sites use handleReview
  function handleReview(action: "approve" | "more_info" | "refer" | "reject") {
    openActionModal(action);
  }

  const styles = makeStyles(colors);

  if (isLoading || !consultation) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading consultation...</Text>
      </View>
    );
  }

  const isAlreadyReviewed = consultation.status !== "pending" && consultation.status !== "red_flag";
  const answers = consultation.answers as Record<string, string>;
  const createdDate = new Date(consultation.createdAt);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {consultation.hasRedFlag && (
        <View style={styles.redFlagBanner}>
          <Feather name="alert-triangle" size={16} color="#fff" />
          <Text style={styles.redFlagText}>  URGENT — Red Flag Identified — Review Immediately</Text>
        </View>
      )}

      {/* Back bar */}
      <View style={styles.backBar}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          hitSlop={12}
          testID="btn-back"
        >
          <Feather name="chevron-left" size={22} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
        </Pressable>
        <Text style={styles.backBarTitle} numberOfLines={1}>
          Consultation · {consultation.id.slice(0, 8).toUpperCase()}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Patient header */}
      <View style={styles.patientHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {consultation.patientName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientHeaderName}>{consultation.patientName}</Text>
          <Text style={styles.patientHeaderEmail}>{consultation.patientEmail}</Text>
          <Text style={styles.patientHeaderMeta}>{consultation.patientAge} yrs · {consultation.patientSex}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: (STATUS_COLORS[consultation.status] ?? "#888") + "22" }]}>
          <Text style={[styles.statusChipText, { color: STATUS_COLORS[consultation.status] ?? "#888" }]}>
            {STATUS_LABELS[consultation.status] ?? consultation.status}
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {/* Overview tab */}
      {activeTab === "Overview" && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consultation</Text>
            <View style={styles.infoCard}>
              <InfoRow icon="activity" label="Condition" value={consultation.conditionName} colors={colors} />
              <InfoRow icon="calendar" label="Submitted" value={format(createdDate, "d MMM yyyy, HH:mm")} colors={colors} />
              {(() => {
                const photos: string[] = ((consultation as any).photoUrls ?? []).filter(Boolean);
                if (!consultation.hasPhoto && photos.length === 0) return null;
                return (
                  <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <Feather name="camera" size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600", marginLeft: 6 }}>
                        {photos.length} photo{photos.length === 1 ? "" : "s"} submitted
                      </Text>
                    </View>
                    {photos.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {photos.map((url, i) => (
                          <Pressable
                            key={i}
                            onPress={() => { Haptics.selectionAsync(); setLightboxPhotoUrl(url); }}
                          >
                            <Image
                              source={{ uri: url }}
                              style={{ width: 110, height: 110, borderRadius: 12, backgroundColor: colors.muted }}
                            />
                          </Pressable>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                );
              })()}
            </View>
          </View>

          {/* GPhC Compliance */}
          {(() => {
            const c: any = consultation;
            const flags: string[] = Array.isArray(c.riskFlags) ? c.riskFlags : [];
            const cat = c.riskCategory || "standard";
            const catColor = cat === "high" ? colors.destructive : cat === "medium" ? "#D97706" : colors.success;
            return (
              <View style={styles.section}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>GPhC Compliance</Text>
                  <View style={{ backgroundColor: catColor + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: catColor, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {cat} risk
                    </Text>
                  </View>
                </View>

                {flags.length > 0 ? (
                  <View style={[styles.infoCard, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Feather name="alert-triangle" size={14} color={colors.destructive} />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.destructive, marginLeft: 6, textTransform: "uppercase" }}>
                        Auto-detected flags ({flags.length})
                      </Text>
                    </View>
                    {flags.map((f) => (
                      <Text key={f} style={{ fontSize: 13, color: "#991B1B", marginTop: 2 }}>
                        • {f.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.infoCard, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0", borderWidth: 1, flexDirection: "row", alignItems: "center" }]}>
                    <Feather name="check-circle" size={14} color={colors.success} />
                    <Text style={{ fontSize: 13, color: "#065F46", marginLeft: 8 }}>No automated flags detected</Text>
                  </View>
                )}

                <View style={[styles.infoCard, { marginTop: 8 }]}>
                  <InfoRow icon="shield" label="Identity" value={c.identityVerificationMethod || "Photo ID on file"} colors={colors} />
                  {c.identityVerificationRef && (
                    <InfoRow icon="hash" label="ID Ref" value={c.identityVerificationRef} colors={colors} />
                  )}
                  <InfoRow
                    icon="check-square"
                    label="Consents"
                    value={[
                      c.consentDataProcessing && "Data processing",
                      c.consentToTreatment && "Treatment",
                      c.consentToDelivery && "Delivery",
                      c.consentShareWithGp && "Share with GP",
                    ].filter(Boolean).join(", ") || "None recorded"}
                    colors={colors}
                  />
                </View>
              </View>
            );
          })()}

          {/* Patient submitted information — show ALL fields */}
          {(() => {
            const c: any = consultation;
            const has = (v: any) => v !== null && v !== undefined && String(v).trim() !== "";
            const hasGp = has(c.gpName) || has(c.gpSurgery) || has(c.gpAddress) || has(c.gpPhone) || c.hasRegularGp != null;
            const hasMed = has(c.allergies) || has(c.currentMedications) || has(c.medicalHistory) || c.isPregnant != null;
            const hasBody = has(c.bmi) || has(c.weightKg) || has(c.heightCm) || has(c.verifiedHeightCm) || has(c.verifiedWeightKg);
            const hasDelivery = has(c.deliveryAddress) || has(c.deliveryAddressLine1) || has(c.deliveryCity) || has(c.deliveryPostcode) || has(c.preferredDeliveryMethod);
            return (
              <>
                {/* GP / Regular Prescriber */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>GP / Regular Prescriber</Text>
                  <View style={styles.infoCard}>
                    <InfoRow
                      icon="user"
                      label="Has regular GP"
                      value={c.hasRegularGp == null ? "Not asked" : c.hasRegularGp ? "Yes" : "No"}
                      colors={colors}
                    />
                    <InfoRow icon="user" label="GP name" value={has(c.gpName) ? c.gpName : "—"} colors={colors} />
                    <InfoRow icon="briefcase" label="Surgery" value={has(c.gpSurgery) ? c.gpSurgery : "—"} colors={colors} />
                    <InfoRow icon="map-pin" label="Surgery address" value={has(c.gpAddress) ? c.gpAddress : "—"} colors={colors} />
                    <InfoRow icon="phone" label="Surgery phone" value={has(c.gpPhone) ? c.gpPhone : "—"} colors={colors} />
                    <InfoRow
                      icon="share-2"
                      label="Consent to share"
                      value={c.consentShareWithGp ? "Yes — patient agreed to share with GP" : "No"}
                      colors={colors}
                    />
                  </View>
                  {!hasGp && (
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 6, fontStyle: "italic" }}>
                      Patient didn't supply GP details for this consultation.
                    </Text>
                  )}
                </View>

                {/* Medical Background */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Medical Background</Text>
                  <View style={styles.infoCard}>
                    <InfoRow
                      icon="alert-circle"
                      label="Allergies"
                      value={has(c.allergies) ? c.allergies : "None reported"}
                      colors={colors}
                    />
                    <InfoRow
                      icon="package"
                      label="Current medications"
                      value={has(c.currentMedications) ? c.currentMedications : "None reported"}
                      colors={colors}
                    />
                    <InfoRow
                      icon="file-text"
                      label="Medical history"
                      value={has(c.medicalHistory) ? c.medicalHistory : "None reported"}
                      colors={colors}
                    />
                    {consultation.patientSex === "female" && (
                      <InfoRow
                        icon="heart"
                        label="Pregnancy status"
                        value={c.isPregnant === true ? "Pregnant" : c.isPregnant === false ? "Not pregnant" : "Not asked"}
                        colors={colors}
                      />
                    )}
                  </View>
                </View>

                {/* Body Measurements */}
                {hasBody && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Body Measurements</Text>
                    <View style={styles.infoCard}>
                      {has(c.heightCm) && <InfoRow icon="trending-up" label="Height (self)" value={`${c.heightCm} cm`} colors={colors} />}
                      {has(c.weightKg) && <InfoRow icon="bar-chart" label="Weight (self)" value={`${c.weightKg} kg`} colors={colors} />}
                      {has(c.verifiedHeightCm) && <InfoRow icon="check" label="Height (verified)" value={`${c.verifiedHeightCm} cm`} colors={colors} />}
                      {has(c.verifiedWeightKg) && <InfoRow icon="check" label="Weight (verified)" value={`${c.verifiedWeightKg} kg`} colors={colors} />}
                      {has(c.bmi) && (
                        <InfoRow
                          icon="activity"
                          label="BMI"
                          value={`${Number(c.bmi).toFixed(1)}`}
                          colors={colors}
                        />
                      )}
                    </View>
                  </View>
                )}

                {/* Delivery */}
                {hasDelivery && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery</Text>
                    <View style={styles.infoCard}>
                      <InfoRow
                        icon="map-pin"
                        label="Address"
                        value={
                          has(c.deliveryAddress)
                            ? c.deliveryAddress
                            : [c.deliveryAddressLine1, c.deliveryAddressLine2, c.deliveryCity, c.deliveryPostcode]
                                .filter(Boolean)
                                .join(", ") || "—"
                        }
                        colors={colors}
                      />
                      <InfoRow
                        icon="truck"
                        label="Method"
                        value={has(c.preferredDeliveryMethod) ? c.preferredDeliveryMethod : "Royal Mail Tracked (default)"}
                        colors={colors}
                      />
                    </View>
                  </View>
                )}
              </>
            );
          })()}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Questionnaire Answers</Text>
            {Object.entries(answers).map(([key, val]) => (
              <View key={key} style={styles.qaCard}>
                <Text style={styles.qaQuestion}>{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^\s/, "")}</Text>
                <Text style={styles.qaAnswer}>{val || "No answer provided"}</Text>
              </View>
            ))}
          </View>

          {!isAlreadyReviewed && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pharmacist Notes</Text>
                <TextInput
                  style={styles.textarea}
                  placeholder="Add clinical notes (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  testID="input-pharmacist-note"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Prescription</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 10, lineHeight: 16 }}>
                  Search the UK formulary, set strength, quantity and dosage. We'll auto-create the order and start tracked delivery on approval.
                </Text>
                <PrescriptionBuilder items={prescriptionItems} onChange={setPrescriptionItems} />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Referral Info (if referring)</Text>
                <TextInput
                  style={styles.textarea}
                  placeholder="Referral details or GP instructions"
                  placeholderTextColor={colors.mutedForeground}
                  value={referral}
                  onChangeText={setReferral}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  testID="input-referral"
                />
              </View>

              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Clinical Decision</Text>
                <View style={styles.actionsGrid}>
                  <ActionButton icon="check-circle" label="Approve" color={colors.success} onPress={() => handleReview("approve")} disabled={submitting} />
                  <ActionButton icon="message-circle" label="More Info" color="#2563EB" onPress={() => handleReview("more_info")} disabled={submitting} />
                  <ActionButton icon="external-link" label="Refer" color="#7C3AED" onPress={() => handleReview("refer")} disabled={submitting} />
                  <ActionButton icon="x-circle" label="Reject" color={colors.destructive} onPress={() => handleReview("reject")} disabled={submitting} outline />
                </View>
              </View>
            </>
          )}

          {isAlreadyReviewed && (
            <View style={styles.section}>
              <View style={styles.reviewedBanner}>
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text style={styles.reviewedText}>  This consultation has been reviewed</Text>
              </View>
              {consultation.pharmacistNote && (
                <>
                  <Text style={styles.sectionTitle}>Clinical Notes</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.noteText}>{consultation.pharmacistNote}</Text>
                  </View>
                </>
              )}
              {consultation.prescription && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Prescription</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.noteText}>{consultation.prescription}</Text>
                  </View>
                </>
              )}
              {consultation.referralInfo && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Referral</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.noteText}>{consultation.referralInfo}</Text>
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* History tab */}
      {activeTab === "History" && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          onLayout={() => {
            if (!patientHistory.length && !historyLoading) {
              loadHistory(consultation.patientEmail);
            }
          }}
        >
          <Text style={styles.sectionTitle}>All consultations for {consultation.patientEmail}</Text>
          {historyLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
          {!historyLoading && patientHistory.length === 0 && (
            <View style={styles.emptyWrap}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>No history yet</Text>
            </View>
          )}
          {!historyLoading && patientHistory.map((c, i) => {
            const isCurrent = c.id === id;
            const statusColor = STATUS_COLORS[c.status] ?? "#888";
            return (
              <View key={c.id} style={[styles.timelineItem, isCurrent && { borderColor: colors.primary, borderWidth: 2 }]}>
                <View style={styles.timelineDot}>
                  <View style={[styles.timelineDotInner, { backgroundColor: statusColor }]} />
                  {i < patientHistory.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={[styles.timelineCondition, isCurrent && { color: colors.primary }]}>{c.conditionName}</Text>
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.primary + "22" }]}>
                        <Text style={{ fontSize: 9, color: colors.primary, fontWeight: "700" }}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <View style={[styles.timelineStatusBadge, { backgroundColor: statusColor + "22" }]}>
                      <Text style={{ fontSize: 10, color: statusColor, fontWeight: "700" }}>{STATUS_LABELS[c.status] ?? c.status}</Text>
                    </View>
                    <Text style={styles.timelineDate}>{format(new Date(c.createdAt), "d MMM yyyy")}</Text>
                  </View>
                  {c.prescription && (
                    <Text style={styles.timelinePrescription} numberOfLines={1}>Rx: {c.prescription}</Text>
                  )}
                  {c.pharmacistNote && (
                    <Text style={styles.timelineNote} numberOfLines={1}>Note: {c.pharmacistNote}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Notes tab */}
      {activeTab === "Notes" && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 240 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Consultation notes (this consultation only) ── */}
            <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>This consultation</Text>
              <View style={{ backgroundColor: colors.primary + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "700", letterSpacing: 0.5 }}>EPISODE</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 12 }}>
              Notes for this consultation only. Use for follow-ups and observations specific to this episode.
            </Text>
            <View style={[styles.addNoteInline, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addNoteInputInline, { color: colors.foreground }]}
                placeholder="Add a note for this consultation…"
                placeholderTextColor={colors.mutedForeground}
                value={newCNote}
                onChangeText={setNewCNote}
                multiline
              />
              <Pressable
                onPress={handleAddCNote}
                disabled={savingCNote || !newCNote.trim()}
                style={[styles.addNoteBtnInline, { backgroundColor: colors.primary }, (!newCNote.trim() || savingCNote) && { opacity: 0.5 }]}
              >
                {savingCNote ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="plus" size={16} color="#fff" />}
              </Pressable>
            </View>
            {cNotesLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
            {!cNotesLoading && consultationNotes.length === 0 && (
              <View style={[styles.emptyWrapInline, { borderColor: colors.border }]}>
                <Text style={[styles.emptySubtitle, { textAlign: "center" }]}>No consultation notes yet</Text>
              </View>
            )}
            {!cNotesLoading && consultationNotes.map(n => {
              const isOwn = n.createdBy === pharmacistName;
              return (
                <View key={n.id} style={styles.noteCard}>
                  <View style={styles.noteCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noteCardAuthor}>{n.updatedBy ? `${n.updatedBy} (edited)` : n.createdBy}</Text>
                      <Text style={styles.noteCardDate}>{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</Text>
                    </View>
                    {isOwn && (
                      <>
                        <Pressable onPress={() => { setEditingCNote(n); setEditCText(n.note); }} style={styles.noteAction}>
                          <Feather name="edit-2" size={14} color={colors.primary} />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteCNote(n.id)} style={[styles.noteAction, { marginLeft: 4 }]}>
                          <Feather name="trash-2" size={14} color={colors.destructive} />
                        </Pressable>
                      </>
                    )}
                  </View>
                  <Text style={styles.noteCardText}>{n.note}</Text>
                </View>
              );
            })}

            {/* ── Patient notes (across all consultations) ── */}
            <View style={{ height: 24 }} />
            <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>Patient profile</Text>
              <View style={{ backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "700", letterSpacing: 0.5 }}>ACROSS ALL VISITS</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 12 }}>
              Notes about this patient across all their consultations. Visible to every prescriber.
            </Text>
            <View style={[styles.addNoteInline, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addNoteInputInline, { color: colors.foreground }]}
                placeholder="Add a note about this patient…"
                placeholderTextColor={colors.mutedForeground}
                value={newNote}
                onChangeText={setNewNote}
                multiline
              />
              <Pressable
                onPress={handleAddNote}
                disabled={savingNote || !newNote.trim()}
                style={[styles.addNoteBtnInline, { backgroundColor: colors.primary }, (!newNote.trim() || savingNote) && { opacity: 0.5 }]}
              >
                {savingNote ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="plus" size={16} color="#fff" />}
              </Pressable>
            </View>
            {notesLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
            {!notesLoading && patientNotes.length === 0 && (
              <View style={[styles.emptyWrapInline, { borderColor: colors.border }]}>
                <Text style={[styles.emptySubtitle, { textAlign: "center" }]}>No patient notes yet</Text>
              </View>
            )}
            {!notesLoading && patientNotes.map(n => (
              <View key={n.id} style={styles.noteCard}>
                <View style={styles.noteCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteCardAuthor}>{n.updatedBy ? `${n.updatedBy} (edited)` : n.createdBy}</Text>
                    <Text style={styles.noteCardDate}>{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</Text>
                  </View>
                  {n.createdBy === pharmacistName && (
                    <>
                      <Pressable onPress={() => { setEditingNote(n); setEditText(n.note); }} style={styles.noteAction}>
                        <Feather name="edit-2" size={14} color={colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteNote(n.id)} style={[styles.noteAction, { marginLeft: 4 }]}>
                        <Feather name="trash-2" size={14} color={colors.destructive} />
                      </Pressable>
                    </>
                  )}
                </View>
                <Text style={styles.noteCardText}>{n.note}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Structured action modals */}
      <Modal visible={actionModal === "more_info"} transparent animationType="slide" onRequestClose={() => setActionModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActionModal(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, maxHeight: "85%" }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Feather name="message-circle" size={20} color="#2563EB" />
                <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Request More Information</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 14 }}>
                Send a message to {consultation.patientName}. They'll be notified and can reply directly.
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>QUICK ASKS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {[
                  "Please upload a clearer photo of the affected area.",
                  "Could you confirm your current medications?",
                  "What's your usual blood pressure?",
                  "Have you tried OTC remedies already?",
                ].map(t => (
                  <Pressable
                    key={t}
                    onPress={() => setMoreInfoMessage(prev => prev ? `${prev}\n${t}` : t)}
                    style={{ backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#BFDBFE" }}
                  >
                    <Text style={{ fontSize: 11, color: "#1E3A8A", fontWeight: "600" }}>+ {t.length > 35 ? t.slice(0, 35) + "…" : t}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[styles.textarea, { marginBottom: 14, minHeight: 110 }]}
                placeholder="What additional information do you need?"
                placeholderTextColor={colors.mutedForeground}
                value={moreInfoMessage}
                onChangeText={setMoreInfoMessage}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={[styles.modalBtn, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setActionModal(null)}>
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: "#2563EB", flex: 2 }]}
                  onPress={() => submitAction("more_info")}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Send & Pause for Reply</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={actionModal === "refer"} transparent animationType="slide" onRequestClose={() => setActionModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActionModal(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, maxHeight: "90%" }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Feather name="external-link" size={20} color="#7C3AED" />
                <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Refer for Further Care</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 14 }}>
                Refer {consultation.patientName} to another healthcare professional.
              </Text>

              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>REFER TO</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {[
                  { v: "gp", l: "GP" },
                  { v: "hospital_specialist", l: "Specialist" },
                  { v: "ae", l: "A&E" },
                  { v: "nhs_111", l: "NHS 111" },
                  { v: "sexual_health_clinic", l: "Sexual health" },
                  { v: "mental_health", l: "Mental health" },
                  { v: "other", l: "Other" },
                ].map(o => (
                  <Pressable
                    key={o.v}
                    onPress={() => setReferRecipientType(o.v)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: referRecipientType === o.v ? "#7C3AED" : colors.border,
                      backgroundColor: referRecipientType === o.v ? "#F3E8FF" : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: referRecipientType === o.v ? "#6D28D9" : colors.foreground, fontWeight: "600" }}>{o.l}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>RECIPIENT NAME / CLINIC</Text>
              <TextInput
                style={[styles.textarea, { minHeight: 44, marginBottom: 12 }]}
                placeholder="e.g. Dr Patel, Hilltop Surgery"
                placeholderTextColor={colors.mutedForeground}
                value={referRecipientName}
                onChangeText={setReferRecipientName}
              />

              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>URGENCY</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {[
                  { v: "routine", l: "Routine" },
                  { v: "soon", l: "Within 7 days" },
                  { v: "urgent", l: "Urgent (24h)" },
                  { v: "emergency", l: "Emergency 999" },
                ].map(o => (
                  <Pressable
                    key={o.v}
                    onPress={() => setReferUrgency(o.v)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: referUrgency === o.v ? (o.v === "emergency" ? "#DC2626" : "#7C3AED") : colors.border,
                      backgroundColor: referUrgency === o.v ? (o.v === "emergency" ? "#FEE2E2" : "#F3E8FF") : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: referUrgency === o.v ? (o.v === "emergency" ? "#991B1B" : "#6D28D9") : colors.foreground, fontWeight: "600" }}>{o.l}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>NOTE TO PATIENT</Text>
              <TextInput
                style={[styles.textarea, { marginBottom: 14, minHeight: 90 }]}
                placeholder="Explain why you're referring and what to do next."
                placeholderTextColor={colors.mutedForeground}
                value={referMessage}
                onChangeText={setReferMessage}
                multiline
                textAlignVertical="top"
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={[styles.modalBtn, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setActionModal(null)}>
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: "#7C3AED", flex: 2 }]}
                  onPress={() => submitAction("refer")}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Confirm Referral</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={actionModal === "reject"} transparent animationType="slide" onRequestClose={() => setActionModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActionModal(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, maxHeight: "90%" }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Feather name="x-circle" size={20} color={colors.destructive} />
                <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Reject Consultation</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 14 }}>
                Choose a reason and explain to the patient. They'll be notified and can reply.
              </Text>

              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>REASON</Text>
              <View style={{ gap: 6, marginBottom: 14 }}>
                {[
                  { v: "medically_unsuitable", l: "Medically unsuitable for this treatment" },
                  { v: "outside_our_scope", l: "Outside the scope of our online service" },
                  { v: "insufficient_information", l: "Insufficient information provided" },
                  { v: "already_prescribed", l: "Already prescribed elsewhere" },
                  { v: "other", l: "Other reason" },
                ].map(o => (
                  <Pressable
                    key={o.v}
                    onPress={() => setRejectReason(o.v)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 10,
                      padding: 12, borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: rejectReason === o.v ? "#DC2626" : colors.border,
                      backgroundColor: rejectReason === o.v ? "#FEE2E2" : "transparent",
                    }}
                  >
                    <View style={{
                      width: 16, height: 16, borderRadius: 8,
                      borderWidth: 2,
                      borderColor: rejectReason === o.v ? "#DC2626" : colors.border,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {rejectReason === o.v && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#DC2626" }} />}
                    </View>
                    <Text style={{ fontSize: 13, color: rejectReason === o.v ? "#991B1B" : colors.foreground, fontWeight: "600", flex: 1 }}>{o.l}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>EXPLANATION TO PATIENT</Text>
              <TextInput
                style={[styles.textarea, { marginBottom: 14, minHeight: 110 }]}
                placeholder="Be clear and supportive. Explain why and what to do next."
                placeholderTextColor={colors.mutedForeground}
                value={rejectExplanation}
                onChangeText={setRejectExplanation}
                multiline
                textAlignVertical="top"
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable style={[styles.modalBtn, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setActionModal(null)}>
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: colors.destructive, flex: 2 }]}
                  onPress={() => submitAction("reject")}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Confirm Rejection</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={actionModal === "approve"} transparent animationType="fade" onRequestClose={() => setActionModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActionModal(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Feather name="check-circle" size={20} color={colors.success} />
              <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Confirm Approval</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 14 }}>
              Issue the prescription below and notify {consultation.patientName}.
            </Text>
            <View style={{ backgroundColor: colors.muted, padding: 12, borderRadius: 10, marginBottom: 16, maxHeight: 220 }}>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: "700", marginBottom: 6 }}>PRESCRIPTION ({prescriptionItems.length} item{prescriptionItems.length === 1 ? "" : "s"})</Text>
              <ScrollView>
                {prescriptionItems.map((it, i) => (
                  <View key={i} style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
                      {i + 1}. {it.name}{it.strength ? ` ${it.strength}` : ""}{it.form ? ` ${it.form}` : ""}
                    </Text>
                    {!!it.sig && <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 1 }}>{it.sig}</Text>}
                    {(it.quantity || it.duration) && (
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
                        {it.quantity && `Qty: ${it.quantity}`}{it.quantity && it.duration ? " · " : ""}{it.duration && `Duration: ${it.duration}`}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
              <Text style={{ fontSize: 11, color: colors.success, marginTop: 6, fontWeight: "700" }}>✓ Order + tracked delivery will be created automatically.</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setActionModal(null)}>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.success, flex: 2 }]} onPress={() => submitAction("approve")}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Approve & Prescribe</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Decision success modal */}
      <Modal visible={!!successInfo} transparent animationType="fade" onRequestClose={() => { setSuccessInfo(null); router.back(); }}>
        <Pressable style={styles.modalOverlay} onPress={() => { setSuccessInfo(null); router.back(); }}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, alignItems: "center" }]} onPress={() => {}}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Feather name="check" size={32} color="#16A34A" />
            </View>
            <Text style={[styles.modalTitle, { textAlign: "center", marginBottom: 6 }]}>
              {successInfo?.action === "approve" ? "Prescription Issued" :
               successInfo?.action === "reject" ? "Decision Recorded" :
               successInfo?.action === "refer" ? "Patient Referred" :
               "Message Sent"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "center", marginBottom: 18, lineHeight: 19 }}>
              {successInfo?.action === "approve" ? `${successInfo?.patientName} has been notified and the PDF prescription is ready to view.` :
               successInfo?.action === "reject" ? `${successInfo?.patientName} has been notified with your reason and explanation.` :
               successInfo?.action === "refer" ? `${successInfo?.patientName} has been notified and given the referral details.` :
               `${successInfo?.patientName} will see your message in their consultation thread.`}
            </Text>
            <View style={{ flexDirection: "column", gap: 10, width: "100%" }}>
              {successInfo?.pdfUrl && (
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: colors.success }]}
                  onPress={() => { if (successInfo.pdfUrl) openPrescriptionPdf(successInfo.pdfUrl); }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Feather name="file-text" size={16} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "700" }}>View Prescription PDF</Text>
                  </View>
                </Pressable>
              )}
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
                onPress={() => { setSuccessInfo(null); router.back(); }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Photo lightbox modal */}
      <Modal visible={!!lightboxPhotoUrl} transparent animationType="fade" onRequestClose={() => setLightboxPhotoUrl(null)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.92)" }]} onPress={() => setLightboxPhotoUrl(null)}>
          {lightboxPhotoUrl && (
            <Image source={{ uri: lightboxPhotoUrl }} style={{ width: "100%", height: "85%", resizeMode: "contain" }} />
          )}
          <View style={{ position: "absolute", top: insets.top + 12, right: 16, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 22, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Feather name="x" size={22} color="#fff" />
          </View>
        </Pressable>
      </Modal>

      {/* Edit consultation note modal */}
      <Modal visible={!!editingCNote} transparent animationType="fade" onRequestClose={() => setEditingCNote(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingCNote(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit Consultation Note</Text>
            <TextInput
              style={[styles.textarea, { marginBottom: 16 }]}
              value={editCText}
              onChangeText={setEditCText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setEditingCNote(null)}>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleSaveCEdit} disabled={savingCNote}>
                {savingCNote
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                }
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit note modal */}
      <Modal visible={!!editingNote} transparent animationType="fade" onRequestClose={() => setEditingNote(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingNote(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit Note</Text>
            <TextInput
              style={[styles.textarea, { marginBottom: 16 }]}
              value={editText}
              onChangeText={setEditText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setEditingNote(null)}>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleSaveEdit} disabled={savingNote}>
                {savingNote
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                }
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.submittingText}>Submitting review...</Text>
        </View>
      )}
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
      <Feather name={icon as any} size={14} color={colors.mutedForeground} />
      <Text style={{ fontSize: 13, color: colors.mutedForeground, marginLeft: 8, width: 70 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600" as const, flex: 1 }}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, color, onPress, disabled, outline }: {
  icon: string; label: string; color: string; onPress: () => void; disabled?: boolean; outline?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [{
        flex: 1, minWidth: "47%", borderRadius: 14, paddingVertical: 14,
        alignItems: "center", justifyContent: "center",
        borderWidth: outline ? 2 : 0, borderColor: outline ? color : "transparent",
        backgroundColor: outline ? "transparent" : color,
        opacity: pressed || disabled ? 0.7 : 1, gap: 6,
      }]}
      onPress={onPress}
      disabled={disabled}
      testID={`btn-${label.toLowerCase().replace(" ", "-")}`}
    >
      <Feather name={icon as any} size={20} color={outline ? color : "#fff"} />
      <Text style={{ color: outline ? color : "#fff", fontWeight: "700" as const, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14 },
    redFlagBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#EF4444", paddingHorizontal: 16, paddingVertical: 10 },
    redFlagText: { color: "#fff", fontWeight: "700" as const, fontSize: 13 },
    backBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 6,
      paddingVertical: 6,
      borderRadius: 10,
    },
    backButtonText: { fontSize: 15, fontWeight: "600" },
    backBarTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
      flex: 1,
      textAlign: "center",
    },
    patientHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    avatarLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    avatarLargeText: { color: "#fff", fontWeight: "800" as const, fontSize: 18 },
    patientHeaderName: { fontSize: 16, fontWeight: "700" as const, color: colors.foreground },
    patientHeaderEmail: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
    patientHeaderMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
    statusChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    statusChipText: { fontSize: 11, fontWeight: "700" as const },
    tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabItemActive: { borderBottomColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: "600" as const, color: colors.mutedForeground },
    tabTextActive: { color: colors.primary },
    scrollContent: { paddingTop: 16, paddingHorizontal: 16, gap: 0 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: "700" as const, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
    infoCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    qaCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    qaQuestion: { fontSize: 12, fontWeight: "600" as const, color: colors.mutedForeground, marginBottom: 4, textTransform: "capitalize" },
    qaAnswer: { fontSize: 15, color: colors.foreground },
    textarea: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 15, color: colors.foreground, minHeight: 90 },
    actionsSection: { marginBottom: 20 },
    actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    reviewedBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#86EFAC" },
    reviewedText: { fontSize: 14, color: colors.success, fontWeight: "600" as const },
    noteText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
    submittingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
    submittingText: { color: "#fff", marginTop: 12, fontSize: 14 },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
    emptyTitle: { fontSize: 16, fontWeight: "700" as const, color: colors.secondary, marginTop: 4 },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
    timelineItem: { flexDirection: "row", marginBottom: 4, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "visible" },
    timelineDot: { width: 32, alignItems: "center", paddingTop: 18 },
    timelineDotInner: { width: 12, height: 12, borderRadius: 6 },
    timelineLine: { width: 2, flex: 1, marginTop: 4 },
    timelineContent: { flex: 1, padding: 14 },
    timelineCondition: { fontSize: 15, fontWeight: "700" as const, color: colors.foreground },
    timelineStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    timelineDate: { fontSize: 11, color: colors.mutedForeground },
    timelinePrescription: { fontSize: 12, color: colors.success, marginTop: 6, fontStyle: "italic" },
    timelineNote: { fontSize: 12, color: colors.mutedForeground, marginTop: 4, fontStyle: "italic" },
    currentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    noteCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    noteCardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
    noteCardAuthor: { fontSize: 12, fontWeight: "700" as const, color: colors.primary },
    noteCardDate: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
    noteCardText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
    noteAction: { padding: 6 },
    addNoteBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "flex-end" },
    addNoteInput: { flex: 1, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 14, color: colors.foreground, minHeight: 48, maxHeight: 90 },
    addNoteBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    addNoteInline: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: "flex-end", marginBottom: 12 },
    addNoteInputInline: { flex: 1, fontSize: 14, minHeight: 36, maxHeight: 100, padding: 6 },
    addNoteBtnInline: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    emptyWrapInline: { padding: 18, borderRadius: 12, borderStyle: "dashed", borderWidth: 1, marginBottom: 8 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
    modalCard: { width: "100%", borderRadius: 20, padding: 20, maxWidth: 480 },
    modalTitle: { fontSize: 17, fontWeight: "700" as const, color: colors.foreground, marginBottom: 14 },
    modalBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  });
}

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { currentToken } from "@/context/AuthContext";

function authHeaders(extra?: Record<string, string>): Record<string, string> {
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
  const [referral, setReferral] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [patientHistory, setPatientHistory] = useState<PatientConsultation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [editText, setEditText] = useState("");

  const { data: consultation, isLoading } = useGetConsultation(id ?? "", {
    query: { enabled: !!id, queryKey: getGetConsultationQueryKey(id ?? "") },
  });

  const reviewMutation = useReviewConsultation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConsultationQueryKey(id ?? "") });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Failed to submit review. Please try again.");
        setSubmitting(false);
      },
    },
  });

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

  useEffect(() => {
    if (consultation?.patientEmail && activeTab === "History") {
      loadHistory(consultation.patientEmail);
    }
    if (consultation?.patientEmail && activeTab === "Notes") {
      loadNotes(consultation.patientEmail);
    }
  }, [activeTab, consultation?.patientEmail]);

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

  function handleReview(action: typeof ConsultationReviewInputAction[keyof typeof ConsultationReviewInputAction]) {
    if (action === "approve" && !prescription.trim()) {
      Alert.alert("Required", "Please enter prescription details before approving.");
      return;
    }
    const actionLabels: Record<string, string> = {
      approve: "Approve and prescribe",
      reject: "Reject this consultation",
      more_info: "Request more info",
      refer: "Refer to GP/specialist",
    };
    Alert.alert(
      actionLabels[action] ?? action,
      "Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: action === "reject" ? "destructive" : "default",
          onPress: () => {
            setSubmitting(true);
            reviewMutation.mutate({
              id: id ?? "",
              data: {
                action,
                pharmacistNote: note.trim() || undefined,
                prescription: prescription.trim() || undefined,
                referralInfo: referral.trim() || undefined,
              },
            });
          },
        },
      ]
    );
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
              {consultation.hasPhoto && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Feather name="camera" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600", marginLeft: 6 }}>Photo submitted</Text>
                </View>
              )}
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
                  <InfoRow icon="shield" label="Identity" value={c.identityVerificationMethod || "Photo ID"} colors={colors} />
                  <InfoRow icon="user" label="GP" value={c.gpName || "Not provided"} colors={colors} />
                  {c.gpSurgery && <InfoRow icon="briefcase" label="Surgery" value={c.gpSurgery} colors={colors} />}
                  {c.deliveryAddressLine1 && (
                    <InfoRow
                      icon="map-pin"
                      label="Delivery"
                      value={`${c.deliveryAddressLine1}, ${c.deliveryCity || ""} ${c.deliveryPostcode || ""}`.trim()}
                      colors={colors}
                    />
                  )}
                  {c.bmi && (
                    <InfoRow
                      icon="activity"
                      label="BMI"
                      value={`${Number(c.bmi).toFixed(1)} (${c.weightKg}kg / ${c.heightCm}cm)`}
                      colors={colors}
                    />
                  )}
                  <InfoRow
                    icon="check-square"
                    label="Consents"
                    value={[
                      c.consentDataProcessing && "Data",
                      c.consentToTreatment && "Treatment",
                      c.consentToDelivery && "Delivery",
                      c.consentShareWithGp && "Share-GP",
                    ].filter(Boolean).join(", ") || "None recorded"}
                    colors={colors}
                  />
                </View>
              </View>
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
                <Text style={styles.sectionTitle}>Prescription Details</Text>
                <TextInput
                  style={styles.textarea}
                  placeholder="e.g. Clotrimazole 1% cream — apply twice daily for 2 weeks"
                  placeholderTextColor={colors.mutedForeground}
                  value={prescription}
                  onChangeText={setPrescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  testID="input-prescription"
                />
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
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 160 }]}
            showsVerticalScrollIndicator={false}
            onLayout={() => {
              if (!patientNotes.length && !notesLoading) {
                loadNotes(consultation.patientEmail);
              }
            }}
          >
            <Text style={styles.sectionTitle}>Account notes — visible to all pharmacists</Text>
            {notesLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
            {!notesLoading && patientNotes.length === 0 && (
              <View style={styles.emptyWrap}>
                <Feather name="file-text" size={36} color={colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptySubtitle}>Add notes about this patient below</Text>
              </View>
            )}
            {!notesLoading && patientNotes.map(n => (
              <View key={n.id} style={styles.noteCard}>
                <View style={styles.noteCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteCardAuthor}>{n.updatedBy ? `${n.updatedBy} (edited)` : n.createdBy}</Text>
                    <Text style={styles.noteCardDate}>{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</Text>
                  </View>
                  <Pressable onPress={() => { setEditingNote(n); setEditText(n.note); }} style={styles.noteAction}>
                    <Feather name="edit-2" size={14} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteNote(n.id)} style={[styles.noteAction, { marginLeft: 4 }]}>
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                  </Pressable>
                </View>
                <Text style={styles.noteCardText}>{n.note}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Add note footer */}
          <View style={[styles.addNoteBar, { paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 12 }]}>
            <TextInput
              style={styles.addNoteInput}
              placeholder="Write a note about this patient..."
              placeholderTextColor={colors.mutedForeground}
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Pressable
              onPress={handleAddNote}
              disabled={savingNote || !newNote.trim()}
              style={[styles.addNoteBtn, (!newNote.trim() || savingNote) && { opacity: 0.5 }]}
            >
              {savingNote
                ? <ActivityIndicator size="small" color="#fff" />
                : <Feather name="send" size={18} color="#fff" />
              }
            </Pressable>
          </View>
        </View>
      )}

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
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
    modalCard: { width: "100%", borderRadius: 20, padding: 20, maxWidth: 480 },
    modalTitle: { fontSize: 17, fontWeight: "700" as const, color: colors.foreground, marginBottom: 14 },
    modalBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  });
}

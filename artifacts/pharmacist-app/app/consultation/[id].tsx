import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetConsultation, useReviewConsultation, getGetConsultationQueryKey, ConsultationReviewInputAction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  more_info_needed: "More Info Needed",
  referred: "Referred",
  red_flag: "Urgent",
};

export default function ConsultationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [prescription, setPrescription] = useState("");
  const [referral, setReferral] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
      {consultation.hasRedFlag && (
        <View style={styles.redFlagBanner}>
          <Feather name="alert-triangle" size={16} color="#fff" />
          <Text style={styles.redFlagText}>  URGENT — Red Flag Identified — Review Immediately</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, getStatusStyle(consultation.status, colors)]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(consultation.status, colors) }]}>
              {STATUS_LABELS[consultation.status] ?? consultation.status}
            </Text>
          </View>
          <Text style={styles.dateText}>{format(createdDate, "d MMM yyyy, HH:mm")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="user" label="Name" value={consultation.patientName} colors={colors} />
            <InfoRow icon="mail" label="Email" value={consultation.patientEmail} colors={colors} />
            <InfoRow icon="calendar" label="Age" value={`${consultation.patientAge} years`} colors={colors} />
            <InfoRow icon="users" label="Sex" value={consultation.patientSex} colors={colors} />
            {consultation.hasPhoto && (
              <View style={styles.photoRow}>
                <Feather name="camera" size={14} color={colors.primary} />
                <Text style={styles.photoText}>  Photo submitted with consultation</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition</Text>
          <View style={styles.infoCard}>
            <Text style={styles.conditionName}>{consultation.conditionName}</Text>
          </View>
        </View>

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
                <ActionButton icon="message-circle" label="More Info" color={colors.moreInfo} onPress={() => handleReview("more_info")} disabled={submitting} />
                <ActionButton icon="external-link" label="Refer" color={colors.referred} onPress={() => handleReview("refer")} disabled={submitting} />
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
          </View>
        )}
      </ScrollView>

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
      <Text style={{ fontSize: 13, color: colors.mutedForeground, marginLeft: 8, width: 50 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600" as const, flex: 1 }}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, color, onPress, disabled, outline }: {
  icon: string; label: string; color: string; onPress: () => void; disabled?: boolean; outline?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          flex: 1,
          minWidth: "47%",
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: outline ? 2 : 0,
          borderColor: outline ? color : "transparent",
          backgroundColor: outline ? "transparent" : color,
          opacity: pressed || disabled ? 0.7 : 1,
          gap: 6,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={`btn-${label.toLowerCase().replace(" ", "-")}`}
    >
      <Feather name={icon as any} size={20} color={outline ? color : "#fff"} />
      <Text style={{ color: outline ? color : "#fff", fontWeight: "700" as const, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function getStatusStyle(status: string, colors: ReturnType<typeof useColors>) {
  const bg: Record<string, string> = {
    pending: "#FFF7ED",
    approved: "#F0FDF4",
    rejected: "#F8FAFC",
    more_info_needed: "#EFF6FF",
    referred: "#F5F3FF",
    red_flag: "#FFF1F2",
  };
  return { backgroundColor: bg[status] ?? colors.muted };
}

function getStatusColor(status: string, colors: ReturnType<typeof useColors>) {
  const c: Record<string, string> = {
    pending: colors.warning,
    approved: colors.success,
    rejected: colors.mutedForeground,
    more_info_needed: colors.moreInfo,
    referred: colors.referred,
    red_flag: colors.urgent,
  };
  return c[status] ?? colors.foreground;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14 },
    redFlagBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EF4444",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    redFlagText: { color: "#fff", fontWeight: "700" as const, fontSize: 13 },
    scrollContent: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16, gap: 0 },
    statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    statusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    statusBadgeText: { fontWeight: "700" as const, fontSize: 13 },
    dateText: { fontSize: 12, color: colors.mutedForeground },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: "700" as const, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
    infoCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    conditionName: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary },
    photoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    photoText: { fontSize: 13, color: colors.primary, fontWeight: "600" as const },
    qaCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    qaQuestion: { fontSize: 12, fontWeight: "600" as const, color: colors.mutedForeground, marginBottom: 4, textTransform: "capitalize" },
    qaAnswer: { fontSize: 15, color: colors.foreground },
    textarea: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      fontSize: 15,
      color: colors.foreground,
      minHeight: 90,
    },
    actionsSection: { marginBottom: 20 },
    actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    reviewedBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F0FDF4",
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#86EFAC",
    },
    reviewedText: { fontSize: 14, color: colors.success, fontWeight: "600" as const },
    noteText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
    submittingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
    },
    submittingText: { color: "#fff", marginTop: 12, fontSize: 14 },
    moreInfo: "#2563EB",
    referred: "#7C3AED",
  });
}

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getCurrentToken } from "@/context/AuthContext";
import { format, formatDistanceToNow } from "date-fns";

function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:5000";
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const t = getCurrentToken();
  return { ...(extra ?? {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

function gbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

interface ProfileResponse {
  account: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  } | null;
  profile: {
    email: string;
    name: string | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    totalConsultations: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    moreInfoCount: number;
    referredCount: number;
    redFlagCount: number;
    totalOrders: number;
    totalSpendPence: number;
    topConditions: { name: string; count: number }[];
    registered: boolean;
  };
  consultations: {
    id: string;
    conditionName: string;
    status: string;
    createdAt: string;
    reviewedAt?: string | null;
    hasRedFlag: boolean;
    prescription?: string | null;
    pharmacistNote?: string | null;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    totalGbp: number;
    createdAt: string;
    items: { id: string; productName: string; quantity: number }[];
    delivery: {
      status: string;
      carrier: string | null;
      trackingNumber: string | null;
    } | null;
  }[];
  recentMessages: {
    id: string;
    consultationId: string;
    senderRole: string;
    senderName: string;
    body: string;
    createdAt: string;
  }[];
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pending", bg: "#FFF7ED", fg: "#D97706" },
  approved: { label: "Approved", bg: "#F0FDF4", fg: "#16A34A" },
  rejected: { label: "Rejected", bg: "#FEF2F2", fg: "#DC2626" },
  more_info_needed: { label: "More info", bg: "#EFF6FF", fg: "#2563EB" },
  referred: { label: "Referred", bg: "#FAF5FF", fg: "#7C3AED" },
  red_flag: { label: "URGENT", bg: "#FEF2F2", fg: "#DC2626" },
  cancelled: { label: "Cancelled", bg: "#F1F5F9", fg: "#64748B" },
};

const ORDER_STATUS_META: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  paid: { label: "Paid", bg: "#FFF7ED", fg: "#D97706" },
  paid_demo: { label: "Paid", bg: "#FFF7ED", fg: "#D97706" },
  preparing: { label: "Preparing", bg: "#ECFEFF", fg: "#0891B2" },
  shipped: { label: "Shipped", bg: "#EEF2FF", fg: "#4F46E5" },
  out_for_delivery: { label: "On the way", bg: "#FEF3C7", fg: "#D97706" },
  delivered: { label: "Delivered", bg: "#F0FDF4", fg: "#16A34A" },
  cancelled: { label: "Cancelled", bg: "#F1F5F9", fg: "#64748B" },
  pending: { label: "Pending", bg: "#FFF7ED", fg: "#D97706" },
};

type TabKey = "overview" | "consultations" | "orders" | "messages" | "notes";

interface PatientNote {
  id: string;
  patientEmail: string;
  note: string;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export default function PatientDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = useMemo(
    () => decodeURIComponent(params.email ?? ""),
    [params.email],
  );

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");
  const [emailModal, setEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  const fetchProfile = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(
        `${getApiBase()}/api/pharmacist/patients/${encodeURIComponent(email)}/profile`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ProfileResponse;
      setData(json);
    } catch (e) {
      console.warn("Failed to fetch patient profile", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

  const fetchNotes = useCallback(async () => {
    if (!email) return;
    setNotesLoading(true);
    try {
      const res = await fetch(
        `${getApiBase()}/api/patient-notes/${encodeURIComponent(email)}`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { notes: PatientNote[] };
      setNotes(json.notes ?? []);
    } catch (e) {
      console.warn("Failed to fetch patient notes", e);
    } finally {
      setNotesLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (tab === "notes") fetchNotes();
  }, [tab, fetchNotes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
    if (tab === "notes") fetchNotes();
  }, [fetchProfile, fetchNotes, tab]);

  const createNote = useCallback(async () => {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${getApiBase()}/api/patient-notes`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ patientEmail: email, note: noteDraft.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNoteDraft("");
      await fetchNotes();
    } catch (e) {
      Alert.alert("Error", "Could not save note.");
    } finally {
      setSavingNote(false);
    }
  }, [noteDraft, email, fetchNotes]);

  const saveEditNote = useCallback(async () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(
        `${getApiBase()}/api/patient-notes/${editingNoteId}`,
        {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ note: editingNoteText.trim() }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditingNoteId(null);
      setEditingNoteText("");
      await fetchNotes();
    } catch (e) {
      Alert.alert("Error", "Could not update note.");
    } finally {
      setSavingNote(false);
    }
  }, [editingNoteId, editingNoteText, fetchNotes]);

  const deleteNote = useCallback(
    (noteId: string) => {
      Alert.alert("Delete note", "Remove this clinical note permanently?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(
                `${getApiBase()}/api/patient-notes/${noteId}`,
                {
                  method: "DELETE",
                  headers: authHeaders(),
                },
              );
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              await fetchNotes();
            } catch {
              Alert.alert("Error", "Could not delete note.");
            }
          },
        },
      ]);
    },
    [fetchNotes],
  );

  const sendCustomEmail = useCallback(async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      Alert.alert("Missing fields", "Please enter both subject and message");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `${getApiBase()}/api/pharmacist/patients/${encodeURIComponent(email)}/email`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            subject: emailSubject,
            message: emailMessage,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Email sent",
        `Your message has been sent to ${data?.profile.name ?? email}.`,
      );
      setEmailModal(false);
      setEmailSubject("");
      setEmailMessage("");
      fetchProfile();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Send failed",
        e instanceof Error ? e.message : "Unable to send email.",
      );
    } finally {
      setSending(false);
    }
  }, [emailSubject, emailMessage, email, data, fetchProfile]);

  const callPatient = useCallback(() => {
    Linking.openURL(`mailto:${email}`);
  }, [email]);

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading patient…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
        <Text style={styles.loadingText}>Patient not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const initials = (data.profile.name ?? email)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: data.profile.name ?? "Patient",
          headerRight: () => (
            <Pressable
              onPress={() => setEmailModal(true)}
              hitSlop={12}
              style={{ padding: 6 }}
            >
              <Feather name="mail" size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroAvatar,
              {
                backgroundColor:
                  data.profile.redFlagCount > 0 ? "#EF4444" : colors.primary,
              },
            ]}
          >
            <Text style={styles.heroAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{data.profile.name ?? "Patient"}</Text>
          <Pressable onPress={callPatient} style={styles.heroEmail}>
            <Feather name="mail" size={12} color={colors.primary} />
            <Text style={styles.heroEmailText}>{email}</Text>
          </Pressable>
          {data.profile.firstSeenAt && (
            <Text style={styles.heroMeta}>
              Patient since{" "}
              {format(new Date(data.profile.firstSeenAt), "MMM yyyy")}
              {data.profile.registered ? " · Registered account" : " · Guest"}
            </Text>
          )}
          {data.profile.redFlagCount > 0 && (
            <View style={styles.warningChip}>
              <Feather name="alert-triangle" size={11} color="#DC2626" />
              <Text style={styles.warningChipText}>
                {data.profile.redFlagCount} red flag
                {data.profile.redFlagCount > 1 ? "s" : ""} on record
              </Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionPrimary,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setEmailModal(true);
            }}
          >
            <Feather name="send" size={14} color="#fff" />
            <Text style={styles.actionPrimaryText}>Email Patient</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionSecondary,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() =>
              Linking.openURL(
                `mailto:${email}?subject=Regarding%20your%20PharmaCare%20consultation`,
              )
            }
          >
            <Feather name="external-link" size={14} color={colors.primary} />
            <Text style={styles.actionSecondaryText}>Mail App</Text>
          </Pressable>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatTile
            icon="file-text"
            value={data.profile.totalConsultations}
            label="Consults"
            color={colors.primary}
            bg={colors.muted}
          />
          <StatTile
            icon="check-circle"
            value={data.profile.approvedCount}
            label="Approved"
            color="#16A34A"
            bg="#F0FDF4"
          />
          <StatTile
            icon="shopping-bag"
            value={data.profile.totalOrders}
            label="Orders"
            color="#7C3AED"
            bg="#FAF5FF"
          />
          <StatTile
            icon="dollar-sign"
            value={`£${(data.profile.totalSpendPence / 100).toFixed(0)}`}
            label="Spent"
            color="#0E7490"
            bg="#ECFEFF"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(
            [
              "overview",
              "consultations",
              "orders",
              "messages",
              "notes",
            ] as TabKey[]
          ).map((t) => {
            const active = tab === t;
            const counts: Record<TabKey, number | null> = {
              overview: null,
              consultations: data.consultations.length,
              orders: data.orders.length,
              messages: data.recentMessages.length,
              notes: null,
            };
            const labels: Record<TabKey, string> = {
              overview: "Overview",
              consultations: "Consults",
              orders: "Orders",
              messages: "Messages",
              notes: "Notes",
            };
            return (
              <Pressable
                key={t}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTab(t);
                }}
                style={styles.tabBtn}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    active && {
                      color: colors.primary,
                      fontWeight: "700" as const,
                    },
                  ]}
                >
                  {labels[t]}
                  {counts[t] !== null && counts[t]! > 0 && ` (${counts[t]})`}
                </Text>
                {active && (
                  <View
                    style={[
                      styles.tabIndicator,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {tab === "overview" && (
            <View style={{ gap: 14 }}>
              {data.profile.topConditions.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Top conditions</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    {data.profile.topConditions.map((c) => (
                      <View key={c.name} style={styles.conditionRow}>
                        <Text style={styles.conditionName} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <View style={styles.conditionCountPill}>
                          <Text style={styles.conditionCountText}>
                            {c.count}×
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Activity summary</Text>
                <View style={{ gap: 6, marginTop: 10 }}>
                  <ActivityRow
                    label="Last seen"
                    value={
                      data.profile.lastSeenAt
                        ? formatDistanceToNow(
                            new Date(data.profile.lastSeenAt),
                            { addSuffix: true },
                          )
                        : "—"
                    }
                  />
                  <ActivityRow
                    label="Approved consults"
                    value={String(data.profile.approvedCount)}
                  />
                  <ActivityRow
                    label="Pending review"
                    value={String(data.profile.pendingCount)}
                  />
                  <ActivityRow
                    label="Awaiting more info"
                    value={String(data.profile.moreInfoCount)}
                  />
                  <ActivityRow
                    label="Referred"
                    value={String(data.profile.referredCount)}
                  />
                  <ActivityRow
                    label="Rejected"
                    value={String(data.profile.rejectedCount)}
                  />
                  <ActivityRow
                    label="Total spend"
                    value={gbp(data.profile.totalSpendPence)}
                  />
                </View>
              </View>
            </View>
          )}

          {tab === "consultations" && (
            <View style={{ gap: 10 }}>
              {data.consultations.length === 0 ? (
                <EmptyBlock
                  icon="file-text"
                  text="No consultations on record"
                />
              ) : (
                data.consultations.map((c) => {
                  const meta = STATUS_META[c.status] ?? STATUS_META.pending;
                  return (
                    <Pressable
                      key={c.id}
                      style={({ pressed }) => [
                        styles.listCard,
                        pressed && { opacity: 0.78 },
                      ]}
                      onPress={() => router.push(`/consultation/${c.id}`)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listCardTitle} numberOfLines={1}>
                          {c.conditionName}
                        </Text>
                        <Text style={styles.listCardSubtitle}>
                          {format(new Date(c.createdAt), "d MMM yyyy")} ·{" "}
                          {formatDistanceToNow(new Date(c.createdAt), {
                            addSuffix: true,
                          })}
                        </Text>
                        {c.prescription && (
                          <Text style={styles.listCardExtra} numberOfLines={1}>
                            <Feather
                              name="clipboard"
                              size={10}
                              color={colors.mutedForeground}
                            />{" "}
                            {c.prescription}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: meta.bg },
                        ]}
                      >
                        <Text
                          style={[styles.statusPillText, { color: meta.fg }]}
                        >
                          {meta.label}
                        </Text>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={16}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          {tab === "orders" && (
            <View style={{ gap: 10 }}>
              {data.orders.length === 0 ? (
                <EmptyBlock icon="shopping-bag" text="No orders on record" />
              ) : (
                data.orders.map((o) => {
                  const stage = o.delivery?.status ?? o.status;
                  const meta =
                    ORDER_STATUS_META[stage] ?? ORDER_STATUS_META.pending;
                  return (
                    <View key={o.id} style={styles.orderCard}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listCardTitle}>
                            {o.orderNumber}
                          </Text>
                          <Text style={styles.listCardSubtitle}>
                            {format(new Date(o.createdAt), "d MMM yyyy")} ·{" "}
                            {gbp(o.totalGbp)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: meta.bg },
                          ]}
                        >
                          <Text
                            style={[styles.statusPillText, { color: meta.fg }]}
                          >
                            {meta.label}
                          </Text>
                        </View>
                      </View>
                      {o.items.length > 0 && (
                        <View style={{ marginTop: 8, gap: 2 }}>
                          {o.items.slice(0, 3).map((it) => (
                            <Text key={it.id} style={styles.itemLine}>
                              {it.quantity}× {it.productName}
                            </Text>
                          ))}
                          {o.items.length > 3 && (
                            <Text
                              style={[
                                styles.itemLine,
                                { color: colors.mutedForeground },
                              ]}
                            >
                              +{o.items.length - 3} more
                            </Text>
                          )}
                        </View>
                      )}
                      {o.delivery?.trackingNumber && (
                        <View style={styles.trackingChip}>
                          <Feather
                            name="truck"
                            size={11}
                            color={colors.primary}
                          />
                          <Text
                            style={styles.trackingChipText}
                            numberOfLines={1}
                          >
                            {o.delivery.carrier ?? "Royal Mail"} ·{" "}
                            {o.delivery.trackingNumber}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {tab === "messages" && (
            <View style={{ gap: 8 }}>
              {data.recentMessages.length === 0 ? (
                <EmptyBlock
                  icon="message-square"
                  text="No messages exchanged"
                />
              ) : (
                data.recentMessages.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[
                      styles.messageCard,
                      m.senderRole === "pharmacist"
                        ? styles.msgPharm
                        : styles.msgPatient,
                    ]}
                    onPress={() =>
                      router.push(`/consultation/${m.consultationId}`)
                    }
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <Feather
                        name={
                          m.senderRole === "pharmacist" ? "user-check" : "user"
                        }
                        size={11}
                        color={
                          m.senderRole === "pharmacist"
                            ? colors.primary
                            : colors.mutedForeground
                        }
                      />
                      <Text style={styles.messageMeta}>
                        {m.senderName} ·{" "}
                        {formatDistanceToNow(new Date(m.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </View>
                    <Text style={styles.messageBody} numberOfLines={3}>
                      {m.body}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {tab === "notes" && (
            <View style={{ gap: 12, paddingBottom: 8 }}>
              {/* Compose new note */}
              <View style={[styles.card, { gap: 10 }]}>
                <Text style={styles.cardTitle}>Add clinical note</Text>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="Write a note visible to all prescribers…"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={[
                    styles.modalInput,
                    {
                      borderColor: colors.border,
                      color: colors.secondary,
                      minHeight: 90,
                      textAlignVertical: "top",
                      paddingTop: 10,
                      marginTop: 2,
                    },
                  ]}
                />
                <Pressable
                  onPress={createNote}
                  disabled={savingNote || !noteDraft.trim()}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center" as const,
                      opacity:
                        savingNote || !noteDraft.trim()
                          ? 0.5
                          : pressed
                            ? 0.85
                            : 1,
                    },
                  ]}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                  >
                    {savingNote ? "Saving…" : "Save note"}
                  </Text>
                </Pressable>
              </View>

              {/* Existing notes */}
              {notesLoading ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : notes.length === 0 ? (
                <EmptyBlock icon="file-text" text="No clinical notes yet" />
              ) : (
                notes.map((n) => (
                  <View key={n.id} style={[styles.card, { gap: 6 }]}>
                    {editingNoteId === n.id ? (
                      <>
                        <TextInput
                          value={editingNoteText}
                          onChangeText={setEditingNoteText}
                          multiline
                          autoFocus
                          style={[
                            styles.modalInput,
                            {
                              borderColor: colors.primary,
                              color: colors.secondary,
                              minHeight: 80,
                              textAlignVertical: "top",
                              paddingTop: 10,
                            },
                          ]}
                        />
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 8,
                            justifyContent: "flex-end",
                          }}
                        >
                          <Pressable
                            onPress={() => {
                              setEditingNoteId(null);
                              setEditingNoteText("");
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color: colors.mutedForeground,
                              }}
                            >
                              Cancel
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={saveEditNote}
                            disabled={savingNote}
                            style={({ pressed }) => [
                              {
                                backgroundColor: colors.primary,
                                paddingHorizontal: 16,
                                paddingVertical: 6,
                                borderRadius: 8,
                                opacity: savingNote || pressed ? 0.75 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#fff",
                                fontWeight: "700",
                              }}
                            >
                              {savingNote ? "Saving…" : "Save"}
                            </Text>
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.secondary,
                            lineHeight: 20,
                          }}
                        >
                          {n.note}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: colors.mutedForeground,
                            }}
                          >
                            {n.createdBy} ·{" "}
                            {formatDistanceToNow(new Date(n.createdAt), {
                              addSuffix: true,
                            })}
                            {n.updatedAt && n.updatedAt !== n.createdAt
                              ? " (edited)"
                              : ""}
                          </Text>
                          <View style={{ flexDirection: "row", gap: 12 }}>
                            <Pressable
                              hitSlop={8}
                              onPress={() => {
                                setEditingNoteId(n.id);
                                setEditingNoteText(n.note);
                              }}
                            >
                              <Feather
                                name="edit-2"
                                size={14}
                                color={colors.primary}
                              />
                            </Pressable>
                            <Pressable
                              hitSlop={8}
                              onPress={() => deleteNote(n.id)}
                            >
                              <Feather
                                name="trash-2"
                                size={14}
                                color="#DC2626"
                              />
                            </Pressable>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Compose Email Modal */}
      <Modal
        visible={emailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEmailModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setEmailModal(false)}
              style={{ padding: 6 }}
            >
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Cancel
              </Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Email</Text>
            <Pressable
              onPress={sendCustomEmail}
              disabled={sending}
              style={{ padding: 6, opacity: sending ? 0.5 : 1 }}
            >
              <Text style={[styles.modalSend, { color: colors.primary }]}>
                {sending ? "Sending…" : "Send"}
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View>
              <Text style={styles.modalLabel}>To</Text>
              <View
                style={[styles.modalReadonly, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.secondary, fontSize: 14 }}>
                  {email}
                </Text>
              </View>
            </View>
            <View>
              <Text style={styles.modalLabel}>Subject</Text>
              <TextInput
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="What's this about?"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.modalInput,
                  { borderColor: colors.border, color: colors.secondary },
                ]}
              />
            </View>
            <View>
              <Text style={styles.modalLabel}>Message</Text>
              <TextInput
                value={emailMessage}
                onChangeText={setEmailMessage}
                placeholder="Write a message to your patient…"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.modalInput,
                  {
                    borderColor: colors.border,
                    color: colors.secondary,
                    minHeight: 200,
                    textAlignVertical: "top",
                    paddingTop: 12,
                  },
                ]}
                multiline
              />
            </View>
            <Text style={styles.modalHint}>
              Sent from your PharmaCare account. The patient will be able to
              reply through their account portal or by emailing back.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function StatTile({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
      }}
    >
      <Feather name={icon as never} size={14} color={color} />
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800" as const,
          color,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 9,
          color,
          marginTop: 1,
          fontWeight: "700" as const,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ActivityRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 13, color: "#64748B" }}>{label}</Text>
      <Text
        style={{ fontSize: 13, color: "#1E293B", fontWeight: "600" as const }}
      >
        {value}
      </Text>
    </View>
  );
}

function EmptyBlock({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ alignItems: "center", padding: 32, gap: 8 }}>
      <Feather name={icon as never} size={28} color="#94A3B8" />
      <Text style={{ fontSize: 13, color: "#94A3B8" }}>{text}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center", gap: 12 },
    loadingText: { fontSize: 14, color: colors.mutedForeground },
    backBtn: {
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 10,
    },
    backBtnText: { color: "#fff", fontWeight: "600" },

    heroCard: {
      alignItems: "center",
      paddingTop: 24,
      paddingBottom: 18,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    heroAvatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    heroAvatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 28 },
    heroName: {
      fontSize: 22,
      fontWeight: "800" as const,
      color: colors.secondary,
      textAlign: "center",
    },
    heroEmail: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 4,
    },
    heroEmailText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600" as const,
    },
    heroMeta: { fontSize: 11, color: colors.mutedForeground, marginTop: 6 },
    warningChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FEF2F2",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginTop: 10,
      borderWidth: 1,
      borderColor: "#FECACA",
    },
    warningChipText: {
      fontSize: 11,
      color: "#DC2626",
      fontWeight: "700" as const,
    },

    actionRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    actionPrimary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
    },
    actionPrimaryText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700" as const,
    },
    actionSecondary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.muted,
      paddingVertical: 12,
      borderRadius: 12,
    },
    actionSecondaryText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "700" as const,
    },

    statsGrid: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 14,
    },

    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 14,
    },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabLabel: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.mutedForeground,
    },
    tabIndicator: {
      position: "absolute",
      bottom: 0,
      left: 16,
      right: 16,
      height: 2.5,
      borderRadius: 2,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "700" as const,
      color: colors.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },

    conditionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    conditionName: {
      flex: 1,
      fontSize: 13,
      color: colors.secondary,
      fontWeight: "500" as const,
    },
    conditionCountPill: {
      backgroundColor: colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    conditionCountText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "700" as const,
    },

    listCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    listCardTitle: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: colors.secondary,
    },
    listCardSubtitle: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    listCardExtra: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    statusPillText: {
      fontSize: 10,
      fontWeight: "800" as const,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },

    orderCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemLine: { fontSize: 12, color: colors.secondary },
    trackingChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      marginTop: 8,
    },
    trackingChipText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "600" as const,
      flex: 1,
    },

    messageCard: { padding: 12, borderRadius: 12, borderWidth: 1 },
    msgPharm: { backgroundColor: "#EBF8FF", borderColor: "#BFDBFE" },
    msgPatient: { backgroundColor: colors.card, borderColor: colors.border },
    messageMeta: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontWeight: "600" as const,
    },
    messageBody: { fontSize: 13, color: colors.secondary, lineHeight: 18 },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    modalCancel: { fontSize: 14, fontWeight: "600" as const },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.secondary,
    },
    modalSend: { fontSize: 14, fontWeight: "700" as const },
    modalLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontWeight: "700" as const,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    modalReadonly: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      backgroundColor: colors.muted,
    },
    modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
    modalHint: {
      fontSize: 11,
      color: colors.mutedForeground,
      lineHeight: 16,
      marginTop: 4,
    },
  });
}

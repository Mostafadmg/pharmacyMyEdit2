import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { formatDistanceToNow } from "date-fns";
import { getCurrentToken } from "@/context/AuthContext";

type Thread = {
  id: string;
  patientName: string;
  patientEmail: string;
  conditionName: string;
  consultationStatus: string;
  createdAt: string;
  lastMsgBody: string | null;
  lastMsgAt: string | null;
  lastMsgRole: string | null;
  lastMsgSender: string | null;
  unreadCount: number;
  totalMessages: number;
};

type FilterKey = "all" | "unread" | "awaiting";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All threads" },
  { key: "unread", label: "Patient replied" },
  { key: "awaiting", label: "Awaiting reply" },
];

const STATUS_COLORS: Record<string, string> = {
  patient_responded: "#F97316",
  more_info_needed: "#2563EB",
  pending: "#D97706",
  approved: "#16A34A",
  rejected: "#6B7280",
  referred: "#7C3AED",
  red_flag: "#DC2626",
};

const STATUS_LABELS: Record<string, string> = {
  patient_responded: "Patient replied",
  more_info_needed: "Awaiting reply",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  referred: "Referred",
  red_flag: "Urgent",
};

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export default function MessagesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const token = getCurrentToken();
      const res = await fetch(`${BASE_URL}/api/pharmacist/message-threads`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json();
      setThreads(json.threads ?? []);
    } catch {
      // network error — keep last data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const unreadCount = useMemo(
    () => threads.filter((t) => Number(t.unreadCount) > 0).length,
    [threads],
  );
  const awaitingCount = useMemo(
    () =>
      threads.filter((t) => t.consultationStatus === "more_info_needed").length,
    [threads],
  );

  const filtered = useMemo(() => {
    let list = threads;
    if (filter === "unread")
      list = list.filter((t) => Number(t.unreadCount) > 0);
    if (filter === "awaiting")
      list = list.filter((t) => t.consultationStatus === "more_info_needed");
    return list;
  }, [threads, filter]);

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading messages…</Text>
      </View>
    );
  }

  const Header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headingTitle}>Messages</Text>
          <Text style={styles.headingSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} patient ${unreadCount === 1 ? "reply" : "replies"} waiting`
              : threads.length > 0
                ? `${threads.length} thread${threads.length !== 1 ? "s" : ""}`
                : "No message threads yet"}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count =
            f.key === "unread"
              ? unreadCount
              : f.key === "awaiting"
                ? awaitingCount
                : threads.length;
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f.key);
              }}
              style={[
                styles.filterPill,
                active && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              testID={`filter-${f.key}`}
            >
              <Text style={[styles.filterText, active && { color: "#fff" }]}>
                {f.label}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={() => Header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom:
              Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          },
        ]}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Feather
                name="message-square"
                size={32}
                color={colors.mutedForeground}
              />
            </View>
            <Text style={styles.emptyTitle}>No threads</Text>
            <Text style={styles.emptySubtitle}>
              {threads.length === 0
                ? "Threads appear here when you or a patient send messages on a consultation."
                : "No consultations match this filter."}
            </Text>
          </View>
        )}
        renderItem={({ item: t }) => {
          const isUnread = Number(t.unreadCount) > 0;
          const isUrgent = t.consultationStatus === "red_flag";
          const statusColor =
            STATUS_COLORS[t.consultationStatus] ?? colors.mutedForeground;
          const initials = t.patientName
            .split(" ")
            .map((w: string) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          const preview = t.lastMsgBody
            ? t.lastMsgBody.length > 80
              ? t.lastMsgBody.slice(0, 80) + "…"
              : t.lastMsgBody
            : null;

          const timeLabel = t.lastMsgAt
            ? formatDistanceToNow(new Date(t.lastMsgAt), { addSuffix: true })
            : formatDistanceToNow(new Date(t.createdAt), { addSuffix: true });

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isUnread && {
                  borderColor: "#F97316",
                  backgroundColor: "#F9731614",
                },
                isUrgent && {
                  borderColor: colors.urgent,
                  backgroundColor: colors.urgent + "14",
                },
                pressed && { opacity: 0.78 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/messages/${t.id}` as never);
              }}
              testID={`thread-${t.id}`}
            >
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: isUrgent ? "#DC2626" : colors.primary },
                  ]}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text
                    style={[
                      styles.patientName,
                      isUnread && {
                        color: colors.foreground,
                        fontWeight: "800" as const,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t.patientName}
                  </Text>
                  <Text style={styles.timeAgo}>{timeLabel}</Text>
                </View>

                <Text style={styles.conditionName} numberOfLines={1}>
                  {t.conditionName}
                </Text>

                {preview ? (
                  <Text
                    style={[
                      styles.previewText,
                      isUnread && {
                        color: colors.foreground,
                        fontWeight: "600" as const,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t.lastMsgRole === "patient" ? "Patient: " : "You: "}
                    {preview}
                  </Text>
                ) : (
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {STATUS_LABELS[t.consultationStatus] ??
                        t.consultationStatus}
                    </Text>
                  </View>
                )}

                <Text style={styles.msgCount}>
                  {Number(t.totalMessages)} message
                  {Number(t.totalMessages) !== 1 ? "s" : ""}
                  {isUnread ? ` · ${t.unreadCount} unread` : ""}
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14 },
    header: { padding: 16, paddingBottom: 0 },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    headingTitle: {
      fontSize: 22,
      fontWeight: "800" as const,
      color: colors.secondary,
    },
    headingSubtitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    unreadBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#F97316",
      alignItems: "center",
      justifyContent: "center",
    },
    unreadBadgeText: {
      color: "#fff",
      fontWeight: "800" as const,
      fontSize: 13,
    },
    filterScroll: { marginBottom: 14 },
    filterContent: { gap: 8, paddingRight: 4 },
    filterPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterText: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.secondary,
    },
    listContent: { padding: 16 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    avatarWrap: { position: "relative" },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 15 },
    unreadDot: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#F97316",
      borderWidth: 2,
      borderColor: colors.card,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    patientName: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: colors.secondary,
      flex: 1,
      marginRight: 6,
    },
    timeAgo: { fontSize: 10, color: colors.mutedForeground },
    conditionName: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 3,
    },
    previewText: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 3,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 3,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: "600" as const },
    msgCount: { fontSize: 10, color: colors.mutedForeground, marginTop: 1 },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      color: colors.secondary,
      marginTop: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: "center",
      paddingHorizontal: 32,
    },
  });
}

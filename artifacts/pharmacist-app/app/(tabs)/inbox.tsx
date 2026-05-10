import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useMemo, useState } from "react";
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
import { useListConsultations } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { formatDistanceToNow } from "date-fns";

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

const PRIORITY: Record<string, number> = {
  patient_responded: 0,
  red_flag: 1,
  more_info_needed: 2,
  pending: 3,
  approved: 4,
  referred: 5,
  rejected: 6,
};

export default function MessagesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { limit: 200 },
    { query: { refetchInterval: 30000 } as never },
  );

  const threads = useMemo(() => {
    const all = data?.consultations ?? [];
    const filtered = all.filter((c) => {
      if (filter === "unread") return c.status === "patient_responded";
      if (filter === "awaiting") return c.status === "more_info_needed";
      return true;
    });
    return filtered.slice().sort((a, b) => {
      const pA = PRIORITY[a.status] ?? 9;
      const pB = PRIORITY[b.status] ?? 9;
      if (pA !== pB) return pA - pB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data, filter]);

  const unreadCount = useMemo(
    () => (data?.consultations ?? []).filter((c) => c.status === "patient_responded").length,
    [data],
  );
  const awaitingCount = useMemo(
    () => (data?.consultations ?? []).filter((c) => c.status === "more_info_needed").length,
    [data],
  );

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  if (isLoading) {
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
              : "All threads up to date"}
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
          const count = f.key === "unread" ? unreadCount : f.key === "awaiting" ? awaitingCount : 0;
          return (
            <Pressable
              key={f.key}
              onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
              style={[
                styles.filterPill,
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              testID={`filter-${f.key}`}
            >
              <Text style={[styles.filterText, active && { color: "#fff" }]}>
                {f.label}{count > 0 ? ` (${count})` : ""}
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
        data={threads}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={() => Header}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
        ]}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="message-square" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>No threads</Text>
            <Text style={styles.emptySubtitle}>
              {filter === "all"
                ? "Patient threads will appear here when consultations are submitted."
                : "No consultations match this filter."}
            </Text>
          </View>
        )}
        renderItem={({ item: c }) => {
          const initials = c.patientName
            .split(" ")
            .map((w: string) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const isUnread = c.status === "patient_responded";
          const isUrgent = c.status === "red_flag";
          const statusColor = STATUS_COLORS[c.status] ?? colors.mutedForeground;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isUnread && { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
                isUrgent && { borderColor: "#DC2626", backgroundColor: "#FFF1F2" },
                pressed && { opacity: 0.78 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/messages/${c.id}` as never);
              }}
              testID={`thread-${c.id}`}
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: isUrgent ? "#DC2626" : colors.primary }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text
                    style={[styles.patientName, isUnread && { color: "#C2410C", fontWeight: "800" as const }]}
                    numberOfLines={1}
                  >
                    {c.patientName}
                  </Text>
                  <Text style={styles.timeAgo}>
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <Text style={styles.conditionName} numberOfLines={1}>{c.conditionName}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </Text>
                </View>
              </View>

              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
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
    headingTitle: { fontSize: 22, fontWeight: "800" as const, color: colors.secondary },
    headingSubtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    unreadBadge: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: "#F97316",
      alignItems: "center", justifyContent: "center",
    },
    unreadBadgeText: { color: "#fff", fontWeight: "800" as const, fontSize: 13 },
    filterScroll: { marginBottom: 14 },
    filterContent: { gap: 8, paddingRight: 4 },
    filterPill: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 999, borderWidth: 1.5,
      borderColor: colors.border, backgroundColor: colors.card,
    },
    filterText: { fontSize: 12, fontWeight: "600" as const, color: colors.secondary },
    listContent: { padding: 16 },
    card: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border,
      padding: 14,
    },
    avatarWrap: { position: "relative" },
    avatar: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: "center", justifyContent: "center",
    },
    avatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 15 },
    unreadDot: {
      position: "absolute", top: -2, right: -2,
      width: 12, height: 12, borderRadius: 6,
      backgroundColor: "#F97316",
      borderWidth: 2, borderColor: colors.card,
    },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
    patientName: { fontSize: 14, fontWeight: "700" as const, color: colors.secondary, flex: 1, marginRight: 6 },
    timeAgo: { fontSize: 10, color: colors.mutedForeground },
    conditionName: { fontSize: 12, color: colors.mutedForeground, marginBottom: 4 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: "600" as const },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
    emptyIcon: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.muted,
      alignItems: "center", justifyContent: "center",
    },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary, marginTop: 4 },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
  });
}

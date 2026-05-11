import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useEffect, useRef, useState } from "react";
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
import { useListConsultations, useGetDashboardStats } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { formatDistanceToNow } from "date-fns";
import { BrandHeader, FONT, StatTile } from "@/components/Brand";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "Awaiting review", bg: "#FFF7ED", text: "#B45309", dot: "#F59E0B" },
  red_flag: { label: "Urgent", bg: "#FEF2F2", text: "#B91C1C", dot: "#EF4444" },
  patient_responded: { label: "Patient replied", bg: "#FFF3E0", text: "#C2410C", dot: "#F97316" },
};

type FilterKey = "all" | "pending" | "urgent" | "replied";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All pending" },
  { key: "pending", label: "Standard" },
  { key: "urgent", label: "Urgent" },
  { key: "replied", label: "Replied" },
];

export default function PendingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prevCountRef = useRef<number>(0);
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { limit: 100 },
    { query: { refetchInterval: 20000 } as never },
  );

  const { data: stats } = useGetDashboardStats({
    query: { refetchInterval: 20000 } as never,
  });

  const allConsultations = data?.consultations ?? [];
  const pendingConsultations = allConsultations.filter(c =>
    c.status === "pending" || c.status === "red_flag" || c.status === "patient_responded"
  );

  const filtered = pendingConsultations.filter(c => {
    if (filter === "pending") return c.status === "pending";
    if (filter === "urgent") return c.status === "red_flag";
    if (filter === "replied") return c.status === "patient_responded";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "red_flag" && b.status !== "red_flag") return -1;
    if (b.status === "red_flag" && a.status !== "red_flag") return 1;
    if (a.status === "patient_responded" && b.status !== "patient_responded") return -1;
    if (b.status === "patient_responded" && a.status !== "patient_responded") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  useEffect(() => {
    const count = pendingConsultations.length;
    if (prevCountRef.current > 0 && count > prevCountRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevCountRef.current = count;
  }, [pendingConsultations.length]);

  const urgentCount = pendingConsultations.filter(c => c.status === "red_flag").length;
  const standardCount = pendingConsultations.filter(c => c.status === "pending").length;
  const repliedCount = pendingConsultations.filter(c => c.status === "patient_responded").length;
  const totalPending = pendingConsultations.length;

  const styles = makeStyles(colors);
  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 12 : nativeTabs ? insets.top + 8 : insets.top + 4;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading queue…</Text>
      </View>
    );
  }

  const subtitle =
    totalPending === 0
      ? "All caught up — no patients waiting."
      : `${totalPending} patient${totalPending === 1 ? "" : "s"} waiting for a prescriber.`;

  const ListHeader = (
    <View>
      <BrandHeader
        title="Today's queue,"
        accent="ready for you."
        subtitle={subtitle}
        style={{ paddingHorizontal: 16, paddingBottom: 4 }}
      />

      <View style={styles.statsRow}>
        <StatTile icon="clock" value={standardCount} label="Standard" tint="#B45309" tintBg="#FEF3C7" />
        <StatTile icon="alert-triangle" value={urgentCount} label="Urgent" tint="#B91C1C" tintBg="#FEE2E2" />
        <StatTile icon="message-square" value={repliedCount} label="Replied" tint="#C2410C" tintBg="#FFEDD5" />
        <StatTile icon="check-circle" value={stats?.approvedToday ?? 0} label="Today" tint="#15803D" tintBg="#DCFCE7" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTER_OPTIONS.map(opt => {
          const count =
            opt.key === "all" ? totalPending :
            opt.key === "urgent" ? urgentCount :
            opt.key === "replied" ? repliedCount :
            standardCount;
          const active = filter === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(opt.key);
              }}
              style={[
                styles.filterPill,
                active && { backgroundColor: colors.secondary, borderColor: colors.secondary },
              ]}
            >
              <Text style={[styles.filterText, active && { color: "#FFFFFF" }]}>
                {opt.label}
              </Text>
              <View style={[styles.filterCount, active && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, active && { color: colors.secondary }]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        scrollEnabled
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
        ]}
        ListHeaderComponent={() => ListHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySubtitle}>No pending consultations right now</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
          const isUrgent = item.status === "red_flag";
          const isReplied = item.status === "patient_responded";
          const initials = item.patientName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/consultation/${item.id}`);
              }}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isUrgent
                        ? colors.urgent + "22"
                        : isReplied
                          ? "#F9731622"
                          : colors.primary + "1E",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: isUrgent ? colors.urgent : isReplied ? "#F97316" : colors.primary },
                    ]}
                  >
                    {initials}
                  </Text>
                </View>
                {isReplied && <View style={styles.notifDot} />}
                {isUrgent && <View style={[styles.notifDot, { backgroundColor: "#EF4444" }]} />}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.patientName} numberOfLines={1}>{item.patientName}</Text>
                  <Text style={styles.timeAgo}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <Text style={styles.conditionName} numberOfLines={1}>{item.conditionName}</Text>
                <View style={styles.cardBottom}>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                  {item.hasPhoto && (
                    <View style={styles.metaChip}>
                      <Feather name="camera" size={10} color={colors.primary} />
                    </View>
                  )}
                  {item.hasRedFlag && !isUrgent && (
                    <View style={[styles.metaChip, { backgroundColor: "#FEE2E2" }]}>
                      <Feather name="flag" size={10} color="#EF4444" />
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </View>
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
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14, fontFamily: FONT.body },
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    filterScroll: { marginBottom: 6 },
    filterContent: { gap: 8, paddingHorizontal: 16, paddingRight: 24 },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 44,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterText: {
      fontSize: 13,
      fontFamily: FONT.bodySemibold,
      color: colors.secondary,
    },
    filterCount: {
      minWidth: 22,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    filterCountActive: {
      backgroundColor: "#FFFFFF",
    },
    filterCountText: {
      fontSize: 11,
      fontFamily: FONT.bodyBold,
      color: colors.mutedForeground,
    },
    listContent: { paddingTop: 6, paddingHorizontal: 0 },
    card: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 18,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      ...Platform.select({
        ios: {
          shadowColor: "#0E2354",
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 1 },
        default: { boxShadow: "0 4px 12px rgba(14, 35, 84, 0.05)" } as object,
      }),
    },
    cardPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
    cardLeft: {
      position: "relative",
      marginRight: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontFamily: FONT.bodyBold, fontSize: 15, letterSpacing: -0.2 },
    notifDot: {
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
    cardBody: { flex: 1 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    patientName: { fontSize: 15, fontFamily: FONT.bodyBold, color: colors.secondary, flex: 1, letterSpacing: -0.2 },
    timeAgo: { fontSize: 11, color: colors.mutedForeground, marginLeft: 6, fontFamily: FONT.body },
    conditionName: { fontSize: 12.5, color: colors.mutedForeground, marginTop: 2, marginBottom: 8, fontFamily: FONT.body },
    cardBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10.5, fontFamily: FONT.bodySemibold, letterSpacing: 0.1 },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 4,
      backgroundColor: colors.primary + "1E",
    },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + "1E", alignItems: "center", justifyContent: "center" },
    emptyTitle: { fontSize: 18, fontFamily: FONT.displayExtra, color: colors.secondary, marginTop: 4 },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32, fontFamily: FONT.body },
  });
}

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; bar: string }> = {
  pending: { label: "Awaiting Review", bg: "#FFF7ED", text: "#D97706", bar: "#F59E0B" },
  red_flag: { label: "URGENT", bg: "#FFF1F2", text: "#EF4444", bar: "#EF4444" },
  patient_responded: { label: "Patient Replied", bg: "#FFF3E0", text: "#E65100", bar: "#FF6D00" },
};

type FilterKey = "all" | "pending" | "urgent" | "replied";

const FILTER_OPTIONS: { key: FilterKey; label: string; color: string }[] = [
  { key: "all", label: "All Pending", color: "#0E2354" },
  { key: "pending", label: "Standard", color: "#D97706" },
  { key: "urgent", label: "Urgent", color: "#EF4444" },
  { key: "replied", label: "Replied", color: "#E65100" },
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

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading queue...</Text>
      </View>
    );
  }

  const ListHeader = (
    <View>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatChip icon="clock" value={standardCount} label="Standard" color="#D97706" bg="#FFF7ED" />
        <StatChip icon="alert-triangle" value={urgentCount} label="Urgent" color="#EF4444" bg="#FFF1F2" />
        <StatChip icon="message-square" value={repliedCount} label="Replied" color="#E65100" bg="#FFF3E0" />
        <StatChip icon="check-circle" value={stats?.approvedToday ?? 0} label="Today" color="#16A34A" bg="#F0FDF4" />
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTER_OPTIONS.map(opt => (
          <Pressable
            key={opt.key}
            onPress={() => setFilter(opt.key)}
            style={[
              styles.filterPill,
              filter === opt.key && { backgroundColor: opt.color, borderColor: opt.color },
            ]}
          >
            <Text style={[styles.filterText, filter === opt.key && { color: "#fff" }]}>
              {opt.label}
              {opt.key === "all" ? ` (${pendingConsultations.length})` :
               opt.key === "urgent" ? ` (${urgentCount})` :
               opt.key === "replied" ? ` (${repliedCount})` :
               ` (${standardCount})`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
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
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySubtitle}>No pending consultations right now</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
          const isUrgent = item.status === "red_flag";
          const initials = item.patientName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

          const isReplied = item.status === "patient_responded";

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isUrgent && styles.urgentCard,
                isReplied && styles.repliedCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/consultation/${item.id}`);
              }}
            >
              {/* Color bar */}
              <View style={[styles.colorBar, { backgroundColor: sc.bar }]} />

              <View style={{ position: "relative", marginLeft: 12, marginRight: 10, flexShrink: 0 }}>
                <View style={[styles.avatar, { backgroundColor: isUrgent ? "#EF4444" : isReplied ? "#E65100" : colors.primary, marginLeft: 0, marginRight: 0 }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                {isReplied && (
                  <View style={styles.notifDot} />
                )}
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
                    {isUrgent && <Feather name="alert-triangle" size={9} color={sc.text} style={{ marginRight: 3 }} />}
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                  {item.hasPhoto && (
                    <View style={styles.photoBadge}>
                      <Feather name="camera" size={9} color={colors.primary} />
                    </View>
                  )}
                  {item.hasRedFlag && !isUrgent && (
                    <View style={[styles.photoBadge, { backgroundColor: "#FFF1F2" }]}>
                      <Feather name="flag" size={9} color="#EF4444" />
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function StatChip({ icon, value, label, color, bg }: { icon: string; value: number; label: string; color: string; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 10, alignItems: "center" }}>
      <Feather name={icon as any} size={14} color={color} />
      <Text style={{ fontSize: 20, fontWeight: "800" as const, color, marginTop: 3 }}>{value}</Text>
      <Text style={{ fontSize: 9, color, marginTop: 1, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
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
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      overflow: "hidden",
    },
    urgentCard: {
      borderColor: "#FCA5A5",
      backgroundColor: "#FFFAFA",
    },
    repliedCard: {
      borderColor: "#FFCCBC",
      backgroundColor: "#FFF8F5",
    },
    notifDot: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: "#EF4444",
      borderWidth: 2,
      borderColor: "#fff",
    },
    cardPressed: { opacity: 0.78 },
    colorBar: { width: 4, alignSelf: "stretch", borderRadius: 0 },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
      marginRight: 10,
      flexShrink: 0,
    },
    avatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 17 },
    cardBody: { flex: 1, paddingVertical: 12, paddingRight: 12 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    patientName: { fontSize: 14, fontWeight: "700" as const, color: colors.secondary, flex: 1 },
    timeAgo: { fontSize: 10, color: colors.mutedForeground, marginLeft: 4 },
    conditionName: { fontSize: 12, color: colors.mutedForeground, marginTop: 2, marginBottom: 7 },
    cardBottom: { flexDirection: "row", alignItems: "center", gap: 5 },
    statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    photoBadge: { flexDirection: "row", alignItems: "center", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: "#ECFDF5" },
    statusText: { fontSize: 10, fontWeight: "600" as const },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary, marginTop: 4 },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
  });
}

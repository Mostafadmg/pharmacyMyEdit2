import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListConsultations, useGetDashboardStats } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending Review", bg: "#FFF7ED", text: "#D97706" },
  approved: { label: "Approved", bg: "#F0FDF4", text: "#16A34A" },
  rejected: { label: "Rejected", bg: "#F8FAFC", text: "#6B7A93" },
  more_info_needed: { label: "More Info Needed", bg: "#EFF6FF", text: "#2563EB" },
  referred: { label: "Referred", bg: "#F5F3FF", text: "#7C3AED" },
  red_flag: { label: "URGENT", bg: "#FFF1F2", text: "#EF4444" },
};

export default function QueueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prevCountRef = useRef<number>(0);

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { limit: 50 },
    { query: { refetchInterval: 30000 } }
  );

  const { data: stats } = useGetDashboardStats({
    query: { refetchInterval: 30000 },
  });

  const consultations = data?.consultations ?? [];

  useEffect(() => {
    const count = consultations.length;
    if (prevCountRef.current > 0 && count > prevCountRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevCountRef.current = count;
  }, [consultations.length]);

  const sortedConsultations = [...consultations].sort((a, b) => {
    if (a.status === "red_flag" && b.status !== "red_flag") return -1;
    if (b.status === "red_flag" && a.status !== "red_flag") return 1;
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const styles = makeStyles(colors);

  const ListHeader = (
    <View>
      {stats && (
        <View style={styles.statsRow}>
          <StatChip icon="clock" value={stats.pendingReview} label="Pending" color="#D97706" bg="#FFF7ED" />
          <StatChip icon="alert-triangle" value={stats.redFlagsToday} label="Urgent" color="#EF4444" bg="#FFF1F2" />
          <StatChip icon="check-circle" value={stats.approvedToday} label="Approved" color="#16A34A" bg="#F0FDF4" />
          <StatChip icon="users" value={stats.totalConsultations} label="Total" color={colors.secondary} bg={colors.muted} />
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading queue...</Text>
      </View>
    );
  }

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <FlatList
        data={sortedConsultations}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={sortedConsultations.length > 0}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
        ]}
        ListHeaderComponent={() => ListHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Feather name="inbox" size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>Queue is clear</Text>
            <Text style={styles.emptySubtitle}>No consultations waiting for review</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const status = STATUS_CONFIG[item.status] ?? { label: item.status, bg: colors.muted, text: colors.mutedForeground };
          const isUrgent = item.status === "red_flag";
          const initials = item.patientName.charAt(0).toUpperCase();

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isUrgent && styles.urgentCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/consultation/${item.id}`);
              }}
              testID={`btn-consultation-${item.id}`}
            >
              <View style={[styles.avatar, { backgroundColor: isUrgent ? "#EF4444" : colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.timeAgo}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <Text style={styles.conditionName}>{item.conditionName}</Text>
                <View style={styles.cardBottom}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    {isUrgent && <Feather name="alert-triangle" size={10} color={status.text} style={{ marginRight: 3 }} />}
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                  </View>
                  {item.hasPhoto && (
                    <View style={styles.photoBadge}>
                      <Feather name="camera" size={10} color={colors.primary} />
                      <Text style={[styles.statusText, { color: colors.primary }]}>  Photo</Text>
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

function StatChip({ icon, value, label, color, bg }: { icon: string; value: number; label: string; color: string; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 12, alignItems: "center" }}>
      <Feather name={icon as any} size={16} color={color} />
      <Text style={{ fontSize: 22, fontWeight: "800" as const, color, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color, marginTop: 1, fontWeight: "600" as const }}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    listContent: { padding: 16, gap: 0 },
    card: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    urgentCard: {
      borderColor: "#FCA5A5",
      backgroundColor: "#FFF9F9",
    },
    cardPressed: { opacity: 0.75 },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      flexShrink: 0,
    },
    avatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 20 },
    cardBody: { flex: 1 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    patientName: { fontSize: 15, fontWeight: "700" as const, color: colors.secondary },
    timeAgo: { fontSize: 11, color: colors.mutedForeground },
    conditionName: { fontSize: 13, color: colors.mutedForeground, marginTop: 3, marginBottom: 8 },
    cardBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
    statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    photoBadge: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#ECFDF5" },
    statusText: { fontSize: 11, fontWeight: "600" as const },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary, marginTop: 8 },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
  });
}

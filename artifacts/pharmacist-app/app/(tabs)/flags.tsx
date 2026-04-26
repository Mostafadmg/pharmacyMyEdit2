import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const COMPLETED_STATUSES = ["approved", "rejected", "referred", "more_info_needed"];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; bar: string; icon: string }> = {
  approved: { label: "Approved", bg: "#F0FDF4", text: "#16A34A", bar: "#22C55E", icon: "check-circle" },
  rejected: { label: "Not Suitable", bg: "#F8FAFC", text: "#64748B", bar: "#94A3B8", icon: "x-circle" },
  more_info_needed: { label: "More Info Needed", bg: "#EFF6FF", text: "#2563EB", bar: "#3B82F6", icon: "message-square" },
  referred: { label: "Referred", bg: "#F5F3FF", text: "#7C3AED", bar: "#8B5CF6", icon: "external-link" },
};

type FilterKey = "all" | "approved" | "rejected" | "referred" | "more_info_needed";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "more_info_needed", label: "More Info" },
  { key: "referred", label: "Referred" },
];

export default function ReviewedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { limit: 100 },
    { query: { refetchInterval: 60000 } }
  );

  const allConsultations = data?.consultations ?? [];
  const completedConsultations = allConsultations.filter(c =>
    COMPLETED_STATUSES.includes(c.status)
  );

  const filtered = filter === "all"
    ? completedConsultations
    : completedConsultations.filter(c => c.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    const aDate = a.reviewedAt ?? a.updatedAt;
    const bDate = b.reviewedAt ?? b.updatedAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  const counts = {
    all: completedConsultations.length,
    approved: completedConsultations.filter(c => c.status === "approved").length,
    rejected: completedConsultations.filter(c => c.status === "rejected").length,
    more_info_needed: completedConsultations.filter(c => c.status === "more_info_needed").length,
    referred: completedConsultations.filter(c => c.status === "referred").length,
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading reviewed cases...</Text>
      </View>
    );
  }

  const ListHeader = (
    <View>
      {/* Summary row */}
      <View style={styles.statsRow}>
        <StatChip icon="check-circle" value={counts.approved} label="Approved" color="#16A34A" bg="#F0FDF4" />
        <StatChip icon="x-circle" value={counts.rejected} label="Rejected" color="#64748B" bg="#F8FAFC" />
        <StatChip icon="message-square" value={counts.more_info_needed} label="More Info" color="#2563EB" bg="#EFF6FF" />
        <StatChip icon="external-link" value={counts.referred} label="Referred" color="#7C3AED" bg="#F5F3FF" />
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTER_OPTIONS.map(opt => {
          const sc = STATUS_CONFIG[opt.key];
          const activeColor = sc?.bar ?? "#0E2354";
          return (
            <Pressable
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              style={[
                styles.filterPill,
                filter === opt.key && { backgroundColor: activeColor, borderColor: activeColor },
              ]}
            >
              <Text style={[styles.filterText, filter === opt.key && { color: "#fff" }]}>
                {opt.label} ({counts[opt.key]})
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
        data={sorted}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#16A34A"
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
              <Feather name="clipboard" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>No reviewed cases</Text>
            <Text style={styles.emptySubtitle}>
              {filter === "all" ? "Completed consultations will appear here" : `No ${filter} cases yet`}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status] ?? { label: item.status, bg: colors.muted, text: colors.mutedForeground, bar: colors.border, icon: "circle" };
          const initials = item.patientName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
          const reviewTime = item.reviewedAt
            ? formatDistanceToNow(new Date(item.reviewedAt), { addSuffix: true })
            : formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true });

          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/consultation/${item.id}`);
              }}
            >
              {/* Status color bar */}
              <View style={[styles.colorBar, { backgroundColor: sc.bar }]} />

              <View style={[styles.avatar, { backgroundColor: sc.bar }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.patientName} numberOfLines={1}>{item.patientName}</Text>
                  <Text style={styles.timeAgo}>{reviewTime}</Text>
                </View>
                <Text style={styles.conditionName} numberOfLines={1}>{item.conditionName}</Text>
                <View style={styles.cardBottom}>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Feather name={sc.icon as any} size={9} color={sc.text} style={{ marginRight: 3 }} />
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                  {item.prescription && (
                    <View style={[styles.pill, { backgroundColor: "#F0FDF4" }]}>
                      <Feather name="package" size={9} color="#16A34A" />
                    </View>
                  )}
                  {item.pharmacistNote && (
                    <View style={[styles.pill, { backgroundColor: "#EFF6FF" }]}>
                      <Feather name="file-text" size={9} color="#2563EB" />
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
    filterText: { fontSize: 12, fontWeight: "600" as const, color: colors.secondary },
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
    cardPressed: { opacity: 0.78 },
    colorBar: { width: 4, alignSelf: "stretch" },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
      marginRight: 10,
      flexShrink: 0,
    },
    avatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 16 },
    cardBody: { flex: 1, paddingVertical: 12, paddingRight: 12 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    patientName: { fontSize: 14, fontWeight: "700" as const, color: colors.secondary, flex: 1 },
    timeAgo: { fontSize: 10, color: colors.mutedForeground, marginLeft: 4 },
    conditionName: { fontSize: 12, color: colors.mutedForeground, marginTop: 2, marginBottom: 7 },
    cardBottom: { flexDirection: "row", alignItems: "center", gap: 5 },
    statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    pill: { borderRadius: 6, padding: 4 },
    statusText: { fontSize: 10, fontWeight: "600" as const },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary, marginTop: 4 },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
  });
}

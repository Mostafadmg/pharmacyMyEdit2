import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

const CATEGORIES = [
  { key: "approved",          label: "Approved",    icon: "check-circle",  color: "#16A34A", bg: "#F0FDF4" },
  { key: "rejected",          label: "Rejected",    icon: "x-circle",      color: "#64748B", bg: "#F8FAFC" },
  { key: "more_info_needed",  label: "More Info",   icon: "message-square",color: "#2563EB", bg: "#EFF6FF" },
  { key: "referred",          label: "Referred",    icon: "external-link", color: "#7C3AED", bg: "#F5F3FF" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

const COMPLETED_STATUSES = CATEGORIES.map(c => c.key);

export default function ReviewedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("approved");

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { limit: 100 },
    { query: { refetchInterval: 60000 } as never }
  );

  const allConsultations = data?.consultations ?? [];
  const completed = allConsultations.filter(c => COMPLETED_STATUSES.includes(c.status as CategoryKey));

  const counts = Object.fromEntries(
    CATEGORIES.map(cat => [cat.key, completed.filter(c => c.status === cat.key).length])
  ) as Record<CategoryKey, number>;

  const activeCat = CATEGORIES.find(c => c.key === activeCategory)!;
  const items = completed
    .filter(c => c.status === activeCategory)
    .sort((a, b) => {
      const aDate = a.reviewedAt ?? a.updatedAt;
      const bDate = b.reviewedAt ?? b.updatedAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={activeCat.color} />
        <Text style={styles.loadingText}>Loading reviewed cases...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Stats summary bar */}
      <View style={styles.statsBar}>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.key}
            style={[styles.statCard, { backgroundColor: cat.bg }, activeCategory === cat.key && styles.statCardActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveCategory(cat.key);
            }}
          >
            <Feather name={cat.icon as any} size={14} color={cat.color} />
            <Text style={[styles.statCount, { color: cat.color }]}>{counts[cat.key]}</Text>
            <Text style={[styles.statLabel, { color: cat.color }]}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Category header */}
      <View style={[styles.categoryHeader, { backgroundColor: activeCat.bg, borderColor: activeCat.color + "33" }]}>
        <Feather name={activeCat.icon as any} size={18} color={activeCat.color} />
        <Text style={[styles.categoryTitle, { color: activeCat.color }]}>{activeCat.label}</Text>
        <View style={[styles.countBadge, { backgroundColor: activeCat.color }]}>
          <Text style={styles.countBadgeText}>{counts[activeCategory]}</Text>
        </View>
      </View>

      {/* Consultation list for active category */}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={activeCat.color} />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
        ]}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: activeCat.bg }]}>
              <Feather name={activeCat.icon as any} size={32} color={activeCat.color} />
            </View>
            <Text style={styles.emptyTitle}>No {activeCat.label.toLowerCase()} cases</Text>
            <Text style={styles.emptySubtitle}>
              {activeCategory === "approved"
                ? "Approved consultations will appear here"
                : activeCategory === "rejected"
                ? "Rejected consultations will appear here"
                : activeCategory === "more_info_needed"
                ? "Cases awaiting more info will appear here"
                : "Referred cases will appear here"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
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
              <View style={[styles.colorBar, { backgroundColor: activeCat.color }]} />
              <View style={[styles.avatar, { backgroundColor: activeCat.color }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.patientName} numberOfLines={1}>{item.patientName}</Text>
                  <Text style={styles.timeAgo}>{reviewTime}</Text>
                </View>
                <Text style={styles.conditionName} numberOfLines={1}>{item.conditionName}</Text>
                <View style={styles.cardBottom}>
                  {item.prescription && (
                    <View style={[styles.pill, { backgroundColor: "#F0FDF4", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }]}>
                      <Feather name="package" size={10} color="#16A34A" />
                      <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "600" }}>Prescribed</Text>
                    </View>
                  )}
                  {item.pharmacistNote && (
                    <View style={[styles.pill, { backgroundColor: "#EFF6FF", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }]}>
                      <Feather name="file-text" size={10} color="#2563EB" />
                      <Text style={{ fontSize: 10, color: "#2563EB", fontWeight: "600" }}>Note</Text>
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

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14 },
    statsBar: { flexDirection: "row", gap: 8, padding: 14, paddingBottom: 10 },
    statCard: {
      flex: 1, borderRadius: 14, padding: 10, alignItems: "center",
      borderWidth: 2, borderColor: "transparent",
    },
    statCardActive: { borderColor: "rgba(0,0,0,0.12)", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
    statCount: { fontSize: 22, fontWeight: "800" as const, marginTop: 4 },
    statLabel: { fontSize: 9, fontWeight: "700" as const, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
    categoryHeader: {
      flexDirection: "row", alignItems: "center", gap: 10,
      marginHorizontal: 14, marginBottom: 10,
      paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: 14, borderWidth: 1,
    },
    categoryTitle: { fontSize: 16, fontWeight: "700" as const, flex: 1 },
    countBadge: { borderRadius: 20, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
    countBadgeText: { color: "#fff", fontSize: 13, fontWeight: "800" as const },
    listContent: { paddingHorizontal: 14 },
    card: {
      flexDirection: "row", backgroundColor: colors.card, borderRadius: 16,
      marginBottom: 10, borderWidth: 1, borderColor: colors.border,
      alignItems: "center", overflow: "hidden",
    },
    cardPressed: { opacity: 0.78 },
    colorBar: { width: 4, alignSelf: "stretch" },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 12, marginRight: 10, flexShrink: 0 },
    avatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 16 },
    cardBody: { flex: 1, paddingVertical: 12, paddingRight: 12 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    patientName: { fontSize: 14, fontWeight: "700" as const, color: colors.secondary, flex: 1 },
    timeAgo: { fontSize: 10, color: colors.mutedForeground, marginLeft: 4 },
    conditionName: { fontSize: 12, color: colors.mutedForeground, marginTop: 2, marginBottom: 7 },
    cardBottom: { flexDirection: "row", alignItems: "center", gap: 5 },
    pill: {},
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary, marginTop: 4 },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
  });
}

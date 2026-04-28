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

type FilterKey = "all" | "urgent" | "approval" | "system";

interface Notification {
  id: string;
  kind: "urgent" | "approval" | "system" | "new";
  icon: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
  href?: string;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "urgent", label: "Urgent" },
  { key: "approval", label: "Approvals" },
  { key: "system", label: "System" },
];

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { limit: 100 },
    { query: { refetchInterval: 30000 } as never },
  );

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];
    for (const c of data?.consultations ?? []) {
      if (c.status === "red_flag") {
        items.push({
          id: `urgent-${c.id}`,
          kind: "urgent",
          icon: "alert-triangle",
          title: `URGENT: ${c.patientName}`,
          body: `Red-flag flagged for ${c.conditionName}. Tap to review immediately.`,
          at: c.createdAt,
          unread: !readIds.has(`urgent-${c.id}`),
          href: `/consultation/${c.id}`,
        });
      } else if (c.status === "pending") {
        items.push({
          id: `new-${c.id}`,
          kind: "new",
          icon: "file-plus",
          title: `New consultation from ${c.patientName}`,
          body: `${c.conditionName} · awaiting clinical review.`,
          at: c.createdAt,
          unread: !readIds.has(`new-${c.id}`),
          href: `/consultation/${c.id}`,
        });
      } else if (c.status === "approved" && c.reviewedAt) {
        items.push({
          id: `approved-${c.id}`,
          kind: "approval",
          icon: "check-circle",
          title: `Approved: ${c.patientName}`,
          body: `Treatment approved for ${c.conditionName}. Order created.`,
          at: c.reviewedAt,
          unread: !readIds.has(`approved-${c.id}`),
          href: `/consultation/${c.id}`,
        });
      }
    }
    items.push({
      id: "system-mhra-2026",
      kind: "system",
      icon: "shield",
      title: "MHRA: Mounjaro safety bulletin",
      body: "Updated injection-site guidance issued. Click to view briefing.",
      at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      unread: !readIds.has("system-mhra-2026"),
    });
    items.push({
      id: "system-rota",
      kind: "system",
      icon: "calendar",
      title: "Your shift starts at 09:00",
      body: "Wednesday rota: pharmacist on-call until 18:00.",
      at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      unread: !readIds.has("system-rota"),
    });
    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return items;
  }, [data, readIds]);

  const counts = useMemo(() => {
    const total = notifications.filter(n => n.unread).length;
    const urgent = notifications.filter(n => n.kind === "urgent" && n.unread).length;
    const approval = notifications.filter(n => n.kind === "approval" && n.unread).length;
    const system = notifications.filter(n => n.kind === "system" && n.unread).length;
    return { total, urgent, approval, system };
  }, [notifications]);

  const filtered = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "urgent") return n.kind === "urgent";
    if (filter === "approval") return n.kind === "approval" || n.kind === "new";
    return n.kind === "system";
  });

  function markAllRead() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReadIds(new Set(notifications.map(n => n.id)));
  }

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading inbox…</Text>
      </View>
    );
  }

  const Header = (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>
            {counts.total === 0 ? "All caught up" : `${counts.total} unread`}
          </Text>
          <Text style={styles.summarySubtitle}>
            {counts.urgent > 0
              ? `${counts.urgent} urgent need attention`
              : "No urgent items right now"}
          </Text>
        </View>
        {counts.total > 0 && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn} testID="btn-mark-all-read">
            <Feather name="check" size={14} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const count =
            f.key === "all" ? counts.total :
            f.key === "urgent" ? counts.urgent :
            f.key === "approval" ? counts.approval : counts.system;
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f.key);
              }}
              style={[
                styles.filterPill,
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
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
        keyExtractor={n => n.id}
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
              <Feather name="bell-off" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here</Text>
            <Text style={styles.emptySubtitle}>You're all caught up in this view.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const tint =
            item.kind === "urgent" ? "#EF4444" :
            item.kind === "approval" ? "#16A34A" :
            item.kind === "new" ? "#0E7490" : colors.primary;
          const tintBg =
            item.kind === "urgent" ? "#FFF1F2" :
            item.kind === "approval" ? "#F0FDF4" :
            item.kind === "new" ? "#ECFEFF" : colors.muted;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.78 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setReadIds(prev => {
                  const next = new Set(prev);
                  next.add(item.id);
                  return next;
                });
                if (item.href) router.push(item.href as never);
              }}
              testID={`notification-${item.id}`}
            >
              <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
                <Feather name={item.icon as any} size={18} color={tint} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={[styles.title, !item.unread && { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.timeAgo}>
                  {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                </Text>
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
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    summaryTitle: { fontSize: 18, fontWeight: "800" as const, color: colors.secondary },
    summarySubtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    markAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.muted,
    },
    markAllText: { fontSize: 12, fontWeight: "700" as const, color: colors.primary },
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
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
    title: { fontSize: 14, fontWeight: "700" as const, color: colors.secondary, flex: 1 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0E7490" },
    body: { fontSize: 12, color: colors.mutedForeground, marginTop: 3, lineHeight: 17 },
    timeAgo: { fontSize: 10, color: colors.mutedForeground, marginTop: 6 },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary, marginTop: 4 },
    emptySubtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
  });
}

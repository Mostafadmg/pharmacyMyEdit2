import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListConsultations } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { formatDistanceToNow } from "date-fns";
import { getCurrentToken } from "@/context/AuthContext";

interface PatientRow {
  email: string;
  name: string;
  totalConsults: number;
  pending: number;
  redFlags: number;
  approved: number;
  lastConsultAt: string;
  conditions: string[];
}

interface UnreadInfo {
  consultationId: string;
  lastMsgAt: string | null;
}

interface UnreadThreadResp {
  id: string;
  patientEmail: string;
  unreadCount: number;
  lastMsgAt: string | null;
  lastMsgRole: string | null;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export default function PatientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { limit: 200 },
    { query: { refetchInterval: 30000 } as never },
  );

  const [unreadByEmail, setUnreadByEmail] = useState<Map<string, UnreadInfo>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const token = getCurrentToken();
      const res = await fetch(`${BASE_URL}/api/pharmacist/message-threads`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = (await res.json()) as { threads: UnreadThreadResp[] };
      const map = new Map<string, UnreadInfo>();
      for (const t of json.threads ?? []) {
        if (Number(t.unreadCount) <= 0) continue;
        if (t.lastMsgRole !== "patient") continue;
        const key = t.patientEmail.toLowerCase();
        const prev = map.get(key);
        const prevTs = prev?.lastMsgAt ? new Date(prev.lastMsgAt).getTime() : 0;
        const curTs = t.lastMsgAt ? new Date(t.lastMsgAt).getTime() : 0;
        if (!prev || curTs >= prevTs) {
          map.set(key, { consultationId: t.id, lastMsgAt: t.lastMsgAt });
        }
      }
      setUnreadByEmail(map);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadThreads();
    intervalRef.current = setInterval(loadThreads, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadThreads]);

  const patients = useMemo<PatientRow[]>(() => {
    const map = new Map<string, PatientRow>();
    for (const c of data?.consultations ?? []) {
      const key = c.patientEmail.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.totalConsults += 1;
        if (c.status === "pending") existing.pending += 1;
        if (c.status === "red_flag") existing.redFlags += 1;
        if (c.status === "approved") existing.approved += 1;
        if (new Date(c.createdAt) > new Date(existing.lastConsultAt)) {
          existing.lastConsultAt = c.createdAt;
        }
        if (!existing.conditions.includes(c.conditionName)) {
          existing.conditions.push(c.conditionName);
        }
      } else {
        map.set(key, {
          email: c.patientEmail,
          name: c.patientName,
          totalConsults: 1,
          pending: c.status === "pending" ? 1 : 0,
          redFlags: c.status === "red_flag" ? 1 : 0,
          approved: c.status === "approved" ? 1 : 0,
          lastConsultAt: c.createdAt,
          conditions: [c.conditionName],
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastConsultAt).getTime() - new Date(a.lastConsultAt).getTime(),
    );
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.conditions.some(c => c.toLowerCase().includes(q)),
    );
  }, [patients, search]);

  const totalPatients = patients.length;
  const repeatPatients = patients.filter(p => p.totalConsults > 1).length;
  const redFlagPatients = patients.filter(p => p.redFlags > 0).length;

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading patients…</Text>
      </View>
    );
  }

  const Header = (
    <View>
      <View style={styles.statsRow}>
        <StatPill icon="users" value={totalPatients} label="Patients" color={colors.primary} bg={colors.primary + "14"} />
        <StatPill icon="repeat" value={repeatPatients} label="Repeat" color="#0E7490" bg="#0E749014" />
        <StatPill icon="alert-triangle" value={redFlagPatients} label="Flagged" color={colors.urgent} bg={colors.urgent + "14"} />
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email or condition"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          testID="input-patient-search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={10}>
            <Feather name="x-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <FlatList
        data={filtered}
        keyExtractor={p => p.email}
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
              <Feather name="users" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptySubtitle}>
              {search ? "Try a different search term" : "Patients appear here once they submit a consultation"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const initials = item.name
            .split(" ")
            .map((w: string) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const isFlagged = item.redFlags > 0;
          const unread = unreadByEmail.get(item.email.toLowerCase());
          const hasReplied = !!unread;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isFlagged && { borderColor: colors.urgent + "66" },
                hasReplied && !isFlagged && { borderColor: "#F9731666", backgroundColor: "#F9731614" },
                pressed && { opacity: 0.78 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (unread) {
                  router.push(`/messages/${unread.consultationId}` as never);
                } else {
                  router.push(`/patient/${encodeURIComponent(item.email)}`);
                }
              }}
              testID={`patient-row-${item.email}`}
            >
              <View style={[styles.avatar, { backgroundColor: isFlagged ? colors.urgent : colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {unread && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/messages/${unread.consultationId}` as never);
                      }}
                      hitSlop={6}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                          backgroundColor: "#F9731622",
                          borderRadius: 8,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginLeft: 4,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                      testID={`badge-replied-${item.email}`}
                    >
                      <Feather name="corner-down-left" size={10} color="#F97316" />
                      <Text style={{ fontSize: 9, color: "#F97316", fontWeight: "800" as const }}>
                        REPLIED
                      </Text>
                    </Pressable>
                  )}
                  <Text style={styles.timeAgo}>
                    {formatDistanceToNow(new Date(item.lastConsultAt), { addSuffix: true })}
                  </Text>
                </View>
                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                <View style={styles.tagRow}>
                  {item.conditions.slice(0, 2).map(cn => (
                    <View key={cn} style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>{cn}</Text>
                    </View>
                  ))}
                  {item.conditions.length > 2 && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>+{item.conditions.length - 2}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.metricRow}>
                  <Metric icon="file-text" value={item.totalConsults} label="total" colors={colors} />
                  {item.pending > 0 && (
                    <Metric icon="clock" value={item.pending} label="pending" color="#D97706" colors={colors} />
                  )}
                  {item.redFlags > 0 && (
                    <Metric icon="flag" value={item.redFlags} label="flag" color="#EF4444" colors={colors} />
                  )}
                  {item.approved > 0 && (
                    <Metric icon="check" value={item.approved} label="ok" color="#16A34A" colors={colors} />
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function StatPill({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 10, alignItems: "center" }}>
      <Feather name={icon as any} size={14} color={color} />
      <Text style={{ fontSize: 20, fontWeight: "800" as const, color, marginTop: 3 }}>{value}</Text>
      <Text
        style={{
          fontSize: 9,
          color,
          marginTop: 1,
          fontWeight: "600" as const,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function Metric({
  icon,
  value,
  label,
  color,
  colors,
}: {
  icon: string;
  value: number;
  label: string;
  color?: string;
  colors: ReturnType<typeof useColors>;
}) {
  const c = color ?? colors.mutedForeground;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <Feather name={icon as any} size={10} color={c} />
      <Text style={{ fontSize: 10, color: c, fontWeight: "700" as const }}>
        {value} {label}
      </Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    loadingText: { marginTop: 12, color: colors.mutedForeground, fontSize: 14 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 14,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.secondary, paddingVertical: 0 },
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
      padding: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#fff", fontWeight: "800" as const, fontSize: 16 },
    rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    name: { fontSize: 14, fontWeight: "700" as const, color: colors.secondary, flex: 1 },
    timeAgo: { fontSize: 10, color: colors.mutedForeground, marginLeft: 4 },
    email: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
    tagRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
    tag: {
      backgroundColor: colors.muted,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      maxWidth: 140,
    },
    tagText: { fontSize: 10, color: colors.secondary, fontWeight: "600" as const },
    metricRow: { flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" },
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

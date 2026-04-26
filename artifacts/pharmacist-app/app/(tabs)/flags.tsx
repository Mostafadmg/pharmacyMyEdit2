import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { useListConsultations } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { formatDistanceToNow } from "date-fns";

export default function FlagsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useListConsultations(
    { status: "red_flag" },
    { query: { refetchInterval: 30000 } }
  );

  const consultations = data?.consultations ?? [];

  const styles = makeStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.urgent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
      <FlatList
        data={consultations}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.urgent} />}
        scrollEnabled={consultations.length > 0}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
        ]}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Feather name="check-circle" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>No urgent cases</Text>
            <Text style={styles.emptySubtitle}>All red flag consultations have been reviewed</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.alertBanner}>
            <Feather name="alert-triangle" size={16} color="#fff" />
            <Text style={styles.alertText}>  Urgent consultations requiring immediate clinical review</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, styles.urgentCard, pressed && styles.cardPressed]}
            onPress={() => router.push(`/consultation/${item.id}`)}
            testID={`btn-flag-${item.id}`}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.avatar, styles.urgentAvatar]}>
                <Text style={styles.avatarText}>{item.patientName.charAt(0)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.patientName}>{item.patientName}</Text>
                <Text style={styles.conditionName}>{item.conditionName}</Text>
                <Text style={styles.timeText}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginTop: 8 }} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center" },
    listContent: { padding: 16, gap: 0 },
    alertBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.urgent,
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
    },
    alertText: { color: "#fff", fontSize: 13, fontWeight: "600" as const, flex: 1 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    urgentCard: {
      borderColor: "#FCA5A5",
      backgroundColor: "#FFF1F2",
    },
    cardPressed: { opacity: 0.75 },
    cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    urgentAvatar: { backgroundColor: colors.urgent },
    avatarText: { color: "#fff", fontWeight: "700" as const, fontSize: 18 },
    cardInfo: { flex: 1 },
    patientName: { fontSize: 15, fontWeight: "700" as const, color: colors.secondary },
    conditionName: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
    timeText: { fontSize: 12, color: colors.urgent, marginTop: 4, fontWeight: "600" as const },
    cardRight: { alignItems: "flex-end" },
    urgentBadge: {
      backgroundColor: colors.urgent,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    urgentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" as const, letterSpacing: 0.5 },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: colors.secondary, marginTop: 8 },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
  });
}

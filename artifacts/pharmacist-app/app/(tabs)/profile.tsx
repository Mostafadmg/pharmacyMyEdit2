import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pharmacistName, role, logout } = useAuth();
  const { data: stats } = useGetDashboardStats();
  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const styles = makeStyles(colors);

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  }

  const initials = (pharmacistName ?? "PH")
    .split(" ")
    .map(n => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{pharmacistName ?? "Pharmacist"}</Text>
        <Text style={styles.role}>{role ?? "Pharmacist Prescriber (GPhC)"}</Text>
        <View style={styles.badge}>
          <Feather name="shield" size={12} color={colors.primary} />
          <Text style={styles.badgeText}>  GPhC Registered</Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <StatCard label="Total Reviews" value={stats.totalConsultations} icon="file-text" color={colors.secondary} colors={colors} />
          <StatCard label="Approved Today" value={stats.approvedToday} icon="check-circle" color={colors.success} colors={colors} />
          <StatCard label="Pending" value={stats.pendingReview} icon="clock" color={colors.warning} colors={colors} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Session</Text>
        <View style={styles.card}>
          <MenuItem icon="activity" label="Consultation Queue" sublabel="View all pending reviews" colors={colors} />
          <View style={styles.divider} />
          <MenuItem icon="alert-triangle" label="Red Flag Cases" sublabel="Urgent consultations" colors={colors} isUrgent />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <InfoRow icon="shield" label="Regulation" value="GPhC Regulated Pharmacy" colors={colors} />
          <View style={styles.divider} />
          <InfoRow icon="lock" label="Security" value="Encrypted end-to-end" colors={colors} />
          <View style={styles.divider} />
          <InfoRow icon="info" label="Version" value="PharmaCare v1.0" colors={colors} />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
        onPress={handleLogout}
        testID="btn-logout"
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color, colors }: { label: string; value: number; icon: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }]}>
      <Feather name={icon as any} size={20} color={color} />
      <Text style={{ fontSize: 24, fontWeight: "800" as const, color: color, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: "center", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, sublabel, colors, isUrgent }: { icon: string; label: string; sublabel: string; colors: ReturnType<typeof useColors>; isUrgent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
      <Feather name={icon as any} size={18} color={isUrgent ? colors.urgent : colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "600" as const, color: isUrgent ? colors.urgent : colors.secondary }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>{sublabel}</Text>
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      <Text style={{ flex: 1, fontSize: 14, color: colors.secondary, marginLeft: 12 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 0 },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" as const },
    name: { fontSize: 20, fontWeight: "700" as const, color: colors.secondary },
    role: { fontSize: 13, color: colors.mutedForeground, marginTop: 4, textAlign: "center" },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      backgroundColor: colors.muted,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    badgeText: { fontSize: 12, color: colors.primary, fontWeight: "600" as const },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    section: { marginBottom: 16 },
    sectionLabel: { fontSize: 12, fontWeight: "700" as const, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
    card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      backgroundColor: "#FFF1F2",
      borderRadius: 14,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: "#FCA5A5",
    },
    logoutBtnPressed: { opacity: 0.7 },
    logoutText: { fontSize: 16, fontWeight: "700" as const, color: colors.destructive },
  });
}

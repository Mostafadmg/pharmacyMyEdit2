import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetDashboardStats, useListConsultations } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pharmacistName, role, logout } = useAuth();
  const { data: stats } = useGetDashboardStats();
  const { data: consultData } = useListConsultations({ limit: 200 });

  const [pushEnabled, setPushEnabled] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [themeOverride, setThemeOverride] = useState<"system" | "light" | "dark">("system");

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

  function tapBiometric() {
    Haptics.selectionAsync();
    if (!biometricEnabled) {
      Alert.alert(
        "Enable Biometric Sign-In",
        "Use Face ID / Touch ID to sign in faster on this device. You'll still need to enter your password if biometrics fail.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Enable",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setBiometricEnabled(true);
            },
          },
        ],
      );
    } else {
      setBiometricEnabled(false);
    }
  }

  const initials = (pharmacistName ?? "PH")
    .split(" ")
    .map(n => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Build a 7-day approval sparkline from consultations
  const reviewedSpark = (() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d.getTime();
    });
    const counts = days.map(start => {
      const end = start + 24 * 60 * 60 * 1000;
      return (consultData?.consultations ?? []).filter(c => {
        if (!c.reviewedAt) return false;
        const t = new Date(c.reviewedAt).getTime();
        return t >= start && t < end;
      }).length;
    });
    return counts;
  })();

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
        <Text style={styles.sectionLabel}>This Week</Text>
        <View style={[styles.card, { padding: 16 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: "600" as const }}>Approvals · 7 days</Text>
              <Text style={{ fontSize: 28, fontWeight: "800" as const, color: colors.secondary, marginTop: 2 }}>
                {reviewedSpark.reduce((a, b) => a + b, 0)}
              </Text>
            </View>
            <View style={{ backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="trending-up" size={12} color="#16A34A" />
              <Text style={{ fontSize: 11, fontWeight: "700" as const, color: "#16A34A" }}>active</Text>
            </View>
          </View>
          <Sparkline values={reviewedSpark} color={colors.primary} bg={colors.muted} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <Text key={i} style={{ fontSize: 10, color: colors.mutedForeground, width: 18, textAlign: "center" }}>{d}</Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="bell"
            label="Push notifications"
            sublabel="Receive alerts on this device"
            value={pushEnabled}
            onValueChange={v => { Haptics.selectionAsync(); setPushEnabled(v); }}
            colors={colors}
            testID="toggle-push"
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="alert-triangle"
            label="Urgent flag alerts"
            sublabel="Immediate ping for red-flag patients"
            value={urgentAlerts && pushEnabled}
            disabled={!pushEnabled}
            onValueChange={v => { Haptics.selectionAsync(); setUrgentAlerts(v); }}
            colors={colors}
            testID="toggle-urgent"
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="package"
            label="Order status updates"
            sublabel="Dispensary & delivery events"
            value={orderUpdates && pushEnabled}
            disabled={!pushEnabled}
            onValueChange={v => { Haptics.selectionAsync(); setOrderUpdates(v); }}
            colors={colors}
            testID="toggle-orders"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Security</Text>
        <View style={styles.card}>
          <Pressable onPress={tapBiometric} style={{ flexDirection: "row", alignItems: "center", padding: 14 }} testID="row-biometric">
            <Feather name="lock" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "600" as const, color: colors.secondary }}>Face ID / Touch ID</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>
                {biometricEnabled ? "Enabled · sign in with biometrics" : "Sign in faster with biometrics"}
              </Text>
            </View>
            <Switch value={biometricEnabled} onValueChange={tapBiometric} trackColor={{ false: colors.border, true: colors.primary }} />
          </Pressable>
          <View style={styles.divider} />
          <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
            <Feather name="shield" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "600" as const, color: colors.secondary }}>Two-factor authentication</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>SMS to ending ••12 · contact admin to change</Text>
            </View>
            <View style={{ backgroundColor: "#F0FDF4", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: "700" as const, color: "#16A34A" }}>ON</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={[styles.card, { padding: 12 }]}>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 10, marginLeft: 4 }}>
            App theme follows your device by default.
          </Text>
          <View style={styles.themeRow}>
            {(["system", "light", "dark"] as const).map(opt => {
              const active = themeOverride === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => { Haptics.selectionAsync(); setThemeOverride(opt); }}
                  style={[
                    styles.themeChip,
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  testID={`theme-${opt}`}
                >
                  <Feather
                    name={opt === "system" ? "smartphone" : opt === "light" ? "sun" : "moon"}
                    size={14}
                    color={active ? "#fff" : colors.secondary}
                  />
                  <Text style={[styles.themeChipText, active && { color: "#fff" }]}>
                    {opt[0].toUpperCase() + opt.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Support & Contact</Text>
        <View style={styles.card}>
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
            <Feather name="phone" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "600" as const, color: colors.secondary }}>Clinical Support</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>0800 123 4567 · Mon–Fri 8am–8pm</Text>
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
            <Feather name="mail" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "600" as const, color: colors.secondary }}>Email Clinical Team</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>clinical@pharmacare.co.uk</Text>
            </View>
          </Pressable>
          <View style={styles.divider} />
          <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
            <Feather name="alert-triangle" size={18} color="#EF4444" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "600" as const, color: "#EF4444" }}>Medical Emergency</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>Call 999 · Urgent advice: NHS 111</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <InfoRow icon="shield" label="Regulation" value="GPhC Regulated Pharmacy" colors={colors} />
          <View style={styles.divider} />
          <InfoRow icon="lock" label="Security" value="Encrypted end-to-end" colors={colors} />
          <View style={styles.divider} />
          <InfoRow icon="info" label="Version" value="PharmaCare v1.1" colors={colors} />
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

function Sparkline({ values, color, bg }: { values: number[]; color: string; bg: string }) {
  const max = Math.max(1, ...values);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 56 }}>
      {values.map((v, i) => {
        const h = Math.max(4, (v / max) * 56);
        const isToday = i === values.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ width: "100%", height: h, backgroundColor: isToday ? color : bg, borderRadius: 4 }} />
          </View>
        );
      })}
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  disabled,
  colors,
  testID,
}: {
  icon: string;
  label: string;
  sublabel: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
  testID?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: 14, opacity: disabled ? 0.55 : 1 }} testID={testID}>
      <Feather name={icon as any} size={18} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "600" as const, color: colors.secondary }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </View>
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
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
    themeRow: { flexDirection: "row", gap: 8 },
    themeChip: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    themeChipText: { fontSize: 12, fontWeight: "700" as const, color: colors.secondary },
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

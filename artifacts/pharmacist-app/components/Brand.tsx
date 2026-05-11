import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleSheet, Text, useColorScheme, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isLiquidGlassAvailable } from "expo-glass-effect";

import { useColors } from "@/hooks/useColors";

export const FONT = {
  body: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemibold: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
  display: "PlusJakartaSans_700Bold",
  displayExtra: "PlusJakartaSans_800ExtraBold",
  serifItalic: "Fraunces_400Regular_Italic",
  serif: "Fraunces_600SemiBold",
  serifBold: "Fraunces_700Bold",
};

export function useBrandTopPad() {
  const insets = useSafeAreaInsets();
  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  if (Platform.OS === "web") return 0;
  return nativeTabs ? insets.top + 4 : insets.top;
}

/**
 * Status tint helper — returns { fg, bg } pair that reads in both schemes.
 * In light mode bg is the soft pastel (#FEF3C7 etc); in dark mode bg becomes a
 * translucent tint of the foreground so the same component looks intentional
 * on a navy background instead of bright pastel patches.
 */
export function useTint() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (fg: string, lightBg: string): { fg: string; bg: string; border: string } => {
    if (!isDark) return { fg, bg: lightBg, border: fg + "26" };
    return { fg, bg: fg + "1F", border: fg + "33" };
  };
}

/**
 * Soft elevation that works on iOS shadows, Android elevation and web box-shadow.
 */
export const softShadow = Platform.select({
  ios: {
    shadowColor: "#0E2354",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 2 },
  default: { boxShadow: "0 6px 16px rgba(14, 35, 84, 0.08)" } as object,
}) as ViewStyle;

export function PharmaCareLogo({ size = 28, monochrome = false }: { size?: number; monochrome?: boolean }) {
  const colors = useColors();
  const ringBg = monochrome ? "rgba(255,255,255,0.18)" : colors.primary;
  const wordColor = monochrome ? "#FFFFFF" : colors.secondary;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ringBg,
          alignItems: "center",
          justifyContent: "center",
          ...(monochrome
            ? { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.4)" }
            : null),
        }}
      >
        <Feather name="plus" size={size * 0.62} color="#FFFFFF" />
      </View>
      <Text
        style={{
          fontSize: size * 0.66,
          color: wordColor,
          letterSpacing: -0.4,
        }}
      >
        <Text style={{ fontFamily: FONT.displayExtra }}>Pharma</Text>
        <Text style={{ fontFamily: FONT.bodyMedium, color: wordColor, opacity: 0.78 }}>Care</Text>
      </Text>
    </View>
  );
}

interface BrandHeaderProps {
  title: string;
  subtitle?: string;
  accent?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function BrandHeader({ title, subtitle, accent, right, style }: BrandHeaderProps) {
  const colors = useColors();
  const topPad = useBrandTopPad();
  return (
    <View
      style={[
        {
          paddingTop: topPad + 12,
          paddingBottom: 14,
          paddingHorizontal: 18,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <PharmaCareLogo size={26} />
        {right}
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" }}>
        <Text style={{ fontFamily: FONT.displayExtra, fontSize: 26, color: colors.secondary, letterSpacing: -0.6 }}>
          {title}
        </Text>
        {accent ? (
          <Text
            style={{
              fontFamily: FONT.serifItalic,
              fontStyle: "italic",
              fontSize: 24,
              color: colors.primary,
              marginLeft: 6,
              letterSpacing: -0.2,
            }}
          >
            {accent}
          </Text>
        ) : null}
      </View>
      {subtitle ? (
        <Text style={{ fontFamily: FONT.body, fontSize: 13, color: colors.mutedForeground, marginTop: 4, lineHeight: 18 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Premium teal→navy gradient hero used for screen "hero" panels. Contents
 * render on top in white. Includes a subtle inner highlight so it doesn't
 * read as a flat dark slab.
 */
export function GradientHero({
  children,
  style,
  variant = "brand",
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "brand" | "danger" | "success";
}) {
  const palette = (() => {
    if (variant === "danger") return ["#7F1D1D", "#B91C1C", "#DC2626"] as const;
    if (variant === "success") return ["#064E3B", "#0F766E", "#0E7C73"] as const;
    return ["#0F2A52", "#103E70", "#157E79"] as const;
  })();
  return (
    <LinearGradient
      colors={palette}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: 20, overflow: "hidden" }, style]}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: 120,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -60,
          left: -30,
          width: 220,
          height: 220,
          borderRadius: 140,
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      />
      {children}
    </LinearGradient>
  );
}

/** Section label — small uppercase Plus Jakarta caption used above cards. */
export function SectionLabel({
  icon,
  children,
  right,
}: {
  icon?: keyof typeof Feather.glyphMap;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon ? <Feather name={icon} size={12} color={colors.mutedForeground} /> : null}
        <Text
          style={{
            fontFamily: FONT.bodyBold,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: colors.mutedForeground,
          }}
        >
          {children}
        </Text>
      </View>
      {right}
    </View>
  );
}

/** Elevated card surface — replaces ad-hoc backgroundColor:#fff cards. */
export function GlassCard({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? 16 : 0,
        },
        softShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface StatTileProps {
  icon: keyof typeof Feather.glyphMap;
  value: number | string;
  label: string;
  tint: string;
  tintBg: string;
}

export function StatTile({ icon, value, label, tint, tintBg }: StatTileProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const chipBg = isDark ? tint + "26" : tintBg;
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: colors.card, borderColor: colors.border },
        softShadow,
      ]}
    >
      <View style={[styles.statIconChip, { backgroundColor: chipBg }]}>
        <Feather name={icon} size={14} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: colors.secondary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statTile: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 6,
  },
  statIconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: FONT.displayExtra,
    fontSize: 22,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  statLabel: {
    fontFamily: FONT.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});

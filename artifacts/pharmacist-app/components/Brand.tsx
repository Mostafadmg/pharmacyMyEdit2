import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View, ViewStyle } from "react-native";
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
  serifItalic: Platform.select({
    ios: "Georgia-Italic",
    android: "serif",
    default: "Georgia, serif",
  }) as string,
};

export function useBrandTopPad() {
  const insets = useSafeAreaInsets();
  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  if (Platform.OS === "web") return 0;
  return nativeTabs ? insets.top + 4 : insets.top;
}

export function PharmaCareLogo({ size = 28 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="plus" size={size * 0.62} color="#FFFFFF" />
      </View>
      <Text
        style={{
          fontSize: size * 0.66,
          color: colors.secondary,
          letterSpacing: -0.4,
        }}
      >
        <Text style={{ fontFamily: FONT.displayExtra }}>Pharma</Text>
        <Text style={{ fontFamily: FONT.bodyMedium, color: colors.secondary, opacity: 0.78 }}>Care</Text>
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

interface StatTileProps {
  icon: keyof typeof Feather.glyphMap;
  value: number | string;
  label: string;
  tint: string;
  tintBg: string;
}

export function StatTile({ icon, value, label, tint, tintBg }: StatTileProps) {
  const colors = useColors();
  return (
    <View style={[styles.statTile, { borderColor: colors.border }]}>
      <View style={[styles.statIconChip, { backgroundColor: tintBg }]}>
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#0E2354",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 1 },
      default: { boxShadow: "0 4px 10px rgba(14, 35, 84, 0.06)" } as object,
    }),
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

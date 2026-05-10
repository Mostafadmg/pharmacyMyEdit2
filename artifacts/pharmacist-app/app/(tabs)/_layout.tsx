import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";
import { getCurrentToken } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

interface UnreadBadgeCounts {
  unreadMessages: number;
  patientResponded: number;
}

/**
 * Polls the dedicated `/api/pharmacist/unread-counts` endpoint every 30s and
 * returns counts for both the Inbox tab (unread patient messages) and the
 * Pending tab (consultations now in `patient_responded` after a reply).
 */
function useUnreadBadgeCounts(): UnreadBadgeCounts {
  const [counts, setCounts] = useState<UnreadBadgeCounts>({
    unreadMessages: 0,
    patientResponded: 0,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const token = getCurrentToken();
      if (!token) return;
      const res = await fetch(`${BASE_URL}/api/pharmacist/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as Partial<UnreadBadgeCounts>;
      setCounts({
        unreadMessages: Number(json.unreadMessages ?? 0),
        patientResponded: Number(json.patientResponded ?? 0),
      });
    } catch {
      // ignore network errors — badge just stays at last known value
    }
  }, []);

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  return counts;
}

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  const { unreadMessages, patientResponded } = useUnreadBadgeCounts();
  return (
    <NativeTabs>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <NativeTabs.Trigger name="index" {...(patientResponded > 0 ? { badge: patientResponded } as any : {})}>
        <Icon sf={{ default: "clock", selected: "clock.fill" }} />
        <Label>Pending</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="flags">
        <Icon sf={{ default: "checkmark.circle", selected: "checkmark.circle.fill" }} />
        <Label>Reviewed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="patients">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Patients</Label>
      </NativeTabs.Trigger>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <NativeTabs.Trigger name="inbox" {...(unreadMessages > 0 ? { badge: unreadMessages } as any : {})}>
        <Icon sf={{ default: "message.badge", selected: "message.badge.fill" }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
        <Label>Orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { unreadMessages, patientResponded } = useUnreadBadgeCounts();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#0E2354",
        headerTitleStyle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: "#0E2354" },
        tabBarLabelStyle: { fontSize: 10, fontFamily: "PlusJakartaSans_600SemiBold" },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Pending",
          headerShown: false,
          tabBarBadge: patientResponded > 0 ? patientResponded : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="clock" tintColor={color} size={24} />
            ) : (
              <Feather name="clock" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="flags"
        options={{
          title: "Reviewed",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="checkmark.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="check-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2" tintColor={color} size={24} />
            ) : (
              <Feather name="users" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Messages",
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="message.badge" tintColor={color} size={24} />
            ) : (
              <Feather name="message-square" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="shippingbox" tintColor={color} size={24} />
            ) : (
              <Feather name="package" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

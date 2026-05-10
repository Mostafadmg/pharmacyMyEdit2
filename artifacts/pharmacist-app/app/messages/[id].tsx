import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetConsultation, getGetConsultationQueryKey } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import ConsultationChat from "@/components/ConsultationChat";

export default function MessagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: consultation, isLoading } = useGetConsultation(id ?? "", {
    query: { enabled: !!id, queryKey: getGetConsultationQueryKey(id ?? "") },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading || !consultation) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topPad, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.mutedForeground, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  const initials = consultation.patientName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topPad }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 4 }, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Feather name="chevron-left" size={22} color={colors.primary} />
        </Pressable>

        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.secondary }} numberOfLines={1}>
            {consultation.patientName}
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={1}>
            {consultation.conditionName}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push(`/consultation/${id}` as never)}
          style={({ pressed }) => [
            {
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: colors.muted,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>View consult</Text>
        </Pressable>
      </View>

      <ConsultationChat consultationId={id ?? ""} />
    </View>
  );
}

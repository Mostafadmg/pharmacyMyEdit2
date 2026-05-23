import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getCurrentToken } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:5000";
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPriceGbp: number;
}

interface DeliveryInfo {
  id: string;
  carrier: string | null;
  trackingNumber: string | null;
  status: string;
  estimatedDelivery: string | null;
}

interface ShippingAddress {
  line1?: string;
  line2?: string | null;
  city?: string;
  postcode?: string;
}

interface ShopOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalGbp: number;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  items: OrderItem[];
  delivery: DeliveryInfo | null;
}

const PRIMARY_TABS = [
  { key: "pending", label: "Pending", icon: "package", color: "#D97706" },
  { key: "shipped", label: "Shipped", icon: "truck", color: "#6366F1" },
  {
    key: "delivered",
    label: "Delivered",
    icon: "check-circle",
    color: "#10B981",
  },
] as const;

type PrimaryTabKey = (typeof PRIMARY_TABS)[number]["key"];

const PENDING_STAGES = new Set(["paid", "pending", "preparing"]);
const SHIPPED_STAGES = new Set(["shipped", "out_for_delivery"]);
const DELIVERED_STAGES = new Set(["delivered"]);

const TIMELINE_STEPS: { key: string; label: string; icon: string }[] = [
  { key: "preparing", label: "Preparing", icon: "package" },
  { key: "shipped", label: "Dispatched", icon: "truck" },
  { key: "out_for_delivery", label: "Out for delivery", icon: "navigation" },
  { key: "delivered", label: "Delivered", icon: "check-circle" },
];

const STAGE_ORDER: Record<string, number> = {
  // paid/pending → first step ("Preparing") so the timeline isn't empty for fresh orders
  paid: 1,
  pending: 1,
  preparing: 1,
  shipped: 2,
  out_for_delivery: 3,
  delivered: 4,
};

const STAGE_LABEL: Record<string, string> = {
  preparing: "Preparing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

const STAGE_COLOR: Record<string, string> = {
  paid: "#D97706",
  pending: "#D97706",
  preparing: "#0EA5E9",
  shipped: "#6366F1",
  out_for_delivery: "#F59E0B",
  delivered: "#10B981",
  cancelled: "#94A3B8",
};

const STAGE_LABEL_OVERRIDE: Record<string, string> = {
  paid: "New order",
  pending: "Pending",
};

const NEXT_STAGE: Record<
  string,
  { deliveryStatus: string; status: string; label: string } | null
> = {
  paid: {
    deliveryStatus: "preparing",
    status: "preparing",
    label: "Mark Preparing",
  },
  pending: {
    deliveryStatus: "preparing",
    status: "preparing",
    label: "Mark Preparing",
  },
  preparing: {
    deliveryStatus: "shipped",
    status: "shipped",
    label: "Mark Shipped",
  },
  shipped: {
    deliveryStatus: "out_for_delivery",
    status: "shipped",
    label: "Out for Delivery",
  },
  out_for_delivery: {
    deliveryStatus: "delivered",
    status: "delivered",
    label: "Mark Delivered",
  },
  delivered: null,
  cancelled: null,
};

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PrimaryTabKey>("pending");
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const apiBase = getApiBase();
    const token = getCurrentToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/orders?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setOrders(json.orders ?? []);
    } catch (e) {
      console.warn("Failed to fetch orders", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 20000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const advanceStage = useCallback(
    async (order: ShopOrder) => {
      const current = order.delivery?.status ?? order.status;
      const next = NEXT_STAGE[current];
      if (!next) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setAdvancingId(order.id);
      const apiBase = getApiBase();

      try {
        const token = getCurrentToken();
        const res = await fetch(
          `${apiBase}/api/admin/orders/${order.id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              status: next.status,
              deliveryStatus: next.deliveryStatus,
            }),
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await fetchOrders();
      } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Update failed",
          "Could not update the order. Please try again.",
        );
      } finally {
        setAdvancingId(null);
      }
    },
    [fetchOrders],
  );

  const stageOf = (o: ShopOrder) => o.delivery?.status ?? o.status;

  const inGroup = (o: ShopOrder, group: PrimaryTabKey) => {
    const s = stageOf(o);
    if (group === "pending") return PENDING_STAGES.has(s);
    if (group === "shipped") return SHIPPED_STAGES.has(s);
    if (group === "delivered") return DELIVERED_STAGES.has(s);
    return false;
  };

  const filtered = orders.filter((o) => inGroup(o, filter));
  const counts: Record<PrimaryTabKey, number> = {
    pending: orders.filter((o) => inGroup(o, "pending")).length,
    shipped: orders.filter((o) => inGroup(o, "shipped")).length,
    delivered: orders.filter((o) => inGroup(o, "delivered")).length,
  };

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const bottomPad =
    Platform.OS === "web" ? 100 : nativeTabs ? 100 : insets.bottom + 100;

  if (loading) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background }]}
        testID="orders-loading"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: topPad,
      }}
    >
      <View
        style={[
          styles.tabsBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {PRIMARY_TABS.map((t) => {
          const isActive = filter === t.key;
          const c = counts[t.key];
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(t.key);
              }}
              style={styles.tabBtn}
              testID={`tab-${t.key}`}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Feather
                  name={t.icon as any}
                  size={14}
                  color={isActive ? t.color : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? t.color : colors.mutedForeground },
                  ]}
                >
                  {t.label}
                </Text>
                {c > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      { backgroundColor: isActive ? t.color : colors.muted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: isActive ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {c}
                    </Text>
                  </View>
                )}
              </View>
              {isActive && (
                <View
                  style={[styles.tabIndicator, { backgroundColor: t.color }]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPad,
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty} testID="orders-empty">
            <Feather name="package" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No orders to fulfil
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const stage = item.delivery?.status ?? item.status;
          const stageColor = STAGE_COLOR[stage] ?? colors.mutedForeground;
          const stageLabel =
            STAGE_LABEL_OVERRIDE[stage] ?? STAGE_LABEL[stage] ?? stage;
          const next = NEXT_STAGE[stage];
          const isAdvancing = advancingId === item.id;
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              testID={`order-card-${item.orderNumber}`}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.orderNumber, { color: colors.foreground }]}
                  >
                    {item.orderNumber}
                  </Text>
                  <Text
                    style={[styles.subtle, { color: colors.mutedForeground }]}
                  >
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.stageBadge,
                    { backgroundColor: `${stageColor}20` },
                  ]}
                >
                  <Text style={[styles.stageText, { color: stageColor }]}>
                    {stageLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <Feather name="user" size={14} color={colors.mutedForeground} />
                <Text style={[styles.rowText, { color: colors.foreground }]}>
                  {item.customerName}
                  {item.shippingAddress?.city
                    ? ` · ${item.shippingAddress.city}`
                    : ""}
                </Text>
              </View>
              <View style={styles.row}>
                <Feather name="mail" size={14} color={colors.mutedForeground} />
                <Text
                  style={[styles.rowText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.customerEmail}
                </Text>
              </View>

              <View style={styles.itemList}>
                {item.items.map((it) => (
                  <Text
                    key={it.id}
                    style={[styles.itemLine, { color: colors.foreground }]}
                  >
                    {it.quantity}× {it.productName}
                  </Text>
                ))}
              </View>

              {/* Tracking timeline */}
              <TrackingTimeline stage={stage} colors={colors} />

              {item.delivery?.trackingNumber ? (
                <View
                  style={[
                    styles.trackingBox,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather name="truck" size={14} color={colors.foreground} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.trackingCarrier,
                        { color: colors.foreground },
                      ]}
                    >
                      {item.delivery.carrier ?? "Royal Mail"}
                    </Text>
                    <Text
                      style={[
                        styles.trackingNumber,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      Tracking: {item.delivery.trackingNumber}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={[styles.total, { color: colors.foreground }]}>
                  {formatGbp(item.totalGbp)}
                </Text>
                {next ? (
                  <Pressable
                    onPress={() => advanceStage(item)}
                    disabled={isAdvancing}
                    style={[
                      styles.advanceBtn,
                      {
                        backgroundColor: colors.primary,
                        opacity: isAdvancing ? 0.6 : 1,
                      },
                    ]}
                    testID={`advance-${item.orderNumber}`}
                  >
                    {isAdvancing ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.advanceText}>{next.label}</Text>
                        <Feather name="arrow-right" size={16} color="#FFFFFF" />
                      </>
                    )}
                  </Pressable>
                ) : (
                  <View
                    style={[
                      styles.doneBadge,
                      { backgroundColor: `${stageColor}20` },
                    ]}
                  >
                    <Feather name="check" size={14} color={stageColor} />
                    <Text style={[styles.doneText, { color: stageColor }]}>
                      {stage === "delivered" ? "Complete" : stageLabel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

function TrackingTimeline({
  stage,
  colors,
}: {
  stage: string;
  colors: ReturnType<typeof useColors>;
}) {
  const currentIndex = STAGE_ORDER[stage] ?? 0;
  return (
    <View style={timelineStyles.row}>
      {TIMELINE_STEPS.map((step, i) => {
        const reached = i + 1 <= currentIndex;
        const isCurrent = i + 1 === currentIndex;
        const dotColor = reached ? "#10B981" : colors.border;
        return (
          <React.Fragment key={step.key}>
            <View style={timelineStyles.stepWrap}>
              <View
                style={[
                  timelineStyles.dot,
                  {
                    backgroundColor: reached ? dotColor : colors.card,
                    borderColor: isCurrent
                      ? "#0EA5E9"
                      : reached
                        ? "#10B981"
                        : colors.border,
                    borderWidth: isCurrent ? 2 : 1.5,
                  },
                ]}
              >
                <Feather
                  name={step.icon as any}
                  size={10}
                  color={reached ? "#fff" : colors.mutedForeground}
                />
              </View>
              <Text
                style={[
                  timelineStyles.label,
                  {
                    color: reached ? colors.foreground : colors.mutedForeground,
                    fontWeight: isCurrent ? "700" : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {i < TIMELINE_STEPS.length - 1 && (
              <View
                style={[
                  timelineStyles.line,
                  {
                    backgroundColor:
                      i + 1 < currentIndex ? "#10B981" : colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stepWrap: { alignItems: "center", width: 64 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 9, marginTop: 4, textAlign: "center" },
  line: { flex: 1, height: 1.5, marginTop: 11, marginHorizontal: -8 },
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabsBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tabLabel: { fontSize: 13, fontWeight: "600" },
  tabBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: { fontSize: 10, fontWeight: "800" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 24,
    right: 24,
    height: 2.5,
    borderRadius: 2,
  },
  trackingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  trackingCarrier: { fontSize: 12, fontWeight: "700" },
  trackingNumber: { fontSize: 11, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  orderNumber: { fontSize: 16, fontWeight: "700" },
  subtle: { fontSize: 12, marginTop: 2 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  stageText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { fontSize: 13, flex: 1 },
  itemList: { gap: 2, paddingVertical: 4 },
  itemLine: { fontSize: 13 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  total: { fontSize: 18, fontWeight: "700" },
  advanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  advanceText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  doneText: { fontSize: 12, fontWeight: "600" },
});

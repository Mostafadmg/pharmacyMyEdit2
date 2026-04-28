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
import { currentToken } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
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

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "paid", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out" },
  { key: "delivered", label: "Done" },
] as const;

type FilterKey = typeof STATUS_FILTERS[number]["key"];

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

const NEXT_STAGE: Record<string, { deliveryStatus: string; status: string; label: string } | null> = {
  paid: { deliveryStatus: "preparing", status: "preparing", label: "Mark Preparing" },
  pending: { deliveryStatus: "preparing", status: "preparing", label: "Mark Preparing" },
  preparing: { deliveryStatus: "shipped", status: "shipped", label: "Mark Shipped" },
  shipped: { deliveryStatus: "out_for_delivery", status: "shipped", label: "Out for Delivery" },
  out_for_delivery: { deliveryStatus: "delivered", status: "delivered", label: "Mark Delivered" },
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
  const [filter, setFilter] = useState<FilterKey>("all");
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const apiBase = getApiBase();
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/orders?limit=50`, {
        headers: { Authorization: `Bearer ${currentToken}` },
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
        const res = await fetch(`${apiBase}/api/admin/orders/${order.id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ status: next.status, deliveryStatus: next.deliveryStatus }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await fetchOrders();
      } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Update failed", "Could not update the order. Please try again.");
      } finally {
        setAdvancingId(null);
      }
    },
    [fetchOrders],
  );

  const stageOf = (o: ShopOrder) => o.delivery?.status ?? o.status;

  const filtered = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "paid") return o.status === "paid" || o.status === "pending";
    return stageOf(o) === filter;
  });

  const counts = {
    all: orders.length,
    paid: orders.filter(o => o.status === "paid" || o.status === "pending").length,
    preparing: orders.filter(o => stageOf(o) === "preparing").length,
    shipped: orders.filter(o => stageOf(o) === "shipped").length,
    out_for_delivery: orders.filter(o => stageOf(o) === "out_for_delivery").length,
    delivered: orders.filter(o => stageOf(o) === "delivered").length,
  };

  const nativeTabs = Platform.OS !== "web" && isLiquidGlassAvailable();
  const topPad = Platform.OS === "web" ? 67 : nativeTabs ? insets.top + 8 : 0;
  const bottomPad = Platform.OS === "web" ? 100 : nativeTabs ? 100 : insets.bottom + 100;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]} testID="orders-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topPad }}>
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          data={STATUS_FILTERS}
          keyExtractor={f => f.key}
          renderItem={({ item }) => {
            const isActive = filter === item.key;
            const count = counts[item.key];
            return (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(item.key);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                testID={`filter-${item.key}`}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  {item.label} {count > 0 ? `(${count})` : ""}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
          const stageLabel = STAGE_LABEL_OVERRIDE[stage] ?? STAGE_LABEL[stage] ?? stage;
          const next = NEXT_STAGE[stage];
          const isAdvancing = advancingId === item.id;
          return (
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              testID={`order-card-${item.orderNumber}`}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderNumber, { color: colors.foreground }]}>
                    {item.orderNumber}
                  </Text>
                  <Text style={[styles.subtle, { color: colors.mutedForeground }]}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <View style={[styles.stageBadge, { backgroundColor: `${stageColor}20` }]}>
                  <Text style={[styles.stageText, { color: stageColor }]}>
                    {stageLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <Feather name="user" size={14} color={colors.mutedForeground} />
                <Text style={[styles.rowText, { color: colors.foreground }]}>
                  {item.customerName}
                  {item.shippingAddress?.city ? ` · ${item.shippingAddress.city}` : ""}
                </Text>
              </View>
              <View style={styles.row}>
                <Feather name="mail" size={14} color={colors.mutedForeground} />
                <Text style={[styles.rowText, { color: colors.foreground }]} numberOfLines={1}>
                  {item.customerEmail}
                </Text>
              </View>

              <View style={styles.itemList}>
                {item.items.map(it => (
                  <Text key={it.id} style={[styles.itemLine, { color: colors.foreground }]}>
                    {it.quantity}× {it.productName}
                  </Text>
                ))}
              </View>

              {item.delivery?.trackingNumber ? (
                <View style={styles.row}>
                  <Feather name="truck" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.rowText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.delivery.carrier} · {item.delivery.trackingNumber}
                  </Text>
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
                      { backgroundColor: colors.primary, opacity: isAdvancing ? 0.6 : 1 },
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
                  <View style={[styles.doneBadge, { backgroundColor: `${stageColor}20` }]}>
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  filterBar: { paddingVertical: 12, borderBottomWidth: 0 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
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
  stageText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
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

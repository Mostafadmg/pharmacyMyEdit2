import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useColors } from "@/hooks/useColors";
import { getCurrentTokenAsync } from "@/context/AuthContext";

type Message = {
  id: string;
  consultationId: string;
  patientEmail: string;
  senderRole: string;
  senderName: string;
  body: string;
  kind: string;
  createdAt: string;
};

type Action = {
  id: string;
  consultationId: string;
  action: string;
  actorRole: string;
  actorName: string;
  note: string | null;
  createdAt: string;
};

const KIND_LABELS: Record<string, string> = {
  message: "",
  approve: "Approved",
  reject: "Decision: not suitable",
  more_info: "Information requested",
  refer: "Referred",
};

const QUICK_REPLIES = [
  "Thanks for the additional info — reviewing now.",
  "Could you upload a clearer photo?",
  "Please confirm you've read the patient leaflet.",
];

function getApiBase(): string {
  const env = (process as { env?: Record<string, string | undefined> }).env;
  if (env?.EXPO_PUBLIC_API_URL) return env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  if (env?.EXPO_PUBLIC_DEV_DOMAIN) return `https://${env.EXPO_PUBLIC_DEV_DOMAIN}/api-server`;
  return "";
}

interface Props {
  consultationId: string;
}

export default function ConsultationChat({ consultationId }: Props) {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getCurrentTokenAsync();
      const res = await fetch(
        `${getApiBase()}/api/consultations/${encodeURIComponent(consultationId)}/messages`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) {
        setError(`Could not load messages (HTTP ${res.status})`);
        return;
      }
      const data = (await res.json()) as { messages: Message[]; actions: Action[] };
      setMessages(data.messages);
      setActions(data.actions);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, actions.length]);

  async function send(text?: string) {
    const value = (text ?? body).trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const token = await getCurrentTokenAsync();
      const res = await fetch(
        `${getApiBase()}/api/consultations/${encodeURIComponent(consultationId)}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ body: value }),
        },
      );
      if (!res.ok) {
        setError(`Could not send (HTTP ${res.status})`);
        return;
      }
      setBody("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  type FeedItem =
    | { kind: "msg"; at: string; key: string; message: Message }
    | { kind: "act"; at: string; key: string; action: Action };
  const feed: FeedItem[] = [
    ...messages.map<FeedItem>(m => ({ kind: "msg", at: m.createdAt, key: `m-${m.id}`, message: m })),
    ...actions
      .filter(a => a.action !== "patient_reply")
      .map<FeedItem>(a => ({ kind: "act", at: a.createdAt, key: `a-${a.id}`, action: a })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    headerText: { fontSize: 14, fontWeight: "700", color: colors.foreground },
    scroller: { paddingHorizontal: 12, paddingVertical: 12 },
    row: { marginBottom: 10, flexDirection: "row" },
    rowMine: { justifyContent: "flex-end" },
    rowTheirs: { justifyContent: "flex-start" },
    bubble: {
      maxWidth: "82%",
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleTheirs: {
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    senderLabel: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.mutedForeground,
      marginBottom: 2,
    },
    bodyMine: { color: "#fff", fontSize: 14, lineHeight: 20 },
    bodyTheirs: { color: colors.foreground, fontSize: 14, lineHeight: 20 },
    timeMine: { color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 4 },
    timeTheirs: { color: colors.mutedForeground, fontSize: 10, marginTop: 4 },
    actionPill: {
      alignSelf: "center",
      backgroundColor: colors.muted,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 10,
    },
    actionText: { fontSize: 11, color: colors.mutedForeground },
    composer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      padding: 10,
    },
    quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
    quickChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    quickText: { fontSize: 11, color: colors.mutedForeground },
    inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.foreground,
      backgroundColor: colors.background,
      maxHeight: 120,
      minHeight: 44,
    },
    sendBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
    emptyText: { color: colors.mutedForeground, fontSize: 13 },
    errorBanner: {
      backgroundColor: "#FEE2E2",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    errorText: { color: "#B91C1C", fontSize: 12 },
  });

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.header}>
        <Feather name="message-square" size={16} color={colors.primary} />
        <Text style={styles.headerText}>Conversation with patient</Text>
      </View>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroller}
        showsVerticalScrollIndicator={false}
      >
        {loading && <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />}
        {!loading && feed.length === 0 && (
          <View style={styles.empty}>
            <Feather name="message-circle" size={28} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No messages yet — start the conversation.</Text>
          </View>
        )}
        {feed.map(item => {
          if (item.kind === "act") {
            const a = item.action;
            return (
              <View key={item.key} style={styles.actionPill}>
                <Text style={styles.actionText}>
                  {format(new Date(a.createdAt), "d MMM, HH:mm")} · {a.actorName} ·{" "}
                  {KIND_LABELS[a.action] ?? a.action}
                </Text>
              </View>
            );
          }
          const m = item.message;
          const mine = m.senderRole === "pharmacist";
          return (
            <View key={item.key} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                {!mine && (
                  <Text style={styles.senderLabel}>
                    {m.senderName}
                    {KIND_LABELS[m.kind] ? ` · ${KIND_LABELS[m.kind]}` : ""}
                  </Text>
                )}
                <Text style={mine ? styles.bodyMine : styles.bodyTheirs}>{m.body}</Text>
                <Text style={mine ? styles.timeMine : styles.timeTheirs}>
                  {format(new Date(m.createdAt), "d MMM, HH:mm")}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.composer}>
        <View style={styles.quickRow}>
          {QUICK_REPLIES.map(q => (
            <Pressable key={q} style={styles.quickChip} onPress={() => send(q)} disabled={sending}>
              <Text style={styles.quickText}>{q}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Type a message…"
            placeholderTextColor={colors.mutedForeground}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!body.trim() || sending}
          >
            <Feather name="send" size={14} color="#fff" />
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

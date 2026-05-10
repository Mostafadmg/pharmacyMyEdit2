import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { db, pharmacistPushTokensTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

const expo = new Expo();

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to every active pharmacist device.
 * Cleans up tokens that Expo reports as DeviceNotRegistered.
 */
export async function pushToAllPharmacists(payload: PushPayload): Promise<void> {
  const tokens = await db
    .select({ token: pharmacistPushTokensTable.expoPushToken })
    .from(pharmacistPushTokensTable);
  if (tokens.length === 0) return;
  await sendExpoPush(
    tokens.map((t) => t.token),
    payload,
  );
}

/**
 * Send a push notification to a list of Expo push tokens. Invalid tokens are
 * filtered out, and tokens reported as `DeviceNotRegistered` after delivery
 * are removed from the database.
 */
export async function sendExpoPush(
  tokens: string[],
  payload: PushPayload,
): Promise<void> {
  const valid = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (valid.length === 0) return;

  const messages: ExpoPushMessage[] = valid.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: "default",
    priority: "high",
    channelId: "patient-messages",
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...chunkTickets);
    } catch (err) {
      logger.error({ err }, "Failed to send Expo push chunk");
    }
  }

  // Match tickets back to tokens by index. Same length & ordering as `messages`.
  const deadTokens: string[] = [];
  tickets.forEach((ticket, idx) => {
    if (ticket.status === "error") {
      const errCode = ticket.details?.error;
      const token = messages[idx]?.to;
      if (errCode === "DeviceNotRegistered" && typeof token === "string") {
        deadTokens.push(token);
      } else {
        logger.warn({ ticket }, "Expo push ticket returned an error");
      }
    }
  });

  if (deadTokens.length > 0) {
    try {
      await db
        .delete(pharmacistPushTokensTable)
        .where(inArray(pharmacistPushTokensTable.expoPushToken, deadTokens));
      logger.info({ count: deadTokens.length }, "Removed dead Expo push tokens");
    } catch (err) {
      logger.error({ err }, "Failed to delete dead Expo push tokens");
    }
  }
}

export async function deletePushToken(token: string): Promise<void> {
  await db
    .delete(pharmacistPushTokensTable)
    .where(eq(pharmacistPushTokensTable.expoPushToken, token));
}

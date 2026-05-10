import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getCurrentTokenAsync } from "@/context/AuthContext";

function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

/**
 * Set up the foreground notification handler. Called once at app start so
 * push payloads delivered while the app is open still surface a banner.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("patient-messages", {
    name: "Patient messages",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Request permissions and obtain an Expo push token. Returns null when
 * running in a simulator/web or when permission is denied.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResult.data;
  } catch {
    return null;
  }
}

/**
 * Register the device's Expo push token with the API server so the on-call
 * pharmacist can receive patient-message alerts even when the app is closed.
 * Safe to call multiple times — server upserts on the token.
 */
export async function registerPushToken(): Promise<string | null> {
  const expoPushToken = await getExpoPushToken();
  if (!expoPushToken) return null;
  const auth = await getCurrentTokenAsync();
  if (!auth) return null;
  try {
    await fetch(`${getApiBase()}/api/pharmacist/push-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
    });
    return expoPushToken;
  } catch {
    return null;
  }
}

/**
 * Unregister a token on sign-out so a logged-out device doesn't keep
 * receiving patient alerts.
 */
export async function unregisterPushToken(token: string, authToken: string): Promise<void> {
  try {
    await fetch(
      `${getApiBase()}/api/pharmacist/push-tokens/${encodeURIComponent(token)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
  } catch {
    /* best-effort */
  }
}

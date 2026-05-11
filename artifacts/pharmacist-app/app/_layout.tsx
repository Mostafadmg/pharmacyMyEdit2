import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Text as RNText, TextInput as RNTextInput, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider, KeyboardToolbar } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import brandColors from "@/constants/colors";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, getCurrentTokenAsync, useAuth } from "@/context/AuthContext";
import { configureNotificationHandler } from "@/lib/push-notifications";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
setAuthTokenGetter(getCurrentTokenAsync);
configureNotificationHandler();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const handledInitial = useRef(false);

  // Deep-link handling for patient-message push notifications.
  useEffect(() => {
    if (!isAuthenticated) return;

    function handleData(data: unknown): void {
      if (!data || typeof data !== "object") return;
      const d = data as { type?: string; consultationId?: string };
      if (d.type === "patient_message" && typeof d.consultationId === "string") {
        router.push(`/consultation/${d.consultationId}`);
      }
    }

    // Cold-start: a notification tap launched the app.
    if (!handledInitial.current) {
      handledInitial.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then((resp) => {
          if (resp) handleData(resp.notification.request.content.data);
        })
        .catch(() => {});
    }

    // Warm-start: tapped while app was backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      handleData(resp.notification.request.content.data);
    });
    return () => sub.remove();
  }, [isAuthenticated, router]);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    );
  }

  // Theme-aware stack header — picks the same palette useColors()
  // would resolve in tab screens, so the root stack respects dark
  // mode just like the rest of the app.
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? brandColors.dark : brandColors.light;
  const headerStyle = { backgroundColor: palette.card };
  const headerTintColor = palette.secondary;
  const headerTitleStyle = { fontFamily: "PlusJakartaSans_700Bold", color: palette.secondary };
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerStyle, headerTintColor, headerTitleStyle }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="consultation/[id]" options={{ title: "Consultation" }} />
      <Stack.Screen name="patient/[email]" options={{ title: "Patient Profile" }} />
      <Stack.Screen name="messages/[id]" options={{ title: "Messages", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Apply Plus Jakarta Sans as the global default font, matching the
      // patient web (which uses --font-sans: 'Plus Jakarta Sans').
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TextAny = RNText as any;
      const TextInputAny = RNTextInput as any;
      TextAny.defaultProps = TextAny.defaultProps || {};
      TextAny.defaultProps.style = [
        { fontFamily: "PlusJakartaSans_400Regular" },
        TextAny.defaultProps.style,
      ];
      TextInputAny.defaultProps = TextInputAny.defaultProps || {};
      TextInputAny.defaultProps.style = [
        { fontFamily: "PlusJakartaSans_400Regular" },
        TextInputAny.defaultProps.style,
      ];
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
                <KeyboardToolbar />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

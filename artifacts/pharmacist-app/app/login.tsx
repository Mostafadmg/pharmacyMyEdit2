import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pharmacistLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await pharmacistLogin({ data: { username: username.trim(), password } });
      await login(response.token, response.pharmacistName, response.pharmacistId, response.role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login Failed", "Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Feather name="plus" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.logoText}>
              <Text style={styles.logoPharma}>Pharma</Text>
              <Text style={styles.logoCare}>Care</Text>
            </Text>
            <Text style={styles.logoSub}>Pharmacist Portal</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Sign in to your account</Text>
          <Text style={styles.subheading}>GPhC-regulated prescriber access only</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. pharmacist"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                testID="input-username"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                testID="input-password"
              />
              <Pressable onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID="btn-login"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.credentials}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={styles.credentialsText}>
            {"  "}Demo: username <Text style={styles.credentialsBold}>pharmacist</Text> / password <Text style={styles.credentialsBold}>pharmacare2024</Text>
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
          <Feather name="shield" size={13} color={colors.mutedForeground} />
          <Text style={styles.footerText}>  Secure encrypted connection  •  GPhC Registered</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    logoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 40,
      gap: 14,
    },
    logoIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      fontSize: 26,
      fontWeight: "800" as const,
    },
    logoPharma: {
      color: colors.secondary,
    },
    logoCare: {
      color: colors.primary,
    },
    logoSub: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontWeight: "500" as const,
      marginTop: 1,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heading: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: colors.secondary,
      marginBottom: 4,
    },
    subheading: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginBottom: 24,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.secondary,
      marginBottom: 8,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.muted,
      paddingHorizontal: 14,
      height: 52,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
    },
    eyeBtn: {
      padding: 4,
    },
    loginBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    loginBtnPressed: {
      opacity: 0.85,
    },
    loginBtnDisabled: {
      opacity: 0.6,
    },
    loginBtnText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700" as const,
    },
    credentials: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
      marginHorizontal: 4,
    },
    credentialsText: {
      fontSize: 12,
      color: colors.mutedForeground,
      flex: 1,
    },
    credentialsBold: {
      fontWeight: "700" as const,
      color: colors.secondary,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 32,
    },
    footerText: {
      fontSize: 11,
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });
}

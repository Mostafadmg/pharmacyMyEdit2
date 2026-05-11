import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedScheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedScheme;
  setMode: (m: ThemeMode) => void;
}

const STORAGE_KEY = "pharmacare:theme-mode:v1";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const resolved: ResolvedScheme = useMemo(() => {
    if (mode === "light") return "light";
    if (mode === "dark") return "dark";
    return deviceScheme === "dark" ? "dark" : "light";
  }, [mode, deviceScheme]);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Resolved scheme — falls back to device when no provider mounted. */
export function useResolvedScheme(): ResolvedScheme {
  const ctx = useContext(ThemeContext);
  const device = useDeviceColorScheme();
  if (ctx) return ctx.resolved;
  return device === "dark" ? "dark" : "light";
}

/** Full theme controller — mode, resolved, setMode. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  const device = useDeviceColorScheme();
  return {
    mode: "system",
    resolved: device === "dark" ? "dark" : "light",
    setMode: () => {},
  };
}

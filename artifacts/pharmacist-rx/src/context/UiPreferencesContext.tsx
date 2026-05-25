import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadUiPreferences,
  saveUiPreferences,
  UI_PREFERENCE_DEFAULTS,
  type UiPreferenceKey,
  type UiPreferences,
} from "@/lib/uiPreferences";

type UiPreferencesContextValue = {
  preferences: UiPreferences;
  setPreference: (key: UiPreferenceKey, value: boolean) => void;
  resetToDefaults: () => void;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(
  null,
);

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UiPreferences>(() =>
    loadUiPreferences(),
  );

  const setPreference = useCallback((key: UiPreferenceKey, value: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      saveUiPreferences(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const next = { ...UI_PREFERENCE_DEFAULTS };
    saveUiPreferences(next);
    setPreferences(next);
  }, []);

  const value = useMemo(
    () => ({ preferences, setPreference, resetToDefaults }),
    [preferences, setPreference, resetToDefaults],
  );

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences(): UiPreferencesContextValue {
  const ctx = useContext(UiPreferencesContext);
  if (!ctx) {
    throw new Error("useUiPreferences must be used within UiPreferencesProvider");
  }
  return ctx;
}

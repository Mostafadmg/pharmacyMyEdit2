import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthState {
  token: string | null;
  pharmacistName: string | null;
  pharmacistId: string | null;
  role: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, name: string, id: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "@pharmacare_token";
const NAME_KEY = "@pharmacare_name";
const ID_KEY = "@pharmacare_id";
const ROLE_KEY = "@pharmacare_role";

const DEMO_ID = "pharm-001";
const DEMO_NAME = "Dr. Sarah Mitchell";
const DEMO_ROLE = "Pharmacist Prescriber (GPhC)";

export let currentToken: string | null = null;

/**
 * Synchronous live getter for the current auth token. Safe to use in direct
 * `fetch` callers that build headers inline. Returns the in-memory token
 * (hydrated by AuthProvider.restore on app start and updated by login/logout).
 */
export function getCurrentToken(): string | null {
  return currentToken;
}

/**
 * Async getter that falls back to AsyncStorage when the in-memory cache is
 * empty (e.g. a request fires before AuthProvider's restore() effect has
 * resolved, or Metro module-binding quirks have stranded the variable).
 * Register THIS one with `setAuthTokenGetter` on the api-client.
 */
export async function getCurrentTokenAsync(): Promise<string | null> {
  if (currentToken) return currentToken;
  try {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (stored) {
      currentToken = stored;
      return stored;
    }
    // Auto-login fallback: seed a demo session so API calls never fail
    const autoToken = btoa(`${DEMO_ID}:${Date.now()}`);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, autoToken),
      AsyncStorage.setItem(NAME_KEY, DEMO_NAME),
      AsyncStorage.setItem(ID_KEY, DEMO_ID),
      AsyncStorage.setItem(ROLE_KEY, DEMO_ROLE),
    ]);
    currentToken = autoToken;
    return autoToken;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    pharmacistName: null,
    pharmacistId: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    // Re-register the token getter on every mount so Metro hot-reloads of this
    // module always replace any stale getter held by the api-client.
    setAuthTokenGetter(getCurrentTokenAsync);
    async function restore() {
      try {
        const [token, name, id, role] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(NAME_KEY),
          AsyncStorage.getItem(ID_KEY),
          AsyncStorage.getItem(ROLE_KEY),
        ]);
        if (token) {
          currentToken = token;
          setState({ token, pharmacistName: name, pharmacistId: id, role, isLoading: false });
        } else {
          // No saved session — auto-login with demo pharmacist for testing
          const autoToken = btoa(`${DEMO_ID}:${Date.now()}`);
          await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, autoToken),
            AsyncStorage.setItem(NAME_KEY, DEMO_NAME),
            AsyncStorage.setItem(ID_KEY, DEMO_ID),
            AsyncStorage.setItem(ROLE_KEY, DEMO_ROLE),
          ]);
          currentToken = autoToken;
          setState({ token: autoToken, pharmacistName: DEMO_NAME, pharmacistId: DEMO_ID, role: DEMO_ROLE, isLoading: false });
        }
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    }
    restore();
  }, []);

  const login = useCallback(async (token: string, name: string, id: string, role: string) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(NAME_KEY, name),
      AsyncStorage.setItem(ID_KEY, id),
      AsyncStorage.setItem(ROLE_KEY, role),
    ]);
    currentToken = token;
    setState({ token, pharmacistName: name, pharmacistId: id, role, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(NAME_KEY),
      AsyncStorage.removeItem(ID_KEY),
      AsyncStorage.removeItem(ROLE_KEY),
    ]);
    currentToken = null;
    setState({ token: null, pharmacistName: null, pharmacistId: null, role: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

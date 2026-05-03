import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

export let currentToken: string | null = null;

/**
 * Live getter for the current auth token. Reads from AsyncStorage directly
 * (with an in-memory fast path) so the request layer cannot get stranded by
 * Metro module-binding quirks or React state-update timing. The in-memory
 * `currentToken` is updated on login/logout/restore for synchronous callers.
 */
export async function getCurrentToken(): Promise<string | null> {
  if (currentToken) return currentToken;
  try {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (stored) currentToken = stored;
    return stored;
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
    async function restore() {
      try {
        const [token, name, id, role] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(NAME_KEY),
          AsyncStorage.getItem(ID_KEY),
          AsyncStorage.getItem(ROLE_KEY),
        ]);
        currentToken = token;
        setState({ token, pharmacistName: name, pharmacistId: id, role, isLoading: false });
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

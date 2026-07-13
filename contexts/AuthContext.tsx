"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { isAuthPublicPath } from "@/lib/authPaths";
import { queryKeys } from "@/lib/query/keys";
import type { LoginResponse, RegisterResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  loginWithGoogle: (idToken: string) => Promise<LoginResponse>;
  register: (
    email: string,
    password: string,
    full_name: string
  ) => Promise<RegisterResponse>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let meInflight: Promise<User> | null = null;

async function fetchMeDeduped(): Promise<User> {
  if (!meInflight) {
    meInflight = api.getMe().finally(() => {
      meInflight = null;
    });
  }
  return meInflight;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchUser = useCallback(async () => {
    try {
      const data = await fetchMeDeduped();
      setUser(data);
      queryClient.setQueryData(queryKeys.me, data);
    } catch {
      setUser(null);
      queryClient.removeQueries({ queryKey: queryKeys.me });
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    if (path === "/login/google/complete") {
      void fetchUser();
      return;
    }

    if (isAuthPublicPath(path)) {
      setLoading(false);
      return;
    }
    void fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    try {
      const me = await api.getMe();
      setUser(me);
      queryClient.setQueryData(queryKeys.me, me);
    } catch {
      await api.clearTokens();
      setUser(null);
      queryClient.removeQueries({ queryKey: queryKeys.me });
      throw new Error("Signed in, but the session could not be verified. Please try again.");
    } finally {
      setLoading(false);
    }
    return data;
  };

  const loginWithGoogle = async (idToken: string) => {
    const data = await api.loginWithGoogle(idToken);
    await fetchUser();
    return data;
  };

  const register = async (
    email: string,
    password: string,
    full_name: string
  ) => {
    const data = await api.register(email, password, full_name);
    await fetchUser();
    return data;
  };

  const logout = () => {
    void (async () => {
      try {
        const { unregisterPushNotifications } = await import("@/lib/push/fcm");
        await unregisterPushNotifications();
      } catch {
        // Best-effort cleanup when logging out.
      }
    })();
    void api.clearTokens();
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, logout, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

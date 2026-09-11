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
import { clearOnboardedCookie, syncOnboardedCookie } from "@/lib/onboardingGate";
import { queryKeys } from "@/lib/query/keys";
import type { LoginResponse, RegisterResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  loginWithGoogle: (idToken: string) => Promise<LoginResponse>;
  completeTwoFactorLogin: (challengeToken: string, code: string) => Promise<LoginResponse>;
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

function applyUser(user: User | null): User | null {
  if (user) {
    syncOnboardedCookie(Boolean(user.profile?.is_onboarded));
  } else {
    clearOnboardedCookie();
  }
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const setAuthUser = useCallback(
    (next: User | null) => {
      setUser(applyUser(next));
      if (next) {
        queryClient.setQueryData(queryKeys.me, next);
      } else {
        queryClient.removeQueries({ queryKey: queryKeys.me });
      }
    },
    [queryClient]
  );

  const fetchUser = useCallback(async () => {
    try {
      const data = await fetchMeDeduped();
      setAuthUser(data);
    } catch {
      setAuthUser(null);
    } finally {
      setLoading(false);
    }
  }, [setAuthUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    // /login/google/complete drives its own auth sequence (exchange the OAuth
    // handoff for cookies, then fetch the user) — fetching here races that
    // flow and can poison it via fetchMeDeduped's in-flight cache with a
    // stale pre-login 401, bouncing a successful Google login back to /login.
    if (isAuthPublicPath(path)) {
      setLoading(false);
      return;
    }
    void fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    try {
      const me = data.user ?? (await api.getMe(data.access));
      setAuthUser(me);
      return { ...data, user: me };
    } catch {
      await api.clearTokens();
      setAuthUser(null);
      throw new Error("Signed in, but the session could not be verified. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    const data = await api.loginWithGoogle(idToken);
    try {
      const me = data.user ?? (await api.getMe(data.access));
      setAuthUser(me);
      return { ...data, user: me };
    } catch {
      await api.clearTokens();
      setAuthUser(null);
      throw new Error("Signed in, but the session could not be verified. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeTwoFactorLogin = async (challengeToken: string, code: string) => {
    const data = await api.completeTwoFactorLogin(challengeToken, code);
    try {
      const me = data.user ?? (await api.getMe(data.access));
      setAuthUser(me);
      return { ...data, user: me };
    } catch {
      await api.clearTokens();
      setAuthUser(null);
      throw new Error("Signed in, but the session could not be verified. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    full_name: string
  ) => {
    const data = await api.register(email, password, full_name);
    try {
      const me = data.user ?? (await api.getMe(data.tokens.access));
      setAuthUser(me);
      return { ...data, user: me };
    } catch {
      await api.clearTokens();
      setAuthUser(null);
      throw new Error("Account created, but the session could not be verified. Please try again.");
    } finally {
      setLoading(false);
    }
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
    setAuthUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        completeTwoFactorLogin,
        register,
        logout,
        fetchUser,
      }}
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

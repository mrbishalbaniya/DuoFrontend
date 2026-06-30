"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/lib/api";
import { isAuthPublicPath } from "@/lib/authPaths";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    // OAuth callback sets cookies on the prior response; load the user before redirecting.
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
    await fetchUser();
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
    void api.clearTokens();
    setUser(null);
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

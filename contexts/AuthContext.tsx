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
import type { LoginResponse, RegisterResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  register: (
    username: string,
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
      const token =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    await fetchUser();
    return data;
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    full_name: string
  ) => {
    const data = await api.register(username, email, password, full_name);
    await fetchUser();
    return data;
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

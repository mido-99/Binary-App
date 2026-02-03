import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = { email: string; id?: number } | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, passwordConfirm: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me/");
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await api.post("/api/auth/login/", { email, password }, { withCredentials: true });
        await fetchMe();
        return { ok: true };
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data;
        const error = msg?.error ?? msg?.detail ?? "Login failed.";
        return { ok: false, error };
      }
    },
    [fetchMe]
  );

  const signup = useCallback(
    async (email: string, password: string, passwordConfirm: string) => {
      if (password !== passwordConfirm) return { ok: false, error: "Passwords do not match." };
      if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
      try {
        await api.post(
          "/api/auth/register/",
          { email, password, password_confirm: passwordConfirm },
          { withCredentials: true }
        );
        await fetchMe();
        return { ok: true };
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string; email?: string[] } } })?.response?.data;
        const error = msg?.error ?? (Array.isArray(msg?.email) ? msg.email[0] : undefined) ?? "Sign up failed.";
        return { ok: false, error };
      }
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout/", {}, { withCredentials: true });
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

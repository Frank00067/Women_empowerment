import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { api } from "../api";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import type { User, UserRole } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: Exclude<UserRole, "admin">;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadMeFromApi(session: Session | null): Promise<User | null> {
  if (!session?.access_token) return null;
  try {
    return await api<User>("/auth/me");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured);

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const me = await loadMeFromApi(data.session);
    setUser(me);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    let mounted = true;

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const me = await loadMeFromApi(data.session);
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!mounted) return;
        try {
          const me = await loadMeFromApi(session);
          setUser(me);
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await refreshUser();
  }, [refreshUser]);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      role: Exclude<UserRole, "admin">;
    }) => {
      const supabase = getSupabase();
      const { data: res, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            role: data.role,
          },
        },
      });

      if (error) throw new Error(error.message);

      const needsEmailConfirmation = !res.session;
      // Don't auto-login after registration — redirect to login page
      return { needsEmailConfirmation };
    },
    []
  );

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await getSupabase().auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

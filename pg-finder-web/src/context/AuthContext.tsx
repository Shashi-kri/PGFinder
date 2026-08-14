'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setToken, type AuthUser } from '@/lib/api';

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, token: null, loading: true,
  login: async () => {}, register: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('pgf_token');
    if (stored) {
      setToken(stored);
      setTokenState(stored);
      authApi.me()
        .then(({ user: u }) => setUser(u))
        .catch(() => { localStorage.removeItem('pgf_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const persist = (tok: string, u: AuthUser) => {
    localStorage.setItem('pgf_token', tok);
    setToken(tok);
    setTokenState(tok);
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const { token: tok, user: u } = await authApi.login(email, password);
    persist(tok, u);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const { token: tok, user: u } = await authApi.register(name, email, password, phone);
    persist(tok, u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pgf_token');
    setToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, token, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

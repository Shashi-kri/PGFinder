// src/context/AuthContext.tsx
// Real JWT-based auth with AsyncStorage persistence.
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';
import { login as apiLogin, register as apiRegister, getMe, type AuthUser } from '../services/api';

export type { AuthUser as User };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

const TOKEN_KEY = 'pg_finder_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          setAuthToken(stored);
          setToken(stored);
          const me = await getMe();
          setUser(me);
        }
      } catch {
        // Token expired or invalid — clear it
        await AsyncStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = async (tok: string, u: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, tok);
    setAuthToken(tok);
    setToken(tok);
    setUser(u);
  };

  const signIn = async (email: string, password: string) => {
    const { token: tok, user: u } = await apiLogin(email, password);
    await persistSession(tok, u);
  };

  const signUp = async (name: string, email: string, password: string, phone?: string) => {
    const { token: tok, user: u } = await apiRegister(name, email, password, phone);
    await persistSession(tok, u);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, TokenResponse } from '../api/flashSaleApi';

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authApi.isLoggedIn()) {
      authApi.me().then(setUser).catch(authApi.clearToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res: TokenResponse = await authApi.login({ email, password });
    authApi.saveToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, password: string, username: string) => {
    const res: TokenResponse = await authApi.register({ email, password, username });
    authApi.saveToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => { authApi.clearToken(); setUser(null); };

  return <Ctx.Provider value={{ user, isLoading, login, register, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

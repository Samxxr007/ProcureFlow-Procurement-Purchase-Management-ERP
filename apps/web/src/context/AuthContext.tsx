import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserSummary, Role } from '@procureflow/shared';

interface AuthContextType {
  user: UserSummary | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRole: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(() => {
    const saved = localStorage.getItem('procureflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('procureflow_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyMe = async () => {
      if (accessToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('procureflow_user', JSON.stringify(res.data));
        } catch {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem('procureflow_token');
          localStorage.removeItem('procureflow_user');
        }
      }
      setIsLoading(false);
    };
    verifyMe();
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken: token, refreshToken } = res.data;
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('procureflow_token', token);
    localStorage.setItem('procureflow_refresh', refreshToken);
    localStorage.setItem('procureflow_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('procureflow_token');
    localStorage.removeItem('procureflow_refresh');
    localStorage.removeItem('procureflow_user');
  };

  const switchUserRole = async (email: string, password: string) => {
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, switchUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

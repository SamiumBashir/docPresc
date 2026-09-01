import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('docrx_admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('docrx_admin_token');
      if (storedToken) {
        try {
          const res = await api<{ success: boolean; data: { user: User } }>('/auth/me');
          const userData = res.data?.user || (res as any).user;
          if (userData && userData.role === 'admin') {
            setUser(userData);
          } else {
            // Not an admin
            logout();
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{
      success: boolean;
      data: { user: User; token: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const userData = res.data?.user || (res as any).user;
    const tokenData = res.data?.token || (res as any).token;

    if (!userData || userData.role !== 'admin') {
      throw new Error('Access denied. Administrator privileges required.');
    }

    localStorage.setItem('docrx_admin_token', tokenData);
    setToken(tokenData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('docrx_admin_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

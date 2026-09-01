import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IUser, IDoctor, IChamber } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: IUser | null;
  doctor: IDoctor | null;
  activeChamber: IChamber | null;
  chambers: IChamber[];
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setActiveChamber: (chamber: IChamber | null) => void;
  refreshProfile: () => Promise<void>;
  updateDoctorSettings: (newSettings: Partial<IDoctor['settings']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [doctor, setDoctor] = useState<IDoctor | null>(null);
  const [chambers, setChambers] = useState<IChamber[]>([]);
  const [activeChamber, setActiveChamberState] = useState<IChamber | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchChambers = async () => {
    try {
      const res = await api<{ success: boolean; data: IChamber[] }>('/chambers');
      if (res.success && res.data) {
        setChambers(res.data);
        const defaultChamber = res.data.find((c) => c.isDefault) || res.data[0] || null;
        setActiveChamberState(defaultChamber);
      }
    } catch {
      // Ignore if not a doctor
    }
  };

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api<{ success: boolean; data: { user: IUser; doctor: IDoctor | null } }>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setDoctor(res.data.doctor);
        if (res.data.user.role === 'doctor') {
          await fetchChambers();
        }
      }
    } catch (err) {
      setUser(null);
      setDoctor(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    const res = await api<{
      success: boolean;
      data: { user: IUser; doctor: IDoctor | null; token: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (res.success && res.data) {
      localStorage.setItem('docrx_token', res.data.token);
      setUser(res.data.user);
      setDoctor(res.data.doctor);
      if (res.data.user.role === 'doctor') {
        await fetchChambers();
      }
    }
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // continue
    }
    localStorage.removeItem('docrx_token');
    setUser(null);
    setDoctor(null);
    setChambers([]);
    setActiveChamberState(null);
  };

  const setActiveChamber = (chamber: IChamber | null) => {
    setActiveChamberState(chamber);
  };

  const updateDoctorSettings = async (newSettings: Partial<IDoctor['settings']>) => {
    if (!doctor) return;
    const res = await api<{ success: boolean; data: IDoctor['settings'] }>('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings),
    });
    if (res.success && res.data) {
      setDoctor({ ...doctor, settings: { ...doctor.settings, ...res.data } });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctor,
        activeChamber,
        chambers,
        isLoading,
        login,
        logout,
        setActiveChamber,
        refreshProfile,
        updateDoctorSettings,
      }}
    >
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

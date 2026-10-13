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
  // Synchronous cache retrieval for zero-delay initial rendering (SWR)
  const [user, setUser] = useState<IUser | null>(() => {
    try {
      const saved = localStorage.getItem('docrx_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [doctor, setDoctor] = useState<IDoctor | null>(() => {
    try {
      const saved = localStorage.getItem('docrx_doctor');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [chambers, setChambers] = useState<IChamber[]>(() => {
    try {
      const saved = localStorage.getItem('docrx_chambers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const resolveActiveChamber = (list: IChamber[]): IChamber | null => {
    if (!list || list.length === 0) return null;
    const savedActiveId = localStorage.getItem('docrx_active_chamber_id');
    if (savedActiveId) {
      const matched = list.find((c) => c._id === savedActiveId);
      if (matched) return matched;
    }
    return list.find((c) => c.isDefault) || list[0] || null;
  };

  const [activeChamber, setActiveChamberState] = useState<IChamber | null>(() => {
    try {
      const savedChambers = localStorage.getItem('docrx_chambers');
      const list: IChamber[] = savedChambers ? JSON.parse(savedChambers) : [];
      return resolveActiveChamber(list);
    } catch {
      return null;
    }
  });

  // Zero-delay loading: if no token or if session is cached, do not block the UI
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const token = localStorage.getItem('docrx_token');
    const hasCachedUser = !!localStorage.getItem('docrx_user');
    if (!token) return false;
    if (token && hasCachedUser) return false;
    return true;
  });

  const fetchChambers = async () => {
    try {
      const res = await api<{ success: boolean; data: IChamber[] }>('/chambers');
      if (res.success && res.data) {
        setChambers(res.data);
        localStorage.setItem('docrx_chambers', JSON.stringify(res.data));
        const active = resolveActiveChamber(res.data);
        setActiveChamberState(active);
        if (active?._id) {
          localStorage.setItem('docrx_active_chamber_id', active._id);
        }
      }
    } catch {
      // Ignore if not a doctor
    }
  };

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('docrx_token');
    // If visitor has no token, do not call /auth/me to avoid 401 console error
    if (!token) {
      setUser(null);
      setDoctor(null);
      setChambers([]);
      setActiveChamberState(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api<{
        success: boolean;
        data: { user: IUser; doctor: IDoctor | null; chambers?: IChamber[] };
      }>('/auth/me');

      if (res.success && res.data) {
        setUser(res.data.user);
        setDoctor(res.data.doctor);
        localStorage.setItem('docrx_user', JSON.stringify(res.data.user));
        if (res.data.doctor) {
          localStorage.setItem('docrx_doctor', JSON.stringify(res.data.doctor));
        }

        // If backend returned chambers in /auth/me, use them directly (0 extra network calls)
        if (res.data.chambers && res.data.chambers.length > 0) {
          setChambers(res.data.chambers);
          localStorage.setItem('docrx_chambers', JSON.stringify(res.data.chambers));
          const active = resolveActiveChamber(res.data.chambers);
          setActiveChamberState(active);
          if (active?._id) {
            localStorage.setItem('docrx_active_chamber_id', active._id);
          }
        } else if (res.data.user.role === 'doctor') {
          await fetchChambers();
        }
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        // Only clear credentials when token is strictly invalid or user is suspended
        localStorage.removeItem('docrx_token');
        localStorage.removeItem('docrx_user');
        localStorage.removeItem('docrx_doctor');
        localStorage.removeItem('docrx_chambers');
        localStorage.removeItem('docrx_active_chamber_id');
        setUser(null);
        setDoctor(null);
        setChambers([]);
        setActiveChamberState(null);
      }
      // If it's a transient network error or server glitch, retain cached session to avoid kicking doctor out
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    // Clear any previous session leftovers before storing verified session
    localStorage.removeItem('docrx_token');
    localStorage.removeItem('docrx_user');
    localStorage.removeItem('docrx_doctor');
    localStorage.removeItem('docrx_chambers');
    localStorage.removeItem('docrx_active_chamber_id');

    const res = await api<{
      success: boolean;
      data: { user: IUser; doctor: IDoctor | null; chambers?: IChamber[]; token: string };
      message?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password, rememberMe }),
    });

    if (!res.success || !res.data || !res.data.token) {
      throw new Error(res.message || 'Invalid email or password.');
    }

    localStorage.setItem('docrx_token', res.data.token);
    localStorage.setItem('docrx_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setDoctor(res.data.doctor);
    if (res.data.doctor) {
      localStorage.setItem('docrx_doctor', JSON.stringify(res.data.doctor));
    }

    if (res.data.chambers && res.data.chambers.length > 0) {
      setChambers(res.data.chambers);
      localStorage.setItem('docrx_chambers', JSON.stringify(res.data.chambers));
      const active = resolveActiveChamber(res.data.chambers);
      setActiveChamberState(active);
      if (active?._id) {
        localStorage.setItem('docrx_active_chamber_id', active._id);
      }
    } else if (res.data.user.role === 'doctor') {
      await fetchChambers();
    }
  };

  const logout = async () => {
    // 1. Immediately wipe all tokens, user sessions, and chambers from localStorage
    localStorage.removeItem('docrx_token');
    localStorage.removeItem('docrx_user');
    localStorage.removeItem('docrx_doctor');
    localStorage.removeItem('docrx_chambers');
    localStorage.removeItem('docrx_active_chamber_id');
    sessionStorage.clear();

    // 2. Synchronously clear react state
    setUser(null);
    setDoctor(null);
    setChambers([]);
    setActiveChamberState(null);
    setIsLoading(false);

    // 3. Inform backend in background without blocking UI
    api('/auth/logout', { method: 'POST' }).catch(() => {});

    // 4. Force guaranteed immediate redirect to /login
    window.location.href = '/login';
  };

  const setActiveChamber = (chamber: IChamber | null) => {
    setActiveChamberState(chamber);
    if (chamber?._id) {
      localStorage.setItem('docrx_active_chamber_id', chamber._id);
    } else {
      localStorage.removeItem('docrx_active_chamber_id');
    }
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

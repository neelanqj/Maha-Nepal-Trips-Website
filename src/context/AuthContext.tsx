import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  pendingBookingData: any | null;
  setPendingBookingData: (data: any | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mnt_auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBookingData, setPendingBookingDataState] = useState<any | null>(() => {
    try {
      const saved = sessionStorage.getItem('mnt_pending_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setPendingBookingData = (data: any | null) => {
    setPendingBookingDataState(data);
    if (data) {
      sessionStorage.setItem('mnt_pending_booking', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('mnt_pending_booking');
    }
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('mnt_auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('mnt_auth_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      // In case server is offline or unreachable
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        refreshUser,
        pendingBookingData,
        setPendingBookingData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

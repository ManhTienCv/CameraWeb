import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName: string, phone?: string) => Promise<void>;
  registerWithOtp: (email: string, pass: string, fullName: string, phone: string | undefined, otp: string) => Promise<void>;
  setAuthenticatedUser: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const refreshUser = async () => {
    const token = localStorage.getItem('camera_auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getProfile();
      setUser(data);
    } catch (err) {
      console.warn('Auth token expired or invalid:', err);
      localStorage.removeItem('camera_auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const setAuthenticatedUser = (token: string, userData: User) => {
    localStorage.setItem('camera_auth_token', token);
    setUser(userData);
    closeAuthModal();
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setAuthenticatedUser(res.token, res.user);
  };

  const register = async (email: string, pass: string, fullName: string, phone?: string) => {
    const res = await api.register({ email, password: pass, fullName, phone });
    setAuthenticatedUser(res.token, res.user);
  };

  const registerWithOtp = async (
    email: string,
    pass: string,
    fullName: string,
    phone: string | undefined,
    otp: string
  ) => {
    const res = await api.registerWithOtp({
      email,
      password: pass,
      fullName,
      phone,
      otp,
    });
    setAuthenticatedUser(res.token, res.user);
  };

  const logout = () => {
    localStorage.removeItem('camera_auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        registerWithOtp,
        setAuthenticatedUser,
        logout,
        refreshUser,
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

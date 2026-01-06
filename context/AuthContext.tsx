import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  notifications: Notification[];
  login: (token: string, user: User) => void;
  logout: () => void;
  updateWatchlist: () => Promise<void>;
  checkNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Check local storage on load
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        // Refresh notifications if logged in
        checkNotifications();
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    checkNotifications();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNotifications([]);
  };

  const updateWatchlist = async () => {
      if (!user) return;
      const list = await api.getWatchlist();
      const updatedUser = { ...user, watchlist: list };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const checkNotifications = async () => {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, notifications, login, logout, updateWatchlist, checkNotifications }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

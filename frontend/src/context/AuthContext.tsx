import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'MASTER' | 'PLAYER' | 'ADMIN';
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('grimoire_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await apiFetch<{ user: User }>('/auth/me');
      setUser(data.user);
      getSocket(); // Re-init socket with current token
    } catch (err) {
      console.error('Failed to fetch current user', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('grimoire_token', newToken);
    setToken(newToken);
    setUser(newUser);
    getSocket();
  };

  const logout = () => {
    localStorage.removeItem('grimoire_token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
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

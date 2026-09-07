import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types/index.js';
import { api } from '../utils/api.js';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (employeeId: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout
const LAST_ACTIVE_KEY = 'pollhub_last_active_ts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if saved session has expired due to 30 minutes of inactivity
  const isSessionExpiredDueToInactivity = (): boolean => {
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!lastActiveStr) return false;
    const lastActive = parseInt(lastActiveStr, 10);
    if (isNaN(lastActive)) return false;
    return Date.now() - lastActive > INACTIVITY_TIMEOUT_MS;
  };

  const [user, setUser] = useState<User | null>(() => {
    if (isSessionExpiredDueToInactivity()) {
      localStorage.removeItem('pollhub_user');
      localStorage.removeItem('pollhub_access_token');
      localStorage.removeItem(LAST_ACTIVE_KEY);
      return null;
    }
    const saved = localStorage.getItem('pollhub_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (isSessionExpiredDueToInactivity()) {
      return null;
    }
    return localStorage.getItem('pollhub_access_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastThrottleRef = useRef<number>(0);

  // Helper to record user interaction and refresh activity timestamp
  const recordActivity = useCallback(() => {
    const now = Date.now();
    // Throttle localStorage updates to at most once every 10 seconds
    if (now - lastThrottleRef.current > 10000) {
      lastThrottleRef.current = now;
      localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('pollhub_user');
    localStorage.removeItem('pollhub_access_token');
    localStorage.removeItem(LAST_ACTIVE_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('pollhub_user', JSON.stringify(data.data));
        recordActivity();
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
    }
  }, [recordActivity]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API failed:', err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Initial Auth Verification & 30-minute Inactivity Watcher
  useEffect(() => {
    const verifyAuth = async () => {
      // 1. Check inactivity on boot
      if (isSessionExpiredDueToInactivity()) {
        console.log('[Auth] Session expired due to 30 minutes of inactivity.');
        clearSession();
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('pollhub_access_token');
      if (token) {
        try {
          await refreshUser();
          recordActivity();
        } catch {
          clearSession();
        }
      }
      setIsLoading(false);
    };

    verifyAuth();

    // 2. Activity listeners: track clicks, keystrokes, mouse moves, scrolls
    const handleUserInteraction = () => {
      if (localStorage.getItem('pollhub_user')) {
        recordActivity();
      }
    };

    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    // 3. Periodic inactivity check (runs every 15 seconds)
    const interval = setInterval(() => {
      if (localStorage.getItem('pollhub_user') && isSessionExpiredDueToInactivity()) {
        console.log('[Auth] Inactivity limit (30m) reached. Logging out user.');
        logout();
      }
    }, 15000);

    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [refreshUser, recordActivity, clearSession, logout]);

  const login = async (employeeId: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/login', { employeeId, password });
    if (data.success) {
      const loggedUser = data.data.user;
      const token = data.data.accessToken;

      setUser(loggedUser);
      setAccessToken(token);
      localStorage.setItem('pollhub_user', JSON.stringify(loggedUser));
      localStorage.setItem('pollhub_access_token', token);
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());

      return loggedUser;
    }
    throw new Error(data.message || 'Login failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

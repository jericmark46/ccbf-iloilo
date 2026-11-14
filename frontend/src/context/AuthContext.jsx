import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

const noteIdleSignOut = (data) => {
  if (data?.code !== 'SESSION_IDLE') return;
  try {
    sessionStorage.setItem('cc_idle_notice', '1');
  } catch {
    /* storage unavailable */
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        noteIdleSignOut(data);
        if (!data.user) tokenStore.clear();
        if (mounted) setUser(data.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // The API drops a stored token whenever a request comes back unauthenticated.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('cc:session-expired', onExpired);
    return () => window.removeEventListener('cc:session-expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    tokenStore.clear();
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      noteIdleSignOut(data);
      if (!data.user) tokenStore.clear();
      setUser(data.user || null);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(() => {
    const permissions = user?.permissions || [];
    const isSuperadmin = user?.role === 'superadmin';
    return {
      user,
      loading,
      isAuthenticated: Boolean(user),
      isSuperadmin,
      permissions,
      canAccess: (section) => isSuperadmin || permissions.includes(section),
      login,
      logout,
      refresh,
      setUser,
    };
  }, [user, loading, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

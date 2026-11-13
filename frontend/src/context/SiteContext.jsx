import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getError } from '../api/client';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/public/bootstrap');
      setData(response.data);
      setError('');
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      data,
      settings: data?.settings || null,
      nav: data?.nav || [],
      posts: data?.posts || [],
      ministries: data?.ministries || [],
      activities: data?.activities || [],
      giving: data?.giving || [],
      pages: data?.pages || [],
      loading,
      error,
      refresh: () => load(true),
    }),
    [data, loading, error, load]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used inside SiteProvider');
  return context;
};

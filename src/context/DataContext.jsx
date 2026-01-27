import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchAllData } from '../services/huggingfaceApi';
import { COMPANY_COLORS } from '../data/companyMapping';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState({
    status: 'idle', // idle | loading | ready | error
    progress: { done: 0, total: 0 },
    companies: [],
    modelReleases: [],
    connections: [],
    liveUpdates: [],
    error: null,
    fetchedAt: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));

    try {
      const data = await fetchAllData((done, total) => {
        setState((s) => ({
          ...s,
          progress: { done, total },
        }));
      });

      setState((s) => ({
        ...s,
        status: 'ready',
        companies: data.companies,
        modelReleases: data.modelReleases,
        connections: data.connections,
        liveUpdates: data.liveUpdates,
        fetchedAt: data.fetchedAt,
      }));
    } catch (err) {
      console.error('Failed to fetch model data:', err);
      setState((s) => ({
        ...s,
        status: 'error',
        error: err.message || 'Failed to fetch data',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = {
    ...state,
    reload: load,
    COMPANY_COLORS,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useData } from './DataContext';
import { filterModels, sortModels, computeInsights, groupByRecency } from '../services/modelUtils';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const { modelReleases, companies, status } = useData();

  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [filters, setFilters] = useState({ type: [], size: [] });
  const [compareList, setCompareList] = useState([]); // model IDs, max 3
  const [showComparison, setShowComparison] = useState(false);

  // -- Filter toggles --
  const toggleFilter = useCallback((category, value) => {
    setFilters((prev) => {
      const arr = prev[category] || [];
      return {
        ...prev,
        [category]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setTimeRange('all');
    setFilters({ type: [], size: [] });
  }, []);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (search) c++;
    if (timeRange !== 'all') c++;
    c += (filters.type?.length || 0) + (filters.size?.length || 0);
    return c;
  }, [search, timeRange, filters]);

  // -- Comparison --
  const toggleCompare = useCallback((modelId) => {
    setCompareList((prev) => {
      if (prev.includes(modelId)) return prev.filter((id) => id !== modelId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, modelId];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    setShowComparison(false);
  }, []);

  // -- Derived data --
  const filteredModels = useMemo(() => {
    if (status !== 'ready') return [];
    const filtered = filterModels(modelReleases, { search, timeRange, filters });
    return sortModels(filtered, sortBy);
  }, [modelReleases, search, timeRange, filters, sortBy, status]);

  const compareModels = useMemo(
    () => modelReleases.filter((m) => compareList.includes(m.id)),
    [modelReleases, compareList]
  );

  const smartInsights = useMemo(
    () => (status === 'ready' ? computeInsights(modelReleases) : []),
    [modelReleases, status]
  );

  const whatsNew = useMemo(
    () => (status === 'ready' ? groupByRecency(modelReleases) : []),
    [modelReleases, status]
  );

  // -- Stats for dashboard --
  const stats = useMemo(() => {
    if (status !== 'ready') return null;
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    const newThisWeek = modelReleases.filter(
      (m) => m.createdAt && new Date(m.createdAt).getTime() > weekAgo
    ).length;
    const totalDownloads = modelReleases.reduce((s, m) => s + (m.downloads || 0), 0);
    const orgCounts = {};
    for (const m of modelReleases) {
      orgCounts[m.company] = (orgCounts[m.company] || 0) + 1;
    }
    const mostActiveOrg = Object.entries(orgCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalModels: modelReleases.length,
      newThisWeek,
      totalDownloads,
      mostActiveOrg: mostActiveOrg ? { name: mostActiveOrg[0], count: mostActiveOrg[1] } : null,
      filteredCount: filteredModels.length,
    };
  }, [modelReleases, filteredModels, status]);

  // -- Available filter options from data --
  const availableTypes = useMemo(
    () => [...new Set(modelReleases.map((m) => m.type))].filter(Boolean).sort(),
    [modelReleases]
  );

  const value = {
    search, setSearch,
    timeRange, setTimeRange,
    sortBy, setSortBy,
    filters, toggleFilter, clearFilters, activeFilterCount,
    compareList, toggleCompare, clearCompare, compareModels,
    showComparison, setShowComparison,
    filteredModels,
    smartInsights,
    whatsNew,
    stats,
    availableTypes,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}

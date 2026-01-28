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

  const hasActiveFilters = activeFilterCount > 0;

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

  // -- Matching company IDs (companies that have models in the filtered set) --
  const matchingCompanyIds = useMemo(() => {
    if (!hasActiveFilters || status !== 'ready') return null; // null = no filter active, show everything
    const ids = new Set();
    for (const m of filteredModels) {
      const company = companies.find(
        (c) => c.name === m.company || c.id === m.companyId
      );
      if (company) ids.add(company.id);
    }
    return ids;
  }, [filteredModels, companies, hasActiveFilters, status]);

  // -- Insights & What's New computed from FILTERED models --
  const smartInsights = useMemo(
    () => (status === 'ready' ? computeInsights(filteredModels) : []),
    [filteredModels, status]
  );

  const whatsNew = useMemo(
    () => (status === 'ready' ? groupByRecency(filteredModels) : []),
    [filteredModels, status]
  );

  // -- Stats for dashboard (both total and filtered) --
  const stats = useMemo(() => {
    if (status !== 'ready') return null;
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;

    // Total stats (always from all models)
    const totalModels = modelReleases.length;
    const totalNewThisWeek = modelReleases.filter(
      (m) => m.createdAt && new Date(m.createdAt).getTime() > weekAgo
    ).length;
    const totalDownloads = modelReleases.reduce((s, m) => s + (m.downloads || 0), 0);
    const totalOrgCounts = {};
    for (const m of modelReleases) {
      totalOrgCounts[m.company] = (totalOrgCounts[m.company] || 0) + 1;
    }
    const totalMostActiveOrg = Object.entries(totalOrgCounts).sort((a, b) => b[1] - a[1])[0];

    // Filtered stats
    const filteredCount = filteredModels.length;
    const filteredNewThisWeek = filteredModels.filter(
      (m) => m.createdAt && new Date(m.createdAt).getTime() > weekAgo
    ).length;
    const filteredDownloads = filteredModels.reduce((s, m) => s + (m.downloads || 0), 0);
    const filteredOrgCounts = {};
    for (const m of filteredModels) {
      filteredOrgCounts[m.company] = (filteredOrgCounts[m.company] || 0) + 1;
    }
    const filteredMostActiveOrg = Object.entries(filteredOrgCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalModels,
      totalNewThisWeek,
      totalDownloads,
      totalMostActiveOrg: totalMostActiveOrg ? { name: totalMostActiveOrg[0], count: totalMostActiveOrg[1] } : null,
      filteredCount,
      filteredNewThisWeek,
      filteredDownloads,
      filteredMostActiveOrg: filteredMostActiveOrg ? { name: filteredMostActiveOrg[0], count: filteredMostActiveOrg[1] } : null,
    };
  }, [modelReleases, filteredModels, status]);

  // -- Active filter description for banner --
  const filterDescription = useMemo(() => {
    const parts = [];
    if (filters.type.length > 0) parts.push(filters.type.join(', ') + ' models');
    if (filters.size.length > 0) parts.push(filters.size.map((s) => {
      const labels = { tiny: '<1B', small: '1-7B', medium: '7-13B', large: '13-70B', huge: '70B+' };
      return labels[s] || s;
    }).join(', ') + ' size');
    if (timeRange !== 'all') parts.push(`last ${timeRange}`);
    if (search) parts.push(`"${search}"`);
    return parts.join(' + ');
  }, [filters, timeRange, search]);

  // -- Available filter options from data --
  const availableTypes = useMemo(
    () => [...new Set(modelReleases.map((m) => m.type))].filter(Boolean).sort(),
    [modelReleases]
  );

  const value = {
    search, setSearch,
    timeRange, setTimeRange,
    sortBy, setSortBy,
    filters, toggleFilter, clearFilters, activeFilterCount, hasActiveFilters,
    compareList, toggleCompare, clearCompare, compareModels,
    showComparison, setShowComparison,
    filteredModels,
    matchingCompanyIds,
    smartInsights,
    whatsNew,
    stats,
    filterDescription,
    availableTypes,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}

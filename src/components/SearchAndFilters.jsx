import { useState, useRef, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { SIZE_LABELS } from '../services/modelUtils';

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending', desc: 'Download velocity' },
  { value: 'recent', label: 'Most Recent', desc: 'Newest first' },
  { value: 'popular', label: 'Most Popular', desc: 'Total downloads' },
  { value: 'quality', label: 'Highest Quality', desc: 'Composite score' },
  { value: 'liked', label: 'Most Liked', desc: 'Community favorites' },
];

export default function SearchAndFilters() {
  const {
    search, setSearch,
    sortBy, setSortBy,
    filters, toggleFilter, clearFilters, activeFilterCount,
    availableTypes,
    filteredModels,
    compareList, setShowComparison,
  } = useFilters();

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterPanel(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="fixed top-12 left-0 right-0 z-45 px-3 py-2 flex items-center gap-2 bg-[rgba(10,14,26,0.7)] backdrop-blur-md border-b border-[rgba(0,217,255,0.08)]" style={{ zIndex: 45 }}>
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models, companies, tags..."
          className="w-full h-8 pl-8 pr-8 rounded-md text-xs bg-slate-900/70 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none transition-colors font-mono"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>

      {/* Filter button */}
      <div ref={filterRef} className="relative">
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`h-8 px-2.5 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-colors border ${
            activeFilterCount > 0
              ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
              : 'border-slate-700/50 text-slate-400 hover:text-cyan-300 hover:border-slate-600'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          FILTER
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-cyan-500 text-[9px] text-white flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {showFilterPanel && (
          <div className="absolute top-full left-0 mt-1.5 w-64 glass-panel rounded-lg p-3 z-50 detail-panel-enter">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono">FILTERS</span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-[10px] text-slate-500 hover:text-cyan-400 font-mono">CLEAR ALL</button>
              )}
            </div>

            {/* Type */}
            <div className="mb-3">
              <p className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase tracking-wider">Model Type</p>
              <div className="flex flex-wrap gap-1.5">
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleFilter('type', t)}
                    className={`text-[10px] px-2 py-1 rounded font-mono transition-colors ${
                      filters.type.includes(t)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:border-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase tracking-wider">Model Size</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SIZE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleFilter('size', key)}
                    className={`text-[10px] px-2 py-1 rounded font-mono transition-colors ${
                      filters.size.includes(key)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort dropdown */}
      <div ref={sortRef} className="relative">
        <button
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          className="h-8 px-2.5 rounded-md text-[11px] font-mono flex items-center gap-1.5 border border-slate-700/50 text-slate-400 hover:text-cyan-300 hover:border-slate-600 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
          {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sort'}
        </button>

        {showSortDropdown && (
          <div className="absolute top-full right-0 mt-1.5 w-48 glass-panel rounded-lg p-1.5 z-50 detail-panel-enter">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] transition-colors ${
                  sortBy === opt.value
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="font-mono">{opt.label}</div>
                <div className="text-[9px] text-slate-600">{opt.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      <span className="text-[10px] text-slate-600 font-mono hidden md:inline">
        {filteredModels.length} models
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Compare button */}
      {compareList.length > 0 && (
        <button
          onClick={() => setShowComparison(true)}
          className="h-8 px-3 rounded-md text-[11px] font-mono flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/40 text-purple-400 hover:bg-purple-500/25 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          COMPARE
          <span className="w-4 h-4 rounded-full bg-purple-500 text-[9px] text-white flex items-center justify-center font-bold">
            {compareList.length}
          </span>
        </button>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="absolute top-full left-3 right-3 flex items-center gap-1.5 pt-1.5 pb-1 flex-wrap">
          {filters.type.map((t) => (
            <span key={`t-${t}`} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
              {t}
              <button onClick={() => toggleFilter('type', t)} className="hover:text-white">×</button>
            </span>
          ))}
          {filters.size.map((s) => (
            <span key={`s-${s}`} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
              {SIZE_LABELS[s]}
              <button onClick={() => toggleFilter('size', s)} className="hover:text-white">×</button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-[10px] text-slate-500 hover:text-cyan-400 font-mono ml-1">Clear all</button>
        </div>
      )}
    </div>
  );
}

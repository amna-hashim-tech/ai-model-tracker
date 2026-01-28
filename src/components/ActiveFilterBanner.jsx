import { useFilters } from '../context/FilterContext';

export default function ActiveFilterBanner() {
  const { hasActiveFilters, filterDescription, stats, clearFilters } = useFilters();

  if (!hasActiveFilters || !stats) return null;

  return (
    <div
      className="fixed left-0 right-0 z-44 px-3 py-0 pointer-events-none"
      style={{ top: '5.5rem', zIndex: 44 }}
    >
      <div className="pointer-events-auto max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/25 backdrop-blur-md">
          {/* Filter icon */}
          <div className="flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Description */}
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-slate-300">
              <span className="text-cyan-400 font-bold">Filtering:</span>{' '}
              <span className="text-slate-400">{filterDescription || 'Custom filter'}</span>
              <span className="text-slate-600 mx-1.5">—</span>
              <span className="text-white font-bold">{stats.filteredCount}</span>
              <span className="text-slate-500"> of </span>
              <span className="text-slate-400">{stats.totalModels}</span>
              <span className="text-slate-500"> models</span>
            </span>
          </div>

          {/* Clear button */}
          <button
            onClick={clearFilters}
            className="flex-shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          >
            CLEAR FILTERS
          </button>
        </div>
      </div>
    </div>
  );
}

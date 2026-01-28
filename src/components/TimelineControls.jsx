import { useFilters } from '../context/FilterContext';

const RANGES = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All Time' },
];

export default function TimelineControls() {
  const { timeRange, setTimeRange, filteredModels } = useFilters();

  return (
    <div className="fixed bottom-52 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="glass-panel rounded-full px-1.5 py-1 flex items-center gap-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setTimeRange(r.value)}
            className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
              timeRange === r.value
                ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(0,217,255,0.2)]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            {r.label}
          </button>
        ))}
        <div className="w-px h-4 bg-slate-700/60 mx-1" />
        <span className="text-[10px] text-slate-500 font-mono px-2">
          {filteredModels.length} models
        </span>
      </div>
    </div>
  );
}

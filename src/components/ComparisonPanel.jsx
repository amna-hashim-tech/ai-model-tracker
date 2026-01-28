import { useFilters } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { velocity, velocityFormatted, ageLabel, activityLevel } from '../services/modelUtils';
import { formatDownloads } from '../services/huggingfaceApi';

export default function ComparisonPanel() {
  const { showComparison, setShowComparison, compareModels, clearCompare, toggleCompare } = useFilters();
  const { COMPANY_COLORS } = useData();

  if (!showComparison || compareModels.length === 0) return null;

  // Find max values for bar scaling
  const maxDl = Math.max(...compareModels.map((m) => m.downloads || 0), 1);
  const maxLikes = Math.max(...compareModels.map((m) => m.likes || 0), 1);
  const maxVel = Math.max(...compareModels.map((m) => velocity(m)), 1);

  const rows = [
    { label: 'Type', render: (m) => m.type },
    { label: 'Parameters', render: (m) => m.parameters },
    { label: 'Released', render: (m) => m.date },
    { label: 'Age', render: (m) => ageLabel(m.createdAt) },
    {
      label: 'Downloads',
      render: (m) => formatDownloads(m.downloads),
      bar: (m) => (m.downloads || 0) / maxDl,
    },
    {
      label: 'Velocity',
      render: (m) => velocityFormatted(m),
      bar: (m) => velocity(m) / maxVel,
    },
    {
      label: 'Likes',
      render: (m) => (m.likes || 0).toLocaleString(),
      bar: (m) => (m.likes || 0) / maxLikes,
    },
    { label: 'Activity', render: (m) => activityLevel(m) },
    { label: 'Pipeline', render: (m) => m.pipelineTag || '—' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" onClick={() => setShowComparison(false)}>
      <div
        className="glass-panel rounded-xl w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto detail-panel-enter sidebar-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <div>
            <h2 className="text-sm font-bold text-white font-mono">MODEL COMPARISON</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">{compareModels.length} models selected (max 3)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearCompare} className="text-[10px] text-slate-500 hover:text-red-400 font-mono">CLEAR ALL</button>
            <button onClick={() => setShowComparison(false)} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* Model headers */}
        <div className="grid border-b border-slate-800/60" style={{ gridTemplateColumns: `120px repeat(${compareModels.length}, 1fr)` }}>
          <div className="p-3" />
          {compareModels.map((m) => {
            const color = COMPANY_COLORS[m.company] || '#00d9ff';
            return (
              <div key={m.id} className="p-3 text-center border-l border-slate-800/40">
                <button
                  onClick={() => toggleCompare(m.id)}
                  className="text-[9px] text-slate-600 hover:text-red-400 float-right font-mono"
                  title="Remove from comparison"
                >
                  ×
                </button>
                <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                <p className="text-xs font-bold text-white truncate" title={m.name}>{m.name}</p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color }}>{m.company}</p>
              </div>
            );
          })}
        </div>

        {/* Comparison rows */}
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
            style={{ gridTemplateColumns: `120px repeat(${compareModels.length}, 1fr)` }}
          >
            <div className="p-2.5 text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center">
              {row.label}
            </div>
            {compareModels.map((m) => {
              const color = COMPANY_COLORS[m.company] || '#00d9ff';
              const barPct = row.bar ? row.bar(m) : null;
              return (
                <div key={m.id} className="p-2.5 border-l border-slate-800/30 text-center">
                  <span className="text-xs text-slate-200 font-mono">{row.render(m)}</span>
                  {barPct !== null && (
                    <div className="h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(barPct * 100, 2)}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}88)`,
                          boxShadow: `0 0 4px ${color}44`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* HF links */}
        <div className="grid p-3" style={{ gridTemplateColumns: `120px repeat(${compareModels.length}, 1fr)` }}>
          <div />
          {compareModels.map((m) => {
            const color = COMPANY_COLORS[m.company] || '#00d9ff';
            return (
              <div key={m.id} className="px-2 text-center">
                {m.hfId && (
                  <a
                    href={`https://huggingface.co/${m.hfId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono py-1.5 px-3 rounded border inline-block transition-all"
                    style={{ borderColor: `${color}44`, color, background: `${color}08` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${color}18`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}
                  >
                    View on HF →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

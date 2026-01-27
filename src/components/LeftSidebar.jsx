import { useData } from '../context/DataContext';
import { formatDownloads } from '../services/huggingfaceApi';

export default function LeftSidebar({ layers, onToggleLayer, selectedCompany, onSelectCompany }) {
  const { companies, modelReleases, status } = useData();

  // Derive unique pipeline types from real data
  const modelTypes = status === 'ready'
    ? [...new Set(modelReleases.map((m) => m.type))].filter(Boolean).slice(0, 8)
    : ['LLM', 'Multimodal', 'Image Gen', 'Embeddings'];

  return (
    <aside className="fixed top-14 left-3 z-40 w-56 flex flex-col gap-3 max-h-[calc(100vh-120px)] overflow-y-auto sidebar-scroll">
      {/* Layers Section */}
      <div className="glass-panel rounded-lg p-3">
        <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-3 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 22 8.5 12 15 2 8.5" />
            <polyline points="2 15.5 12 22 22 15.5" />
          </svg>
          LAYERS
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { key: 'modelReleases', label: 'Model Releases', icon: '◆' },
            { key: 'companyHQs', label: 'Company HQs', icon: '●' },
            { key: 'connectionArcs', label: 'Connections', icon: '⟋' },
          ].map(({ key, label, icon }) => (
            <label
              key={key}
              className="flex items-center gap-2.5 cursor-pointer group text-sm"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={() => onToggleLayer(key)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border border-slate-600 peer-checked:border-cyan-400 peer-checked:bg-cyan-400/20 transition-all flex items-center justify-center">
                  {layers[key] && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-cyan-300 transition-colors text-xs">
                <span className="mr-1.5 opacity-60">{icon}</span>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Legend Section */}
      <div className="glass-panel rounded-lg p-3">
        <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-3 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="8" y1="8" x2="8" y2="8.01" />
            <line x1="8" y1="12" x2="8" y2="12.01" />
            <line x1="8" y1="16" x2="8" y2="16.01" />
            <line x1="12" y1="8" x2="16" y2="8" />
            <line x1="12" y1="12" x2="16" y2="12" />
            <line x1="12" y1="16" x2="16" y2="16" />
          </svg>
          COMPANIES
          {status === 'ready' && (
            <span className="text-slate-600 font-normal ml-auto">{companies.length}</span>
          )}
        </h3>
        {status === 'loading' ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse" />
                <div className="h-3 bg-slate-700 rounded animate-pulse flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCompany(selectedCompany === c.name ? null : c.name)}
                className={`flex items-center gap-2 px-2 py-1 rounded text-left transition-all text-xs ${
                  selectedCompany === c.name
                    ? 'bg-[rgba(0,217,255,0.1)] ring-1 ring-cyan-500/30'
                    : 'hover:bg-[rgba(0,217,255,0.05)]'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: c.color,
                    boxShadow: `0 0 6px ${c.color}66`,
                  }}
                />
                <span className="text-slate-300 truncate">{c.name}</span>
                <span className="text-slate-600 text-[10px] ml-auto font-mono" title={`${c.modelsCount} models`}>
                  {c.modelsCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model Types */}
      <div className="glass-panel rounded-lg p-3">
        <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-3">
          MODEL TYPES
        </h3>
        <div className="flex flex-col gap-1.5 text-[11px] text-slate-400">
          {modelTypes.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-cyan-400/40 border border-cyan-400/60" />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Source */}
      {status === 'ready' && (
        <div className="glass-panel rounded-lg p-3">
          <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-2">
            DATA SOURCE
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Live data from Hugging Face API.
            {modelReleases.length > 0 && (
              <> Tracking <span className="text-cyan-400">{modelReleases.length}</span> models across <span className="text-cyan-400">{companies.length}</span> organizations.</>
            )}
          </p>
        </div>
      )}
    </aside>
  );
}

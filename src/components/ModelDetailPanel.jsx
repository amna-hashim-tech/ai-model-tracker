import { COMPANY_COLORS, modelReleases } from '../data/mockData';

export default function ModelDetailPanel({ model, company, onClose }) {
  if (!model && !company) return null;

  if (company) {
    const companyModels = modelReleases.filter(
      (m) => m.company === (typeof company === 'string' ? company : company.name)
    );
    const companyData = typeof company === 'string' ? null : company;
    const companyName = typeof company === 'string' ? company : company.name;
    const color = COMPANY_COLORS[companyName] || '#00d9ff';

    return (
      <div className="fixed top-14 right-3 z-50 w-80 max-h-[calc(100vh-80px)] overflow-y-auto glass-panel rounded-lg detail-panel-enter sidebar-scroll">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                style={{
                  background: `${color}22`,
                  border: `1px solid ${color}44`,
                  color,
                }}
              >
                {companyName.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{companyName}</h2>
                {companyData && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    {companyData.hq} · Est. {companyData.founded}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Models */}
        <div className="p-3">
          <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-3">
            MODELS ({companyModels.length})
          </h3>
          <div className="flex flex-col gap-2">
            {companyModels.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-md bg-slate-900/50 border border-slate-800/60 hover:border-cyan-500/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-semibold text-white">
                    {m.name}
                  </span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: `${color}22`,
                      color,
                    }}
                  >
                    {m.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                  <span>{m.date}</span>
                  <span>·</span>
                  <span>{m.parameters}</span>
                </div>
                {m.highlight && (
                  <p className="text-[11px] text-cyan-400/70 mt-1.5">
                    {m.highlight}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Single model view
  const color = COMPANY_COLORS[model.company] || '#00d9ff';
  const benchmarks = model.benchmarks || {};

  return (
    <div className="fixed top-14 right-3 z-50 w-80 glass-panel rounded-lg detail-panel-enter sidebar-scroll overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
              <span className="text-[11px] font-mono" style={{ color }}>
                {model.company}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{model.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Meta info */}
      <div className="p-4 border-b border-slate-800/60 grid grid-cols-2 gap-3">
        {[
          { label: 'Released', value: model.date },
          { label: 'Parameters', value: model.parameters },
          { label: 'Type', value: model.type },
          { label: 'Open Source', value: model.openSource ? 'Yes' : 'No' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
              {label}
            </p>
            <p className="text-sm text-slate-200 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="p-4 border-b border-slate-800/60">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {model.description}
        </p>
        {model.highlight && (
          <div
            className="mt-3 p-2 rounded text-[11px] font-medium"
            style={{
              background: `${color}11`,
              border: `1px solid ${color}33`,
              color,
            }}
          >
            {model.highlight}
          </div>
        )}
      </div>

      {/* Benchmarks */}
      {Object.keys(benchmarks).length > 0 && (
        <div className="p-4">
          <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-3">
            BENCHMARKS
          </h3>
          <div className="flex flex-col gap-2.5">
            {Object.entries(benchmarks).map(([key, value]) => {
              const maxVal = key === 'fid' ? 50 : 100;
              const pct = key === 'fid' ? ((50 - value) / 50) * 100 : value;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400 font-mono uppercase">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-white font-mono font-bold">
                      {value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}88)`,
                        boxShadow: `0 0 8px ${color}44`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useData } from '../context/DataContext';

export default function ModelDetailPanel({ model, company, onClose }) {
  const { modelReleases, COMPANY_COLORS } = useData();

  if (!model && !company) return null;

  // --- Company view ---
  if (company) {
    const companyName = typeof company === 'string' ? company : company.name;
    const companyData = typeof company === 'string' ? null : company;
    const companyModels = modelReleases.filter((m) => m.company === companyName);
    const color = COMPANY_COLORS[companyName] || '#00d9ff';

    const totalDownloads = companyModels.reduce((s, m) => s + (m.downloads || 0), 0);
    const totalLikes = companyModels.reduce((s, m) => s + (m.likes || 0), 0);
    const fmtDl = totalDownloads >= 1e9 ? `${(totalDownloads / 1e9).toFixed(1)}B`
      : totalDownloads >= 1e6 ? `${(totalDownloads / 1e6).toFixed(1)}M`
      : totalDownloads >= 1e3 ? `${(totalDownloads / 1e3).toFixed(1)}K`
      : String(totalDownloads);

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
                    {companyData.hq}{companyData.founded ? ` · Est. ${companyData.founded}` : ''}
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
          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Models', value: companyModels.length },
              { label: 'Downloads', value: fmtDl },
              { label: 'Likes', value: totalLikes.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-1.5 rounded bg-slate-900/50 border border-slate-800/40">
                <p className="text-sm font-bold text-cyan-400 font-mono">{value}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Models list */}
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
                  <span className="text-sm font-semibold text-white truncate max-w-[180px]" title={m.name}>
                    {m.name}
                  </span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: `${color}22`, color }}
                  >
                    {m.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                  <span>{m.date}</span>
                  <span>·</span>
                  <span>{m.parameters}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                  <span title="Downloads">↓ {m.downloadsFormatted || '—'}</span>
                  <span title="Likes">♥ {m.likes != null ? m.likes.toLocaleString() : '—'}</span>
                </div>
              </div>
            ))}
            {companyModels.length === 0 && (
              <p className="text-[11px] text-slate-600 text-center py-4">
                No models found on Hugging Face
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Single model view ---
  const color = COMPANY_COLORS[model.company] || '#00d9ff';

  return (
    <div className="fixed top-14 right-3 z-50 w-80 glass-panel rounded-lg detail-panel-enter sidebar-scroll overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
              <span className="text-[11px] font-mono" style={{ color }}>
                {model.company}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white break-all">{model.name}</h2>
            {model.hfId && (
              <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate" title={model.hfId}>
                {model.hfId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-800/60">
        {[
          { label: 'Downloads', value: model.downloadsFormatted || '—' },
          { label: 'Likes', value: model.likes != null ? model.likes.toLocaleString() : '—' },
          { label: 'Parameters', value: model.parameters || 'Unknown' },
        ].map(({ label, value }) => (
          <div key={label} className="text-center p-1.5 rounded bg-slate-900/50 border border-slate-800/40">
            <p className="text-sm font-bold text-cyan-400 font-mono">{value}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Meta info */}
      <div className="p-4 border-b border-slate-800/60 grid grid-cols-2 gap-3">
        {[
          { label: 'Released', value: model.date || 'Unknown' },
          { label: 'Type', value: model.type || 'Unknown' },
          { label: 'Pipeline', value: model.pipelineTag || '—' },
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

      {/* Tags */}
      {model.tags && model.tags.length > 0 && (
        <div className="p-4">
          <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-2">
            TAGS
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {model.tags.slice(0, 15).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50"
              >
                {tag}
              </span>
            ))}
            {model.tags.length > 15 && (
              <span className="text-[10px] px-2 py-0.5 text-slate-600">
                +{model.tags.length - 15} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* HuggingFace link */}
      {model.hfId && (
        <div className="px-4 pb-4">
          <a
            href={`https://huggingface.co/${model.hfId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-[11px] font-mono py-2 rounded border transition-all"
            style={{
              borderColor: `${color}44`,
              color,
              background: `${color}08`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}
          >
            View on Hugging Face →
          </a>
        </div>
      )}
    </div>
  );
}

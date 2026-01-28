import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { velocity, velocityFormatted, ageLabel, activityLevel, isNew, qualityScore } from '../services/modelUtils';

export default function ModelDetailPanel({ model, company, onClose }) {
  const { modelReleases, COMPANY_COLORS } = useData();
  const { compareList, toggleCompare } = useFilters();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!model && !company) return null;

  const handleShare = (hfId) => {
    const url = `https://huggingface.co/${hfId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
      <div className="fixed top-24 right-3 z-50 w-80 max-h-[calc(100vh-110px)] overflow-y-auto glass-panel rounded-lg detail-panel-enter sidebar-scroll">
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>{companyName.charAt(0)}</div>
              <div>
                <h2 className="text-base font-bold text-white">{companyName}</h2>
                {companyData && <p className="text-[11px] text-slate-500 font-mono">{companyData.hq}{companyData.founded ? ` · Est. ${companyData.founded}` : ''}</p>}
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
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
        <div className="p-3">
          <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-3">MODELS ({companyModels.length})</h3>
          <div className="flex flex-col gap-2">
            {companyModels.map((m) => {
              const modelNew = isNew(m.createdAt);
              return (
                <div key={m.id} className="p-2.5 rounded-md bg-slate-900/50 border border-slate-800/60 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white truncate max-w-[160px]" title={m.name}>{m.name}</span>
                      {modelNew && <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">NEW</span>}
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${color}22`, color }}>{m.type}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>{m.date}</span><span>·</span><span>{m.parameters}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                    <span>↓ {m.downloadsFormatted || '—'}</span>
                    <span>♥ {m.likes != null ? m.likes.toLocaleString() : '—'}</span>
                    <span className="text-cyan-400/60">{velocityFormatted(m)}</span>
                  </div>
                </div>
              );
            })}
            {companyModels.length === 0 && <p className="text-[11px] text-slate-600 text-center py-4">No models found on Hugging Face</p>}
          </div>
        </div>
      </div>
    );
  }

  // --- Single model view ---
  const color = COMPANY_COLORS[model.company] || '#00d9ff';
  const modelNew = isNew(model.createdAt);
  const vel = velocityFormatted(model);
  const activity = activityLevel(model);
  const inCompare = compareList.includes(model.id);
  const activityColor = activity === 'High' ? 'text-emerald-400' : activity === 'Medium' ? 'text-yellow-400' : 'text-slate-500';

  return (
    <div className="fixed top-24 right-3 z-50 w-80 glass-panel rounded-lg detail-panel-enter sidebar-scroll overflow-y-auto max-h-[calc(100vh-110px)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="text-[11px] font-mono" style={{ color }}>{model.company}</span>
              {modelNew && <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">NEW</span>}
            </div>
            <h2 className="text-lg font-bold text-white break-all">{model.name}</h2>
            {model.hfId && <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate" title={model.hfId}>{model.hfId}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-800/60">
        <div className="text-center p-1.5 rounded bg-slate-900/50 border border-slate-800/40">
          <p className="text-sm font-bold text-cyan-400 font-mono">{model.downloadsFormatted || '—'}</p>
          <p className="text-[8px] text-slate-500 uppercase tracking-wider">Downloads</p>
          <p className="text-[9px] text-cyan-400/60 font-mono mt-0.5">+{vel}</p>
        </div>
        <div className="text-center p-1.5 rounded bg-slate-900/50 border border-slate-800/40">
          <p className="text-sm font-bold text-cyan-400 font-mono">{model.likes != null ? model.likes.toLocaleString() : '—'}</p>
          <p className="text-[8px] text-slate-500 uppercase tracking-wider">Likes</p>
        </div>
        <div className="text-center p-1.5 rounded bg-slate-900/50 border border-slate-800/40">
          <p className="text-sm font-bold text-cyan-400 font-mono">{model.parameters || '?'}</p>
          <p className="text-[8px] text-slate-500 uppercase tracking-wider">Params</p>
        </div>
      </div>

      {/* Meta info */}
      <div className="p-3 border-b border-slate-800/60 grid grid-cols-2 gap-2.5">
        {[
          { label: 'Released', value: model.date || 'Unknown' },
          { label: 'Age', value: ageLabel(model.createdAt) },
          { label: 'Type', value: model.type || 'Unknown' },
          { label: 'Pipeline', value: model.pipelineTag || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">{label}</p>
            <p className="text-xs text-slate-200 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Quality Indicators */}
      <div className="p-3 border-b border-slate-800/60">
        <h3 className="text-[10px] font-bold tracking-widest text-cyan-400 font-mono mb-2">QUALITY INDICATORS</h3>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Community Activity</span>
            <span className={`font-mono font-bold ${activityColor}`}>{activity}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Download Velocity</span>
            <span className="text-cyan-400 font-mono">{vel}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Quality Score</span>
            <span className="text-purple-400 font-mono">{qualityScore(model).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-3 border-b border-slate-800/60">
        <p className="text-[11px] text-slate-400 leading-relaxed">{model.description}</p>
      </div>

      {/* Tags */}
      {model.tags && model.tags.length > 0 && (
        <div className="p-3 border-b border-slate-800/60">
          <h3 className="text-[10px] font-bold tracking-widest text-cyan-400 font-mono mb-2">TAGS</h3>
          <div className="flex flex-wrap gap-1.5">
            {model.tags.slice(0, 12).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">{tag}</span>
            ))}
            {model.tags.length > 12 && <span className="text-[10px] px-2 py-0.5 text-slate-600">+{model.tags.length - 12}</span>}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-3 flex flex-col gap-2">
        {model.hfId && (
          <a
            href={`https://huggingface.co/${model.hfId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-[11px] font-mono py-2 rounded border transition-all"
            style={{ borderColor: `${color}44`, color, background: `${color}08` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}
          >
            View on Hugging Face →
          </a>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => toggleCompare(model.id)}
            className={`flex-1 text-center text-[11px] font-mono py-2 rounded border transition-all ${
              inCompare
                ? 'border-purple-500/50 text-purple-400 bg-purple-500/15'
                : 'border-slate-700/50 text-slate-400 hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/5'
            }`}
          >
            {inCompare ? '✓ In Compare' : '+ Compare'}
          </button>
          <button
            onClick={() => handleShare(model.hfId)}
            className="flex-1 text-center text-[11px] font-mono py-2 rounded border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
          >
            {copiedLink ? '✓ Copied' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

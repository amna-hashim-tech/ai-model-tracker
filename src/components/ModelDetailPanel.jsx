import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { velocity, velocityFormatted, ageLabel, activityLevel, isNew, qualityScore, daysOld } from '../services/modelUtils';

// Extract license from model tags
function extractLicense(model) {
  if (!model.tags) return 'Unknown';
  const licenseTag = model.tags.find(t =>
    t.startsWith('license:') ||
    ['mit', 'apache-2.0', 'gpl', 'cc-by', 'openrail', 'llama'].some(l => t.toLowerCase().includes(l))
  );
  if (licenseTag) {
    if (licenseTag.startsWith('license:')) return licenseTag.replace('license:', '').toUpperCase();
    return licenseTag.toUpperCase();
  }
  if (!model.openSource) return 'Proprietary';
  return 'Unknown';
}

// Infer architecture from model name/tags
function inferArchitecture(model) {
  const name = (model.name + ' ' + (model.tags || []).join(' ')).toLowerCase();
  if (name.includes('llama')) return 'LLaMA';
  if (name.includes('mistral')) return 'Mistral';
  if (name.includes('gpt')) return 'GPT';
  if (name.includes('bert')) return 'BERT';
  if (name.includes('t5')) return 'T5';
  if (name.includes('clip')) return 'CLIP';
  if (name.includes('stable-diffusion') || name.includes('sdxl')) return 'Diffusion';
  if (name.includes('whisper')) return 'Whisper';
  if (name.includes('gemma')) return 'Gemma';
  if (name.includes('phi')) return 'Phi';
  if (name.includes('qwen')) return 'Qwen';
  if (name.includes('falcon')) return 'Falcon';
  if (name.includes('claude')) return 'Claude';
  if (name.includes('gemini')) return 'Gemini';
  return model.pipelineTag || 'Unknown';
}

// Infer language support
function inferLanguages(model) {
  if (!model.tags) return ['English'];
  const langTags = model.tags.filter(t => t.startsWith('language:') || ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'multilingual'].includes(t.toLowerCase()));
  if (langTags.length > 0) {
    const langs = langTags.map(t => t.replace('language:', '').toUpperCase());
    if (langs.length > 3) return [...langs.slice(0, 3), `+${langs.length - 3}`];
    return langs;
  }
  return ['EN'];
}

export default function ModelDetailPanel({ model, company, onClose }) {
  const { modelReleases, COMPANY_COLORS } = useData();
  const { compareList, toggleCompare } = useFilters();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!model && !company) return null;

  const handleShare = (m) => {
    const url = m.officialUrl || (m.hfId ? `https://huggingface.co/${m.hfId}` : '');
    if (url) {
      navigator.clipboard.writeText(url).catch(() => {});
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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

    // Find newest model
    const newest = companyModels.reduce((a, b) =>
      new Date(b.createdAt) > new Date(a.createdAt) ? b : a, companyModels[0]);
    const newestAge = newest ? daysOld(newest.createdAt) : null;

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
          {newestAge !== null && newestAge < 30 && (
            <div className="mt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Latest release {newestAge < 1 ? 'today' : newestAge < 2 ? 'yesterday' : `${Math.floor(newestAge)} days ago`}
            </div>
          )}
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
                <div key={m.id} className="p-2.5 rounded-md bg-slate-900/50 border border-slate-800/60 hover:border-cyan-500/30 transition-colors cursor-pointer">
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
                    {m.source === 'official' && <span className="text-orange-400/60">Official</span>}
                  </div>
                </div>
              );
            })}
            {companyModels.length === 0 && <p className="text-[11px] text-slate-600 text-center py-4">No models tracked</p>}
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
  const days = daysOld(model.createdAt);
  const releasedAgo = days < 1 ? 'Released today' : days < 2 ? 'Released yesterday' : `Released ${Math.floor(days)} days ago`;
  const license = extractLicense(model);
  const architecture = inferArchitecture(model);
  const languages = inferLanguages(model);

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
            <p className="text-[10px] text-slate-500 mt-0.5">{releasedAgo}</p>
            {model.hfId && <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate" title={model.hfId}>{model.hfId}</p>}
            <div className="flex items-center gap-1.5 mt-1.5">
              {model.source === 'official' ? (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono">OFFICIAL</span>
              ) : (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-mono">HUGGING FACE</span>
              )}
              {!model.openSource && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/30 font-mono">CLOSED SOURCE</span>
              )}
            </div>
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
          {model.source !== 'official' && <p className="text-[9px] text-cyan-400/60 font-mono mt-0.5">+{vel}</p>}
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

      {/* Technical Details */}
      <div className="p-3 border-b border-slate-800/60">
        <h3 className="text-[10px] font-bold tracking-widest text-cyan-400 font-mono mb-2">TECHNICAL DETAILS</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Architecture</p>
            <p className="text-xs text-slate-200 mt-0.5">{architecture}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">License</p>
            <p className="text-xs text-slate-200 mt-0.5">{license}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Languages</p>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {languages.map((lang, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 font-mono">{lang}</span>
              ))}
            </div>
          </div>
        </div>
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
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                  style={{ width: `${Math.min(qualityScore(model), 100)}%` }}
                />
              </div>
              <span className="text-purple-400 font-mono">{qualityScore(model).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-3 border-b border-slate-800/60">
        <h3 className="text-[10px] font-bold tracking-widest text-cyan-400 font-mono mb-2">DESCRIPTION</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">{model.description}</p>
        {model.highlight && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">HIGHLIGHT</span>
            <span className="text-[10px] text-cyan-400">{model.highlight}</span>
          </div>
        )}
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
        {model.hfId ? (
          <a
            href={`https://huggingface.co/${model.hfId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-[11px] font-mono py-2.5 rounded border transition-all flex items-center justify-center gap-2"
            style={{ borderColor: `${color}44`, color, background: `${color}08` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            View on Hugging Face
          </a>
        ) : model.officialUrl ? (
          <a
            href={model.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-[11px] font-mono py-2.5 rounded border transition-all flex items-center justify-center gap-2"
            style={{ borderColor: `${color}44`, color, background: `${color}08` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            View Official Page
          </a>
        ) : null}
        <div className="flex gap-2">
          <button
            onClick={() => toggleCompare(model.id)}
            className={`flex-1 text-center text-[11px] font-mono py-2 rounded border transition-all flex items-center justify-center gap-1.5 ${
              inCompare
                ? 'border-purple-500/50 text-purple-400 bg-purple-500/15'
                : 'border-slate-700/50 text-slate-400 hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/5'
            }`}
          >
            {inCompare ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                In Compare
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Compare
              </>
            )}
          </button>
          <button
            onClick={() => handleShare(model)}
            className="flex-1 text-center text-[11px] font-mono py-2 rounded border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-1.5"
          >
            {copiedLink ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

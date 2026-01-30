import { useRef, useState, useCallback } from 'react';
import { useFilters } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { velocity, velocityFormatted, ageLabel, activityLevel, qualityScore, daysOld } from '../services/modelUtils';
import { formatDownloads } from '../services/huggingfaceApi';

// Extract license from model tags
function extractLicense(model) {
  if (!model.tags) return 'Unknown';
  const licenseTag = model.tags.find(t =>
    t.startsWith('license:') ||
    ['mit', 'apache-2.0', 'gpl', 'cc-by', 'openrail', 'llama'].some(l => t.toLowerCase().includes(l))
  );
  if (licenseTag) {
    if (licenseTag.startsWith('license:')) return licenseTag.replace('license:', '').toUpperCase();
    return licenseTag.split('-')[0].toUpperCase();
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
  if (name.includes('claude')) return 'Claude';
  if (name.includes('gemini')) return 'Gemini';
  if (name.includes('gemma')) return 'Gemma';
  if (name.includes('phi')) return 'Phi';
  return model.pipelineTag?.split('-')[0] || '—';
}

export default function ComparisonPanel() {
  const { showComparison, setShowComparison, compareModels, clearCompare, toggleCompare } = useFilters();
  const { COMPANY_COLORS } = useData();
  const panelRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPNG = useCallback(async () => {
    if (!panelRef.current) return;
    setExporting(true);

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(panelRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `model-comparison-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setExporting(false);
    }
  }, []);

  if (!showComparison || compareModels.length === 0) return null;

  // Find max values for bar scaling
  const maxDl = Math.max(...compareModels.map((m) => m.downloads || 0), 1);
  const maxLikes = Math.max(...compareModels.map((m) => m.likes || 0), 1);
  const maxVel = Math.max(...compareModels.map((m) => velocity(m)), 1);
  const maxScore = Math.max(...compareModels.map((m) => qualityScore(m)), 1);

  const rows = [
    { label: 'Source', render: (m) => m.source === 'official' ? 'Official' : 'Hugging Face' },
    { label: 'Type', render: (m) => m.type || '—' },
    { label: 'Architecture', render: (m) => inferArchitecture(m) },
    { label: 'Parameters', render: (m) => m.parameters || '—' },
    { label: 'License', render: (m) => extractLicense(m) },
    { label: 'Released', render: (m) => m.date || '—' },
    { label: 'Age', render: (m) => ageLabel(m.createdAt) },
    {
      label: 'Downloads',
      render: (m) => m.source === 'official' && !m.downloads ? 'API only' : formatDownloads(m.downloads),
      bar: (m) => (m.downloads || 0) / maxDl,
    },
    {
      label: 'Velocity',
      render: (m) => m.source === 'official' && !m.downloads ? '—' : velocityFormatted(m),
      bar: (m) => velocity(m) / maxVel,
    },
    {
      label: 'Likes',
      render: (m) => (m.likes || 0).toLocaleString(),
      bar: (m) => (m.likes || 0) / maxLikes,
    },
    {
      label: 'Quality Score',
      render: (m) => qualityScore(m).toFixed(0),
      bar: (m) => qualityScore(m) / maxScore,
    },
    { label: 'Activity', render: (m) => activityLevel(m), highlight: true },
    { label: 'Pipeline', render: (m) => m.pipelineTag || '—' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" onClick={() => setShowComparison(false)}>
      <div
        ref={panelRef}
        className="glass-panel rounded-xl w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto detail-panel-enter sidebar-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
              MODEL COMPARISON
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">{compareModels.length} of 3 models selected</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="text-[10px] px-2.5 py-1.5 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  EXPORTING...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  EXPORT PNG
                </>
              )}
            </button>
            <button onClick={clearCompare} className="text-[10px] px-2 py-1.5 text-slate-500 hover:text-red-400 font-mono transition-colors">CLEAR ALL</button>
            <button onClick={() => setShowComparison(false)} className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* Model headers */}
        <div className="grid border-b border-slate-800/60" style={{ gridTemplateColumns: `130px repeat(${compareModels.length}, 1fr)` }}>
          <div className="p-3 text-[9px] text-slate-600 font-mono uppercase tracking-wider flex items-end">
            ATTRIBUTE
          </div>
          {compareModels.map((m) => {
            const color = COMPANY_COLORS[m.company] || '#00d9ff';
            const days = daysOld(m.createdAt);
            return (
              <div key={m.id} className="p-3 text-center border-l border-slate-800/40 relative">
                <button
                  onClick={() => toggleCompare(m.id)}
                  className="absolute top-2 right-2 text-[9px] w-5 h-5 rounded-full bg-slate-800/60 text-slate-600 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
                  title="Remove from comparison"
                >
                  ×
                </button>
                <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                <p className="text-sm font-bold text-white truncate" title={m.name}>{m.name}</p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color }}>{m.company}</p>
                {days < 30 && (
                  <span className="inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                    {days < 1 ? 'TODAY' : days < 7 ? 'NEW' : `${Math.floor(days)}d ago`}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison rows */}
        {rows.map((row, rowIdx) => (
          <div
            key={row.label}
            className={`grid border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors ${rowIdx % 2 === 0 ? 'bg-slate-900/20' : ''}`}
            style={{ gridTemplateColumns: `130px repeat(${compareModels.length}, 1fr)` }}
          >
            <div className="p-2.5 text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center">
              {row.label}
            </div>
            {compareModels.map((m) => {
              const color = COMPANY_COLORS[m.company] || '#00d9ff';
              const barPct = row.bar ? row.bar(m) : null;
              const value = row.render(m);
              const isHighActivity = row.highlight && value === 'High';
              const isMedActivity = row.highlight && value === 'Medium';
              return (
                <div key={m.id} className="p-2.5 border-l border-slate-800/30 text-center">
                  <span className={`text-xs font-mono ${
                    isHighActivity ? 'text-emerald-400 font-bold' :
                    isMedActivity ? 'text-yellow-400' : 'text-slate-200'
                  }`}>{value}</span>
                  {barPct !== null && (
                    <div className="h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(barPct * 100, 3)}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}88)`,
                          boxShadow: `0 0 6px ${color}44`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Winner summary */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-900/30">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">QUICK SUMMARY</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${compareModels.length}, 1fr)` }}>
            {compareModels.map((m) => {
              const color = COMPANY_COLORS[m.company] || '#00d9ff';
              const highlights = [];
              if (m.downloads === maxDl && maxDl > 0) highlights.push('Most Downloads');
              if (m.likes === Math.max(...compareModels.map(x => x.likes || 0))) highlights.push('Most Liked');
              if (velocity(m) === maxVel && maxVel > 0) highlights.push('Fastest Growing');
              if (qualityScore(m) === maxScore) highlights.push('Highest Quality');
              const isNewest = daysOld(m.createdAt) === Math.min(...compareModels.map(x => daysOld(x.createdAt)));
              if (isNewest) highlights.push('Most Recent');

              return (
                <div key={m.id} className="text-center">
                  {highlights.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {highlights.slice(0, 2).map((h) => (
                        <span key={h} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-600">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Links */}
        <div className="grid p-4" style={{ gridTemplateColumns: `130px repeat(${compareModels.length}, 1fr)` }}>
          <div />
          {compareModels.map((m) => {
            const color = COMPANY_COLORS[m.company] || '#00d9ff';
            const url = m.hfId ? `https://huggingface.co/${m.hfId}` : m.officialUrl;
            const label = m.hfId ? 'View on HF' : 'Official Page';
            return (
              <div key={m.id} className="px-2 text-center">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono py-2 px-4 rounded border inline-flex items-center gap-1.5 transition-all"
                    style={{ borderColor: `${color}44`, color, background: `${color}08` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${color}18`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    {label}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/60 text-center">
          <p className="text-[9px] text-slate-600 font-mono">AI Model Tracker · Generated {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

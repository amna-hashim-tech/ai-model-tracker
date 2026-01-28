import { useEffect, useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { isNew, velocityFormatted } from '../services/modelUtils';

function WhatsNewFeed() {
  const { status, COMPANY_COLORS, modelReleases } = useData();
  const { whatsNew, hasActiveFilters, filteredModels } = useFilters();
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const hasGroups = whatsNew.length > 0;

  useEffect(() => {
    if (paused || !hasGroups) return;
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (el.scrollTop >= el.scrollHeight - el.clientHeight - 10) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += 1;
      }
    }, 60);
    return () => clearInterval(interval);
  }, [paused, hasGroups]);

  const filteredCount = filteredModels.length;
  const totalCount = modelReleases.length;

  return (
    <div className={`glass-panel rounded-lg p-3 w-full md:w-80 h-48 flex flex-col ${hasActiveFilters ? 'ring-1 ring-cyan-500/20' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          WHAT'S NEW
          {status === 'ready' && (
            hasActiveFilters ? (
              <span className="text-slate-500 font-normal">
                (<span className="text-cyan-400">{filteredCount}</span> of {totalCount})
              </span>
            ) : (
              <span className="text-slate-600 font-normal">({totalCount})</span>
            )
          )}
        </h3>
        {hasGroups && (
          <button
            onClick={() => setPaused(!paused)}
            className="text-[10px] text-slate-500 hover:text-cyan-400 font-mono transition-colors"
          >
            {paused ? '▶ PLAY' : '❚❚ PAUSE'}
          </button>
        )}
      </div>
      {status === 'loading' ? (
        <div className="flex-1 flex flex-col gap-2 justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-1 rounded-full bg-slate-700 animate-pulse" style={{ minHeight: 24 }} />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-slate-700/60 rounded animate-pulse w-full" />
                <div className="h-2 bg-slate-700/40 rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-hidden space-y-1"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {whatsNew.map((group) => (
            <div key={group.label}>
              <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-1.5 mb-1 flex items-center gap-2">
                {group.label}
                <span className="text-cyan-400/60">({group.models.length})</span>
              </div>
              {group.models.map((m) => {
                const color = COMPANY_COLORS[m.company] || '#00d9ff';
                const modelIsNew = isNew(m.createdAt);
                return (
                  <div key={m.id} className="flex gap-2 py-1 border-b border-slate-800/30 last:border-0">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color, minHeight: 20 }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-300 truncate">{m.name}</span>
                        {modelIsNew && (
                          <span className="text-[8px] px-1 py-0 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex-shrink-0">NEW</span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono flex items-center gap-1.5 mt-0.5">
                        <span style={{ color }}>{m.company}</span>
                        <span>·</span>
                        {m.source === 'official' ? (
                          <span className="text-orange-400/70">API only</span>
                        ) : (
                          <>
                            <span>↓{m.downloadsFormatted}</span>
                            <span>·</span>
                            <span>{velocityFormatted(m)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {!hasGroups && (
            <div className="flex-1 flex items-center justify-center text-[11px] text-slate-600">No models found</div>
          )}
        </div>
      )}
    </div>
  );
}

function SmartInsights({ onApplyFilter }) {
  const { smartInsights, hasActiveFilters, filteredModels } = useFilters();
  const { COMPANY_COLORS, modelReleases } = useData();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (smartInsights.length === 0) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % smartInsights.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [smartInsights.length]);

  if (smartInsights.length === 0) return null;
  const insight = smartInsights[active] || smartInsights[0];

  return (
    <div className={`glass-panel rounded-lg p-3 w-full md:w-80 h-48 flex flex-col ${hasActiveFilters ? 'ring-1 ring-cyan-500/20' : ''}`}>
      <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-2 flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
        DISCOVER
        {hasActiveFilters && <span className="text-[8px] text-cyan-500/70 font-normal ml-auto">FILTERED</span>}
      </h3>
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          {smartInsights.map((ins, i) => (
            <button
              key={ins.key}
              onClick={() => setActive(i)}
              className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                i === active
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {ins.icon} {ins.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 mb-2">{insight.subtitle}</p>
          <div className="flex flex-col gap-1.5">
            {insight.models.map((m, i) => {
              const color = COMPANY_COLORS[m.company] || '#00d9ff';
              return (
                <div key={m.id} className="flex items-center gap-2 py-1 px-2 rounded bg-slate-900/40 border border-slate-800/30">
                  <span className="text-[10px] text-slate-600 font-mono w-3">{i + 1}.</span>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-slate-300 truncate flex-1">{m.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">
                    {m.source === 'official' && !m.downloads
                      ? 'API only'
                      : insight.key === 'trending' || insight.key === 'rising'
                        ? velocityFormatted(m)
                        : insight.key === 'favorites'
                          ? `♥${m.likes}`
                          : m.downloadsFormatted}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BottomPanels() {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 flex flex-col md:flex-row gap-3 justify-center items-end md:items-stretch pointer-events-none">
      <div className="pointer-events-auto md:ml-56">
        <WhatsNewFeed />
      </div>
      <div className="pointer-events-auto">
        <SmartInsights />
      </div>
    </div>
  );
}

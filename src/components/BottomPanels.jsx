import { useEffect, useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { insights } from '../data/companyMapping';

function LiveUpdatesFeed() {
  const { liveUpdates, status, COMPANY_COLORS } = useData();
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const items = status === 'ready' && liveUpdates.length > 0
    ? liveUpdates
    : [];

  useEffect(() => {
    if (paused || items.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (el.scrollTop >= el.scrollHeight - el.clientHeight - 10) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += 1;
      }
    }, 50);
    return () => clearInterval(interval);
  }, [paused, items.length]);

  return (
    <div className="glass-panel rounded-lg p-3 w-full md:w-80 h-44 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          RECENT RELEASES
          {status === 'ready' && (
            <span className="text-slate-600 font-normal">({items.length})</span>
          )}
        </h3>
        {items.length > 0 && (
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
          className="flex-1 overflow-hidden space-y-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Duplicate list for seamless scrolling */}
          {[...items, ...items].map((update, i) => (
            <div
              key={i}
              className="flex gap-2 py-1.5 border-b border-slate-800/50 last:border-0"
            >
              <div
                className="w-1 rounded-full flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: COMPANY_COLORS[update.company] || '#00d9ff',
                  height: '100%',
                  minHeight: '24px',
                }}
              />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {update.text}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                  {update.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightsCards() {
  const { modelReleases, companies, status } = useData();
  const [active, setActive] = useState(0);

  // Compute dynamic insights when data is ready
  const dynamicInsights = status === 'ready' ? (() => {
    const totalDownloads = modelReleases.reduce((sum, m) => sum + (m.downloads || 0), 0);
    const totalLikes = modelReleases.reduce((sum, m) => sum + (m.likes || 0), 0);
    const openSource = modelReleases.filter((m) => m.openSource).length;
    const fmtDl = totalDownloads >= 1e9
      ? `${(totalDownloads / 1e9).toFixed(1)}B`
      : totalDownloads >= 1e6
        ? `${(totalDownloads / 1e6).toFixed(0)}M`
        : `${(totalDownloads / 1e3).toFixed(0)}K`;

    return [
      {
        title: 'Total Tracked Downloads',
        text: `Across ${modelReleases.length} models from ${companies.length} organizations tracked on Hugging Face.`,
        metric: fmtDl,
        metricLabel: 'cumulative downloads',
      },
      {
        title: 'Community Engagement',
        text: `The tracked models have received ${totalLikes.toLocaleString()} likes from the Hugging Face community.`,
        metric: totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}K` : String(totalLikes),
        metricLabel: 'total community likes',
      },
      {
        title: 'Open-Source Dominance',
        text: `${openSource} of ${modelReleases.length} tracked models have open weights available for download and research.`,
        metric: `${Math.round((openSource / Math.max(modelReleases.length, 1)) * 100)}%`,
        metricLabel: 'models are open-source',
      },
      ...insights,
    ];
  })() : insights;

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % dynamicInsights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [dynamicInsights.length]);

  const insight = dynamicInsights[active] || dynamicInsights[0];

  return (
    <div className="glass-panel rounded-lg p-3 w-full md:w-80 h-44 flex flex-col">
      <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono mb-2 flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        AI INSIGHTS
      </h3>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">
            {insight.title}
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {insight.text}
          </p>
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {insight.metric}
            </span>
            <span className="text-[10px] text-slate-500 ml-1.5 block">
              {insight.metricLabel}
            </span>
          </div>
          <div className="flex gap-1">
            {dynamicInsights.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === active
                    ? 'bg-cyan-400 w-4'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
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
        <LiveUpdatesFeed />
      </div>
      <div className="pointer-events-auto">
        <InsightsCards />
      </div>
    </div>
  );
}

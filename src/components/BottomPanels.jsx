import { useEffect, useRef, useState } from 'react';
import { liveUpdates, insights, COMPANY_COLORS } from '../data/mockData';

function LiveUpdatesFeed() {
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
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
  }, [paused]);

  return (
    <div className="glass-panel rounded-lg p-3 w-full md:w-80 h-44 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold tracking-widest text-cyan-400 font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE UPDATES
        </h3>
        <button
          onClick={() => setPaused(!paused)}
          className="text-[10px] text-slate-500 hover:text-cyan-400 font-mono transition-colors"
        >
          {paused ? '▶ PLAY' : '❚❚ PAUSE'}
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden space-y-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {[...liveUpdates, ...liveUpdates].map((update, i) => (
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
    </div>
  );
}

function InsightsCards() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % insights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const insight = insights[active];

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
            {insights.map((_, i) => (
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

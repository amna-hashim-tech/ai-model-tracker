import { useState } from 'react';

export default function TopBar({ onToggleFullscreen }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    onToggleFullscreen?.();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-[rgba(10,14,26,0.85)] backdrop-blur-md border-b border-[rgba(0,217,255,0.15)]">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wider text-cyan-300 font-mono hidden sm:inline">
            AI MODEL TRACKER
          </span>
          <span className="text-sm font-bold tracking-wider text-cyan-300 font-mono sm:hidden">
            AI TRACKER
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono hidden md:inline border border-slate-700 rounded px-1.5 py-0.5">
          LIVE
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopyLink}
          className="p-2 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-[rgba(0,217,255,0.1)] transition-all duration-200"
          title="Copy link"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
        </button>

        <button
          onClick={handleFullscreen}
          className="p-2 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-[rgba(0,217,255,0.1)] transition-all duration-200"
          title="Fullscreen"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
      </div>
    </header>
  );
}

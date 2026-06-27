interface ScanAnimationProps {
  isActive: boolean;
}

export default function ScanAnimation({ isActive }: ScanAnimationProps) {
  return (
    <div className="relative flex items-center justify-center w-40 h-40" aria-hidden="true">
      {/* Outer pulse rings */}
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-brand-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-4 rounded-full border border-brand-400/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        </>
      )}

      {/* Main circle */}
      <div
        className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
          isActive
            ? 'bg-brand-500/20 border-2 border-brand-400/60 shadow-glow'
            : 'bg-white/5 border-2 border-white/20'
        }`}
      >
        {/* Human silhouette SVG */}
        <svg
          className={`w-12 h-12 transition-all duration-300 ${isActive ? 'text-brand-300' : 'text-white/40'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {/* Head */}
          <circle cx="12" cy="4" r="2.5" />
          {/* Body */}
          <path d="M8 9h8l-1 6h-1l-.5 5h-3l-.5-5H9L8 9z" />
          {/* Legs */}
          <path d="M9.5 15l-.8 5h1l.8-5M14.5 15l.8 5h-1l-.8-5" />
        </svg>

        {/* Scan line overlay */}
        {isActive && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-80 scan-line"
            />
          </div>
        )}
      </div>

      {/* Bottom label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        {isActive ? (
          <span className="text-xs text-brand-300 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Scanning…
          </span>
        ) : (
          <span className="text-xs text-white/30">Ready</span>
        )}
      </div>
    </div>
  );
}

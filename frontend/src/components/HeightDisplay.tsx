import { useEffect, useState } from 'react';

interface HeightDisplayProps {
  height: number;
}

export default function HeightDisplay({ height }: HeightDisplayProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated count-up effect
  useEffect(() => {
    const duration = 1200; // ms
    const start    = Date.now();
    const startVal = displayValue;
    const endVal   = height;

    const animate = () => {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startVal + (endVal - startVal) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  const full = Math.floor(displayValue);
  const dec  = (displayValue - full).toFixed(1).slice(1); // ".x"

  return (
    <div className="flex flex-col items-center" aria-label={`Height: ${height} centimetres`}>
      {/* Main number */}
      <div className="flex items-end justify-center gap-0 animate-number-pop">
        <span className="font-display font-black text-8xl sm:text-9xl leading-none text-gradient-green tabular-nums">
          {full}
        </span>
        <span className="font-display font-bold text-4xl sm:text-5xl text-green-300/60 mb-2 tabular-nums">
          {dec}
        </span>
        <span className="font-display font-bold text-2xl sm:text-3xl text-green-300/50 mb-3 ml-1">
          cm
        </span>
      </div>

      {/* Ruler illustration */}
      <div className="mt-4 flex items-center gap-3 text-white/30">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-green-400/40" />
        <svg className="w-4 h-4 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
        </svg>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-green-400/40" />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import HeightDisplay from '../components/HeightDisplay';

export default function ResultPage() {
  const navigate       = useNavigate();
  const { session, resetSession } = useSession();
  const [showContent, setShowContent] = useState(false);

  const height = session?.height_cm;

  useEffect(() => {
    // Guard: if no height (direct URL access), redirect home
    if (!height) {
      navigate('/', { replace: true });
      return;
    }
    // Slight delay for entrance animation
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, [height, navigate]);

  const handleScanAgain = () => {
    resetSession();
    navigate('/');
  };

  if (!height) return null;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      id="result-main"
    >
      {/* Background glow on success */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-600/15 rounded-full blur-3xl" />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-md w-full transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Success badge */}
        <div className="mb-6 animate-bounce-in">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center shadow-glow-green">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Result Card */}
        <div className="glass-card w-full p-10 mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-6">
            Your Height
          </p>

          <HeightDisplay height={height} />

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="glass-card p-3 rounded-xl">
                <p className="text-white/40 text-xs mb-1">Category</p>
                <p className="text-white font-semibold">{getCategory(height)}</p>
              </div>
              <div className="glass-card p-3 rounded-xl">
                <p className="text-white/40 text-xs mb-1">In Feet</p>
                <p className="text-white font-semibold">{cmToFeetInches(height)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          id="scan-again-button"
          onClick={handleScanAgain}
          className="btn-primary w-full max-w-xs mb-4"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Scan Again
          </span>
        </button>

        <p className="text-xs text-white/20 font-mono">
          Session complete · No data retained
        </p>
      </div>
    </main>
  );
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet   = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
}

function getCategory(cm: number): string {
  if (cm < 150) return 'Short';
  if (cm < 165) return 'Below Average';
  if (cm < 175) return 'Average';
  if (cm < 185) return 'Above Average';
  return 'Tall';
}

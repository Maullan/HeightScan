import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorialModal from '../components/TutorialModal';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  const handleDetect = () => {
    if (!user) {
      // Not logged in → go to login, then come back to /measure
      navigate('/login', { state: { from: { pathname: '/measure' } } });
      return;
    }
    // Logged in → show tutorial as usual
    setShowTutorial(true);
  };

  const handleUnderstand = () => {
    setShowTutorial(false);
    navigate('/measure');
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      id="landing-main"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      {/* User indicator — top-right corner */}
      {!isLoading && user && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono hidden sm:block max-w-[180px] truncate">
            {user.email}
          </span>
          <button
            id="logout-button"
            onClick={signOut}
            aria-label="Logout"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-white/50 border border-white/10 bg-white/5 backdrop-blur-sm
                       hover:bg-white/10 hover:text-white/80 hover:border-white/20
                       transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
            Logout
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full animate-slide-up">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center shadow-glow animate-float">
            <svg className="w-12 h-12 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-brand-400/20 animate-ping-slow" />
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight mb-4 text-gradient">
          HeightScan
        </h1>
        <p className="text-lg sm:text-xl text-white/60 mb-3 font-light leading-relaxed">
          Instant &amp; accurate height measurement
          <br />
          powered by IoT ultrasonic sensing.
        </p>
        <p className="text-sm text-white/30 mb-12 font-mono tracking-wider uppercase">
          Stand · Scan · Read
        </p>

        {/* CTA Button */}
        <button
          id="detect-button"
          onClick={handleDetect}
          className="btn-primary text-lg px-12 py-5 shadow-glow"
          aria-label="Start height detection"
        >
          <span className="relative z-10 flex items-center gap-3 font-display font-semibold text-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Detect
          </span>
        </button>

        {/* Auth hint when not logged in */}
        {!isLoading && !user && (
          <p className="mt-4 text-xs text-white/25">
            Login diperlukan untuk memulai pengukuran
          </p>
        )}

        {/* Features row */}
        <div className="mt-16 grid grid-cols-3 gap-4 w-full max-w-sm">
          {[
            { icon: '⚡', label: 'Real-time' },
            { icon: '🎯', label: 'Accurate' },
            { icon: '🔒', label: 'Private' },
          ].map((f) => (
            <div key={f.label} className="glass-card p-3 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-xs text-white/50 font-medium">{f.label}</div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-xs text-white/20 font-mono">
          No data stored · Session-based · Open source
        </p>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal
          onClose={() => setShowTutorial(false)}
          onUnderstand={handleUnderstand}
        />
      )}
    </main>
  );
}

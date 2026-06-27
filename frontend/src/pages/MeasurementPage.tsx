import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useWebSocket } from '../context/WebSocketContext';
import ScanAnimation from '../components/ScanAnimation';
import StatusBadge from '../components/StatusBadge';
import ErrorCard from '../components/ErrorCard';

export default function MeasurementPage() {
  const navigate          = useNavigate();
  const { session, isLoading, error, startSession, updateStatus, resetSession } = useSession();
  const { isConnected, lastMessage, connect, disconnect, connectionError }      = useWebSocket();
  const hasStarted = useRef(false);

  // --- Start session on mount ---
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Connect WebSocket after session created ---
  useEffect(() => {
    if (session?.session_id) {
      connect(session.session_id);
    }
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.session_id]);

  // --- Handle incoming WebSocket messages ---
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.status === 'done' && lastMessage.height_cm != null) {
      updateStatus('done', lastMessage.height_cm);
      disconnect();
      navigate('/result');
    } else if (lastMessage.status === 'measuring') {
      updateStatus('measuring');
    } else if (lastMessage.status === 'error') {
      updateStatus('error', undefined, lastMessage.error_msg ?? 'Measurement failed');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  const handleStart = async () => {
    const id = await startSession();
    if (!id) return; // error already set in context
  };

  const handleRetry = () => {
    resetSession();
    hasStarted.current = false;
    disconnect();
    handleStart();
  };

  const handleBack = () => {
    resetSession();
    disconnect();
    navigate('/');
  };

  // Determine current display state
  const status     = session?.status ?? 'waiting';
  const isMeasuring = status === 'measuring';
  const isWaiting   = status === 'waiting';
  const isError     = status === 'error' || !!error || !!connectionError;

  const statusLabel: Record<string, string> = {
    waiting:   'Initialising…',
    measuring: 'Measuring your height…',
    done:      'Complete!',
    error:     'Error',
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      id="measurement-main"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gradient mb-2">Height Scan</h1>
          <p className="text-white/40 text-sm">Session-based · Real-time measurement</p>
        </div>

        {/* Main Card */}
        <div className="glass-card w-full p-8 mb-6">

          {/* Loading / Measuring animation */}
          {isLoading || isWaiting || isMeasuring ? (
            <div className="flex flex-col items-center gap-6">
              <ScanAnimation isActive={isMeasuring || isLoading} />

              <div>
                <StatusBadge status={isMeasuring ? 'measuring' : 'waiting'} />
                <p className="mt-3 text-lg font-medium text-white/90">
                  {isLoading ? 'Starting session…' : statusLabel[status]}
                </p>
                {isMeasuring && (
                  <p className="mt-2 text-sm text-white/40">
                    Stand still below the sensor
                  </p>
                )}
              </div>

              {/* WebSocket indicator */}
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}
                />
                {isConnected ? 'Live connection active' : 'Connecting…'}
              </div>
            </div>
          ) : isError ? (
            <ErrorCard
              message={error ?? connectionError ?? session?.error_msg ?? 'Unknown error'}
              onRetry={handleRetry}
            />
          ) : null}
        </div>

        {/* Instructions */}
        {!isError && (
          <div className="glass-card w-full p-4 mb-6">
            <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">Instructions</h2>
            <ol className="space-y-2 text-sm text-white/70 text-left">
              {[
                'Stand directly below the sensor',
                'Keep your posture straight',
                'Look forward, not up',
                'Stay still until the scan completes',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-500/30 text-brand-300 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Session ID debug info */}
        {session?.session_id && (
          <p className="text-xs text-white/15 font-mono">
            Session: {session.session_id.slice(0, 8)}…
          </p>
        )}

        {/* Back button */}
        <button
          id="back-button"
          onClick={handleBack}
          className="mt-6 btn-secondary text-sm"
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Session, SessionStatus } from '../types';
import { startSession as apiStartSession } from '../services/api';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface SessionContextValue {
  session:      Session | null;
  isLoading:    boolean;
  error:        string | null;
  startSession: () => Promise<string | null>;
  updateStatus: (status: SessionStatus, height_cm?: number, error_msg?: string) => void;
  resetSession: () => void;
}

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

const SessionContext = createContext<SessionContextValue | null>(null);

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session,   setSession]   = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const startSession = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiStartSession();
      const newSession: Session = {
        session_id:  response.session_id,
        status:      response.status,
        height_cm:   null,
        distance_cm: null,
        error_msg:   null,
      };
      setSession(newSession);
      return response.session_id;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to start session. Is the backend running?';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = useCallback(
    (status: SessionStatus, height_cm?: number, error_msg?: string) => {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status,
              height_cm:  height_cm  ?? prev.height_cm,
              error_msg:  error_msg  ?? prev.error_msg,
            }
          : null
      );
    },
    []
  );

  const resetSession = useCallback(() => {
    setSession(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, isLoading, error, startSession, updateStatus, resetSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

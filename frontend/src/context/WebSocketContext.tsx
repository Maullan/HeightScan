import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { WebSocketMessage } from '../types';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface WebSocketContextValue {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connect: (sessionId: string) => void;
  disconnect: () => void;
  connectionError: string | null;
}

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef             = useRef<WebSocket | null>(null);
  const retriesRef        = useRef(0);
  const sessionIdRef      = useRef<string | null>(null);
  const retryTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isConnected,     setIsConnected]     = useState(false);
  const [lastMessage,     setLastMessage]     = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const disconnect = useCallback(() => {
    clearRetryTimer();
    sessionIdRef.current = null;
    retriesRef.current   = 0;
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  const connect = useCallback((sessionId: string) => {
    // Close any existing connection first
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    clearRetryTimer();
    sessionIdRef.current = sessionId;
    retriesRef.current   = 0;
    setConnectionError(null);

    const openConnection = () => {
      const sid = sessionIdRef.current;
      if (!sid) return;

      const url = `${WS_BASE_URL}/ws/${sid}`;
      console.log(`[WS] Connecting to ${url} (attempt ${retriesRef.current + 1})`);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        retriesRef.current = 0;
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data as string);
          console.log('[WS] Message:', msg);
          setLastMessage(msg);
        } catch (err) {
          console.error('[WS] Failed to parse message', err);
        }
      };

      ws.onerror = () => {
        console.error('[WS] Connection error');
      };

      ws.onclose = (event) => {
        console.warn('[WS] Closed', event.code, event.reason);
        setIsConnected(false);

        // Don't reconnect if explicitly closed (code 1000/4004) or max retries hit
        if (event.code === 4004 || event.code === 1000) {
          if (event.code === 4004) {
            setConnectionError('Session not found.');
          }
          return;
        }

        if (retriesRef.current < MAX_RETRIES && sessionIdRef.current) {
          retriesRef.current++;
          const delay = RETRY_DELAY_MS * retriesRef.current;
          console.log(`[WS] Retrying in ${delay}ms (${retriesRef.current}/${MAX_RETRIES})`);
          retryTimerRef.current = setTimeout(openConnection, delay);
        } else {
          setConnectionError('WebSocket connection lost. Please try scanning again.');
        }
      };
    };

    openConnection();
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ isConnected, lastMessage, connect, disconnect, connectionError }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
}

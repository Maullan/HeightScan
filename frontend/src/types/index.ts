// Shared TypeScript types across the application

export type SessionStatus = 'waiting' | 'measuring' | 'done' | 'error';

export interface Session {
  session_id: string;
  status: SessionStatus;
  height_cm?: number | null;
  distance_cm?: number | null;
  error_msg?: string | null;
}

export interface SessionStartResponse {
  session_id: string;
  status: SessionStatus;
  message: string;
}

export interface SensorResultRequest {
  height_cm: number;
  distance_cm: number;
}

export interface WebSocketMessage {
  type: 'status_update';
  session_id: string;
  status: SessionStatus;
  height_cm?: number;
  error_msg?: string;
}

export interface ApiError {
  detail: string;
}

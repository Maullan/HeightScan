import axios from 'axios';
import type { SessionStartResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const API_KEY      = import.meta.env.VITE_API_KEY ?? 'dev-secret-api-key';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key':    API_KEY,
  },
  timeout: 15_000,
});

// Response interceptor for consistent error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.response?.data ?? error.message);
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------------
// Session API
// ------------------------------------------------------------------

/** Create a new measurement session. */
export async function startSession(): Promise<SessionStartResponse> {
  const { data } = await apiClient.post<SessionStartResponse>('/api/sessions/start');
  return data;
}

/** Fetch current state of a session (used after reconnection). */
export async function getSessionStatus(sessionId: string) {
  const { data } = await apiClient.get(`/api/sessions/${sessionId}`);
  return data;
}

/** Health check */
export async function healthCheck() {
  const { data } = await apiClient.get('/api/health');
  return data;
}

export default apiClient;

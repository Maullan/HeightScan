# System Architecture

## Overview

HeightScan is a real-time IoT height measurement system. It uses an HC-SR04 ultrasonic sensor mounted on an ESP32 to measure height, with results streamed to a React web app via WebSocket.

## Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                   USER DEVICE                        │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │           React SPA (Vite + TS)            │      │
│  │                                            │      │
│  │  Landing → Tutorial → Measurement → Result │      │
│  │                                            │      │
│  │  SessionContext  │  WebSocketContext        │      │
│  │       ↓                  ↓                 │      │
│  │   Axios HTTP       Native WebSocket        │      │
│  └──────────┬───────────────┬─────────────────┘      │
│             │               │                         │
└─────────────┼───────────────┼─────────────────────────┘
              │ REST          │ WS
              ▼               ▼
┌─────────────────────────────────────────────────────┐
│               FastAPI Backend (Python 3.12)          │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ REST API     │  │  WebSocket   │                 │
│  │ /api/        │  │  /ws/{id}    │                 │
│  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                          │
│  ┌──────▼─────────────────▼───────┐                 │
│  │        SessionManager          │                 │
│  │   (in-memory, asyncio.Lock)    │                 │
│  └──────────────────┬─────────────┘                 │
│                     │                               │
│  ┌──────────────────▼─────────────┐                 │
│  │       ConnectionManager        │                 │
│  │    (WebSocket per session)     │                 │
│  └────────────────────────────────┘                 │
│                     │                               │
│  ┌──────────────────▼─────────────┐                 │
│  │         ESP32Client            │                 │
│  │    (httpx async HTTP)          │                 │
│  └──────────────────┬─────────────┘                 │
└─────────────────────┼─────────────────────────────────┘
                      │ HTTP POST /trigger
                      ▼
┌─────────────────────────────────────────────────────┐
│              ESP32 + HC-SR04                         │
│                                                      │
│  WebServer → handleTrigger                          │
│       ↓                                             │
│  readMedianDistanceCm (10 samples)                  │
│       ↓                                             │
│  calculateHeight (Ref − Distance)                   │
│       ↓                                             │
│  postResult → HTTP POST /api/sessions/{id}/result   │
└─────────────────────────────────────────────────────┘
```

## Data Flow

1. User scans QR code → opens `http://<server>/`
2. Clicks "Detect" → Tutorial modal
3. Clicks "I Understand" → navigates to `/measure`
4. Frontend calls `POST /api/sessions/start`
5. Backend creates session, calls ESP32 `POST /trigger`
6. Frontend connects WebSocket `/ws/{session_id}`
7. ESP32 reads HC-SR04 (10x, median filter)
8. ESP32 calls `POST /api/sessions/{id}/result` with height_cm
9. Backend validates (50–250 cm), updates session, broadcasts via WebSocket
10. Frontend receives WS message, navigates to `/result`
11. Result page displays height with count-up animation

## Session Lifecycle

```
WAITING → MEASURING → DONE
                    ↘ ERROR
```

Sessions auto-expire after 5 minutes (configurable via `SESSION_TTL_SECONDS`).

## Security Boundaries

- All REST endpoints require `X-API-Key` header
- Rate limiting: 100 requests/minute per IP (slowapi)
- CORS: allow-listed origins only
- Input validation: Pydantic schemas reject out-of-range values
- WebSocket: session must exist before connection accepted

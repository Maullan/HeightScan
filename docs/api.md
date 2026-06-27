# API Documentation

## Base URL

```
http://<host>:8000
```

## Authentication

All endpoints except `GET /api/health` require the `X-API-Key` header.

```
X-API-Key: your-secret-api-key
```

---

## REST Endpoints

### `GET /api/health`

Health check — no authentication required.

**Response 200:**
```json
{
  "status": "ok",
  "app_name": "Height Measurement System",
  "version": "1.0.0",
  "timestamp": "2026-06-27T04:00:00.000000"
}
```

---

### `POST /api/sessions/start`

Create a new measurement session and trigger the ESP32.

**Headers:**
```
X-API-Key: <key>
Content-Type: application/json
```

**Response 201:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "measuring",
  "message": "Measurement started. Stand below the sensor."
}
```

**Response 201 (ESP32 offline):**
```json
{
  "session_id": "550e8400-...",
  "status": "waiting",
  "message": "ESP32 is offline. Please ensure the device is powered on."
}
```

**Response 403:**
```json
{ "detail": "Invalid or missing API key." }
```

**Response 429:**
```
Rate limit exceeded (100/minute)
```

---

### `POST /api/sessions/{session_id}/result`

Called by the ESP32 after completing a measurement.

**Path parameter:** `session_id` — UUID string

**Headers:**
```
X-API-Key: <key>
Content-Type: application/json
```

**Request body:**
```json
{
  "height_cm": 175.5,
  "distance_cm": 74.5
}
```

| Field        | Type  | Required | Constraints            |
|--------------|-------|----------|------------------------|
| height_cm    | float | yes      | 50.0 ≤ x ≤ 250.0 cm   |
| distance_cm  | float | yes      | 0 < x ≤ 250.0 cm      |

**Response 200:**
```json
{
  "success": true,
  "session_id": "550e8400-...",
  "message": "Result received and broadcast successfully."
}
```

**Response 404:**
```json
{ "detail": "Session '...' not found or has expired." }
```

**Response 409:**
```json
{ "detail": "Session already has a result." }
```

**Response 422:** Validation error (height out of range).

---

### `GET /api/sessions/{session_id}`

Get current session state (useful after WebSocket reconnection).

**Response 200:**
```json
{
  "session_id": "550e8400-...",
  "status": "done",
  "height_cm": 175.5,
  "distance_cm": 74.5,
  "error_msg": null
}
```

---

## WebSocket

### `WS /ws/{session_id}`

Subscribe to real-time session status updates.

**Connection:** `ws://<host>:8000/ws/{session_id}`

The server closes with code **4004** if the session does not exist.

---

### Messages (Server → Client)

All messages are JSON objects:

**Status Update:**
```json
{
  "type": "status_update",
  "session_id": "550e8400-...",
  "status": "measuring"
}
```

**Done with height:**
```json
{
  "type": "status_update",
  "session_id": "550e8400-...",
  "status": "done",
  "height_cm": 175.5
}
```

**Error:**
```json
{
  "type": "status_update",
  "session_id": "550e8400-...",
  "status": "error",
  "error_msg": "Sensor timeout"
}
```

### Status Values

| Status     | Meaning                              |
|------------|--------------------------------------|
| `waiting`  | Session created, ESP32 not yet ready |
| `measuring`| ESP32 triggered, measurement ongoing |
| `done`     | Height measured, result available    |
| `error`    | Something went wrong                 |

---

## ESP32 Endpoints (served by firmware)

### `POST /trigger`

Called by the backend to initiate a measurement.

**Request body:**
```json
{ "session_id": "550e8400-..." }
```

**Response 200:**
```json
{ "status": "ok", "message": "Measurement triggered" }
```

### `GET /health`

Check if the ESP32 is alive.

**Response 200:**
```json
{
  "status": "ok",
  "ip": "192.168.1.100",
  "uptime_ms": 123456,
  "measuring": false
}
```

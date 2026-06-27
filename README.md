# HeightScan 📏

> **Real-time IoT Height Measurement System**
> ESP32 + HC-SR04 · FastAPI · React · WebSocket

---

## Overview

HeightScan is a complete, production-quality IoT system that measures human height using an HC-SR04 ultrasonic sensor mounted on an ESP32 microcontroller. Results are streamed in real-time to a React web application via WebSocket.

**No login. No database. No data retention.** Everything is session-based.

---

## System Flow

```
QR Code → Landing → Tutorial → Measurement → Result
                                    ↕ WebSocket
                              FastAPI Backend
                                    ↕ HTTP REST
                               ESP32 + HC-SR04
```

---

## Project Structure

```
├── backend/                 FastAPI Python backend
│   ├── app/
│   │   ├── api/             REST endpoints
│   │   ├── core/            Config & security
│   │   ├── models/          Domain models
│   │   ├── schemas/         Pydantic schemas
│   │   ├── services/        Session manager & ESP32 client
│   │   ├── websocket/       WS connection manager
│   │   └── utils/           Validators
│   ├── tests/               pytest tests
│   ├── main.py              FastAPI app entry
│   └── requirements.txt
│
├── frontend/                React + Vite + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── components/      UI components
│   │   ├── context/         Session + WebSocket contexts
│   │   ├── pages/           Landing, Measurement, Result
│   │   ├── services/        Axios API client
│   │   └── types/           TypeScript interfaces
│   └── vite.config.ts
│
├── firmware/                ESP32 Arduino firmware
│   └── height_sensor/
│       ├── height_sensor.ino
│       ├── config.h
│       └── README.md
│
├── docs/                    Technical documentation
│   ├── architecture.md
│   ├── api.md
│   ├── sequence_diagram.md
│   ├── class_diagram.md
│   └── deployment.md
│
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your settings
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
# Open http://localhost:5173
```

### 3. Firmware

1. Edit `firmware/height_sensor/config.h` with your WiFi and backend IP
2. Flash to ESP32 using Arduino IDE
3. Install ArduinoJson library v6

---

## Tech Stack

| Layer     | Technology                                           |
|-----------|------------------------------------------------------|
| Frontend  | React 18 · Vite · TypeScript · TailwindCSS 3 · React Router |
| Backend   | Python 3.12 · FastAPI · Uvicorn · Pydantic v2 · asyncio |
| IoT       | ESP32 · HC-SR04 · Arduino Framework · ArduinoJson   |
| Comms     | REST (HTTP) · WebSocket · httpx                     |

---

## Key Features

- ⚡ **Real-time** — WebSocket pushes results instantly, no polling
- 🎯 **Accurate** — 10-sample median filter for noise reduction
- 🔒 **Session-based** — No login, no database, auto-expires
- 🔄 **Auto-reconnect** — WebSocket retries with exponential backoff
- 🛡️ **Validated** — Rejects readings outside 50–250 cm range
- 📱 **Mobile-first** — Responsive design optimized for phones

---

## API Key

Default dev key: `dev-secret-api-key`

**Change it in production!** Set `API_KEY` in `.env`.

All API requests require the header:
```
X-API-Key: your-api-key
```

---

## Testing

```bash
cd backend
pytest tests/ -v
```

---

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Sequence Diagrams](docs/sequence_diagram.md)
- [Class Diagrams](docs/class_diagram.md)
- [Deployment Guide](docs/deployment.md)
- [Firmware Setup](firmware/height_sensor/README.md)

---

## License

MIT License © 2026 HeightScan

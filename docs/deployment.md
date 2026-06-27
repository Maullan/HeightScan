# Deployment Guide

## Prerequisites

| Tool         | Minimum Version |
|--------------|-----------------|
| Python       | 3.12            |
| Node.js      | 18 LTS          |
| npm          | 9+              |
| Arduino IDE  | 2.x             |

---

## 1. Backend Deployment

### Local Development

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env

# Edit .env — set API_KEY, CORS_ORIGINS, ESP32_URL

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production (with Gunicorn + Uvicorn workers)

```bash
pip install gunicorn

gunicorn main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 2 \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Environment Variables (`.env`)

```env
APP_NAME="Height Measurement System"
APP_VERSION="1.0.0"
DEBUG=false

# Must be kept secret!
API_KEY=change-me-to-a-secure-random-string

# Origins allowed to call the API
CORS_ORIGINS=["https://your-domain.com"]

# ESP32 device IP on your LAN
ESP32_URL=http://192.168.1.100
ESP32_TRIGGER_TIMEOUT=10.0

SESSION_TTL_SECONDS=300
MIN_HEIGHT_CM=50.0
MAX_HEIGHT_CM=250.0
REFERENCE_HEIGHT_CM=250.0
RATE_LIMIT_PER_MINUTE=100
```

---

## 2. Frontend Deployment

### Local Development

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Copy environment file
copy .env.example .env

# Edit .env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_API_KEY=dev-secret-api-key

# Start dev server
npm run dev
# Open http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in frontend/dist/

# Serve with any static file server, e.g.:
npm install -g serve
serve -s dist -p 3000
```

### Nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # React SPA
    root /var/www/heightscan/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
```

---

## 3. ESP32 Firmware

1. Open `firmware/height_sensor/height_sensor.ino` in Arduino IDE.
2. Edit `config.h`:
   ```cpp
   #define WIFI_SSID       "YourNetworkName"
   #define WIFI_PASSWORD   "YourPassword"
   #define BACKEND_HOST    "192.168.1.10"   // PC running backend
   #define BACKEND_PORT    8000
   #define BACKEND_API_KEY "change-me-to-a-secure-random-string"
   #define REFERENCE_HEIGHT_CM 250.0f
   ```
3. Install required library: **ArduinoJson** v6 (via Library Manager).
4. Select board: **ESP32 Dev Module**.
5. Upload firmware.
6. Open Serial Monitor (115200 baud) to verify connection.

---

## 4. Network Requirements

All three components must be on the **same local network**:

```
[PC / Server]  ←HTTP→  [React Browser]
[PC / Server]  ←HTTP→  [ESP32]
[PC / Server]  ←WS→    [React Browser]
```

- Backend must be reachable at the IP you configured in `config.h`.
- Ensure no firewall blocks port 8000.
- ESP32 must be on same WiFi SSID.

---

## 5. QR Code Generation

Generate a QR code pointing to your frontend URL:

```
https://your-domain.com/
```

Use any QR generator (qr-code-generator.com, qrcode.react, etc.).

Print and mount near the measurement station.

---

## 6. Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

---

## 7. Systemd Service (Linux, Production)

```ini
# /etc/systemd/system/heightscan.service
[Unit]
Description=HeightScan FastAPI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/heightscan/backend
EnvironmentFile=/opt/heightscan/backend/.env
ExecStart=/opt/heightscan/venv/bin/gunicorn main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 2 \
    --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable heightscan
sudo systemctl start heightscan
```

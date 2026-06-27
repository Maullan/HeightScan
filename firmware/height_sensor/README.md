# ESP32 Firmware — HeightScan

## Hardware Required

| Component       | Quantity | Notes                          |
|-----------------|----------|--------------------------------|
| ESP32 (any variant) | 1    | 38-pin or 30-pin, 4MB flash   |
| HC-SR04 sensor  | 1        | 5V-tolerant or 3.3V version   |
| LED (optional)  | 2        | Status indicators              |
| Resistors 220Ω  | 2        | For LEDs                       |
| USB cable       | 1        | Programming                    |
| 5V power supply | 1        | For HC-SR04                    |

## Wiring Diagram

```
HC-SR04        ESP32
-------        -----
VCC     →  5V  (or 3.3V for 3.3V version)
GND     →  GND
TRIG    →  GPIO5
ECHO    →  GPIO18  (use voltage divider for 5V sensors!)
```

> ⚠️ **Important**: HC-SR04 ECHO pin outputs 5V. Use a voltage divider (1kΩ + 2kΩ) to convert to 3.3V for ESP32 GPIO protection.

### Voltage Divider for ECHO pin:
```
HC-SR04 ECHO ─── 1kΩ ─── GPIO18 (ESP32)
                           │
                          2kΩ
                           │
                          GND
```

## Arduino IDE Setup

1. Install ESP32 board package:
   - File → Preferences → Additional Boards Manager URLs:
   - `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board Manager → search "esp32" → Install

2. Install libraries (Tools → Manage Libraries):
   - **ArduinoJson** by Benoit Blanchon (v6.x)

3. Select board: Tools → Board → ESP32 Dev Module

4. Select port: Tools → Port → COMx

## Configuration

Edit `config.h` before flashing:

```cpp
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"
#define BACKEND_HOST    "192.168.1.10"   // Your PC's IP running FastAPI
#define BACKEND_PORT    8000
#define BACKEND_API_KEY "your-api-key"
#define REFERENCE_HEIGHT_CM 250.0f       // Floor to sensor distance
```

## Calibration

1. Mount the HC-SR04 sensor face-down at a known height from the floor.
2. Measure the exact distance from sensor face to floor.
3. Set `REFERENCE_HEIGHT_CM` to that value.
4. Test with a known object to verify.

## LED Status Codes

| Pattern            | Meaning              |
|--------------------|----------------------|
| Fast blink 200ms   | Connecting to WiFi   |
| Heartbeat 1/2s     | Idle, waiting        |
| Solid ON           | Measuring            |
| 3× fast blink      | Success              |
| 5× fast blink      | Error                |

## Serial Monitor

Set baud rate to **115200** to view diagnostic output.

#pragma once

// ============================================================
// WiFi Configuration
// ============================================================
#define WIFI_SSID       "NAMA_WIFI_KAMU"      // ← Ganti dengan nama WiFi kamu
#define WIFI_PASSWORD   "PASSWORD_WIFI_KAMU"   // ← Ganti dengan password WiFi
#define WIFI_TIMEOUT_MS 20000

// ============================================================
// Backend Configuration
// ============================================================
#define BACKEND_HOST    "192.168.1.13"   // ← IP PC kamu (hasil ipconfig)
#define BACKEND_PORT    8000
#define BACKEND_API_KEY "dev-secret-api-key"

// API endpoints
#define ENDPOINT_RESULT "/api/sessions/%s/result"

// ============================================================
// Sensor Configuration (HC-SR04)
// ============================================================
#define TRIG_PIN       5    // GPIO5 — Trigger
#define ECHO_PIN       18   // GPIO18 — Echo
#define SENSOR_SAMPLES 10   // Number of readings for median filter

// Sensor limits (cm)
#define SENSOR_MAX_DISTANCE_CM  400
#define SENSOR_MIN_DISTANCE_CM  2
#define SENSOR_TIMEOUT_US       30000   // 30ms timeout for echo

// ============================================================
// Physical Setup
// ============================================================
// Distance from sensor to floor (adjust to your installation)
#define REFERENCE_HEIGHT_CM     250.0f

// Validation range for reported height
#define MIN_VALID_HEIGHT_CM     50.0f
#define MAX_VALID_HEIGHT_CM     250.0f

// ============================================================
// LED Indicators
// ============================================================
#define LED_BUILTIN_PIN     2    // Built-in LED (most ESP32 boards)
#define LED_WIFI_PIN        4    // External: WiFi status (optional)
#define LED_SENSOR_PIN      12   // External: Measuring indicator (optional)

// ============================================================
// HTTP Server (for trigger endpoint)
// ============================================================
#define HTTP_SERVER_PORT    80

// ============================================================
// Timing
// ============================================================
#define MEASUREMENT_SETTLE_MS   500   // Wait before taking readings
#define READING_INTERVAL_MS     50    // Delay between samples
#define POST_RETRY_COUNT        3     // Retries for result POST
#define POST_RETRY_DELAY_MS     1000

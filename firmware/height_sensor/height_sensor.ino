/**
 * HeightScan ESP32 Firmware
 * ============================================================
 * Hardware  : ESP32 + HC-SR04 Ultrasonic Sensor
 * Framework : Arduino (ESP32 Arduino Core)
 * Libraries : WebServer, WiFi, HTTPClient, ArduinoJson
 *
 * Workflow:
 *   1. Connect to WiFi
 *   2. Start HTTP server, expose POST /trigger endpoint
 *   3. On trigger: read HC-SR04 (10 samples, median filter)
 *   4. Calculate height = REFERENCE_HEIGHT_CM − distance
 *   5. POST result to FastAPI backend
 *   6. Signal LED status
 *
 * LED Codes:
 *   - Fast blink (200ms) : Connecting to WiFi
 *   - Slow blink (1000ms): Idle / waiting for trigger
 *   - Solid ON           : Measuring
 *   - 3x fast blink      : Success
 *   - 5x fast blink      : Error
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <algorithm>
#include "config.h"

// ============================================================
// Globals
// ============================================================
WebServer server(HTTP_SERVER_PORT);

volatile bool  triggerReceived = false;
String         pendingSessionId = "";
bool           isMeasuring     = false;

// ============================================================
// LED Utilities
// ============================================================
void ledBlink(int pin, int times, int onMs, int offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(onMs);
    digitalWrite(pin, LOW);
    delay(offMs);
  }
}

void ledSolid(int pin, bool on) {
  digitalWrite(pin, on ? HIGH : LOW);
}

// ============================================================
// WiFi
// ============================================================
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to '%s'...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startMs = millis();
  while (WiFi.status() != WL_CONNECTED) {
    ledBlink(LED_BUILTIN_PIN, 1, 200, 200);
    if (millis() - startMs > WIFI_TIMEOUT_MS) {
      Serial.println("[WiFi] Timeout — restarting ESP32");
      ESP.restart();
    }
  }

  Serial.printf("[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  ledBlink(LED_BUILTIN_PIN, 3, 100, 100); // Success signal
}

void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Connection lost — reconnecting...");
    ledSolid(LED_WIFI_PIN, LOW);
    connectWiFi();
    ledSolid(LED_WIFI_PIN, HIGH);
  }
}

// ============================================================
// HC-SR04 Sensor
// ============================================================

/**
 * Take a single distance reading in centimetres.
 * Returns -1.0 if measurement times out or is out of range.
 */
float readDistanceCm() {
  // Trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo pulse duration
  long duration = pulseIn(ECHO_PIN, HIGH, SENSOR_TIMEOUT_US);
  if (duration == 0) {
    Serial.println("[Sensor] Echo timeout");
    return -1.0f;
  }

  // Speed of sound: 340 m/s → distance = duration * 0.0343 / 2
  float distanceCm = (duration * 0.0343f) / 2.0f;

  if (distanceCm < SENSOR_MIN_DISTANCE_CM || distanceCm > SENSOR_MAX_DISTANCE_CM) {
    Serial.printf("[Sensor] Out of range: %.1f cm\n", distanceCm);
    return -1.0f;
  }

  return distanceCm;
}

/**
 * Take SENSOR_SAMPLES readings and return the median.
 * Returns -1.0 if insufficient valid readings.
 */
float readMedianDistanceCm() {
  float readings[SENSOR_SAMPLES];
  int   validCount = 0;

  for (int i = 0; i < SENSOR_SAMPLES; i++) {
    float d = readDistanceCm();
    if (d > 0) {
      readings[validCount++] = d;
    }
    delay(READING_INTERVAL_MS);
  }

  Serial.printf("[Sensor] %d/%d valid readings\n", validCount, SENSOR_SAMPLES);

  if (validCount < SENSOR_SAMPLES / 2) {
    Serial.println("[Sensor] Too many failed readings");
    return -1.0f;
  }

  // Sort for median
  std::sort(readings, readings + validCount);
  float median;
  if (validCount % 2 == 0) {
    median = (readings[validCount / 2 - 1] + readings[validCount / 2]) / 2.0f;
  } else {
    median = readings[validCount / 2];
  }

  Serial.printf("[Sensor] Median distance: %.1f cm\n", median);
  return median;
}

// ============================================================
// Height Calculation
// ============================================================
float calculateHeight(float distanceCm) {
  return REFERENCE_HEIGHT_CM - distanceCm;
}

// ============================================================
// Backend Communication
// ============================================================
bool postResult(const String& sessionId, float heightCm, float distanceCm) {
  ensureWiFiConnected();

  char endpoint[128];
  snprintf(endpoint, sizeof(endpoint), ENDPOINT_RESULT, sessionId.c_str());

  String url = String("http://") + BACKEND_HOST + ":" + BACKEND_PORT + endpoint;
  Serial.printf("[HTTP] POST %s\n", url.c_str());

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["height_cm"]   = round(heightCm * 10) / 10.0;
  doc["distance_cm"] = round(distanceCm * 10) / 10.0;

  String payload;
  serializeJson(doc, payload);

  for (int attempt = 1; attempt <= POST_RETRY_COUNT; attempt++) {
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", BACKEND_API_KEY);
    http.setTimeout(10000);

    int statusCode = http.POST(payload);

    if (statusCode == 200) {
      Serial.printf("[HTTP] Success (attempt %d) — HTTP 200\n", attempt);
      http.end();
      return true;
    } else {
      String resp = http.getString();
      Serial.printf("[HTTP] Attempt %d failed — HTTP %d: %s\n", attempt, statusCode, resp.c_str());
      http.end();

      if (attempt < POST_RETRY_COUNT) {
        delay(POST_RETRY_DELAY_MS);
      }
    }
  }

  Serial.println("[HTTP] All POST attempts failed");
  return false;
}

// ============================================================
// HTTP Server — /trigger endpoint
// ============================================================
void handleTrigger() {
  if (isMeasuring) {
    server.send(409, "application/json", "{\"error\":\"Already measuring\"}");
    return;
  }

  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method not allowed\"}");
    return;
  }

  String body = server.arg("plain");
  Serial.printf("[Server] Trigger received. Body: %s\n", body.c_str());

  // Parse session_id from JSON body
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, body);

  if (err || !doc.containsKey("session_id")) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON or missing session_id\"}");
    return;
  }

  pendingSessionId = doc["session_id"].as<String>();
  triggerReceived  = true;

  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Measurement triggered\"}");
  Serial.printf("[Server] Measurement queued for session: %s\n", pendingSessionId.c_str());
}

void handleHealth() {
  StaticJsonDocument<128> doc;
  doc["status"]     = "ok";
  doc["ip"]         = WiFi.localIP().toString();
  doc["uptime_ms"]  = millis();
  doc["measuring"]  = isMeasuring;

  String resp;
  serializeJson(doc, resp);
  server.send(200, "application/json", resp);
}

void handleNotFound() {
  server.send(404, "application/json", "{\"error\":\"Not found\"}");
}

// ============================================================
// Measurement Routine
// ============================================================
void performMeasurement(const String& sessionId) {
  isMeasuring = true;
  ledSolid(LED_BUILTIN_PIN, HIGH);
  ledSolid(LED_SENSOR_PIN, HIGH);

  Serial.println("[Measure] Starting measurement...");
  delay(MEASUREMENT_SETTLE_MS);

  float distanceCm = readMedianDistanceCm();

  if (distanceCm < 0) {
    Serial.println("[Measure] Sensor error — cannot determine distance");
    ledBlink(LED_BUILTIN_PIN, 5, 100, 100); // Error pattern
    isMeasuring = false;
    ledSolid(LED_SENSOR_PIN, LOW);
    return;
  }

  float heightCm = calculateHeight(distanceCm);
  Serial.printf("[Measure] Height: %.1f cm (distance: %.1f cm)\n", heightCm, distanceCm);

  // Validate height range
  if (heightCm < MIN_VALID_HEIGHT_CM || heightCm > MAX_VALID_HEIGHT_CM) {
    Serial.printf("[Measure] Height out of valid range (%.0f–%.0f cm): %.1f\n",
                  MIN_VALID_HEIGHT_CM, MAX_VALID_HEIGHT_CM, heightCm);
    ledBlink(LED_BUILTIN_PIN, 5, 100, 100);
    isMeasuring = false;
    ledSolid(LED_SENSOR_PIN, LOW);
    return;
  }

  bool success = postResult(sessionId, heightCm, distanceCm);

  if (success) {
    Serial.println("[Measure] Result posted successfully");
    ledBlink(LED_BUILTIN_PIN, 3, 200, 100); // Success pattern
  } else {
    Serial.println("[Measure] Failed to post result");
    ledBlink(LED_BUILTIN_PIN, 5, 100, 100); // Error pattern
  }

  isMeasuring = false;
  ledSolid(LED_SENSOR_PIN, LOW);
}

// ============================================================
// Setup
// ============================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== HeightScan Firmware ===");

  // LED pins
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  pinMode(LED_WIFI_PIN,    OUTPUT);
  pinMode(LED_SENSOR_PIN,  OUTPUT);
  ledSolid(LED_BUILTIN_PIN, LOW);
  ledSolid(LED_WIFI_PIN,    LOW);
  ledSolid(LED_SENSOR_PIN,  LOW);

  // Sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // Connect WiFi
  connectWiFi();
  ledSolid(LED_WIFI_PIN, HIGH);

  // HTTP server routes
  server.on("/trigger", HTTP_POST, handleTrigger);
  server.on("/health",  HTTP_GET,  handleHealth);
  server.onNotFound(handleNotFound);
  server.begin();

  Serial.printf("[Setup] HTTP server started on port %d\n", HTTP_SERVER_PORT);
  Serial.printf("[Setup] Trigger URL: http://%s/trigger\n", WiFi.localIP().toString().c_str());
  Serial.println("[Setup] Ready. Waiting for trigger...");
}

// ============================================================
// Loop
// ============================================================
void loop() {
  // Handle incoming HTTP requests
  server.handleClient();

  // WiFi watchdog
  ensureWiFiConnected();

  // Process pending measurement
  if (triggerReceived && !isMeasuring) {
    triggerReceived = false;
    String sid = pendingSessionId;
    pendingSessionId = "";
    performMeasurement(sid);
  }

  // Idle heartbeat blink
  if (!isMeasuring && !triggerReceived) {
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 2000) {
      lastBlink = millis();
      ledBlink(LED_BUILTIN_PIN, 1, 50, 0);
    }
  }

  delay(10);
}

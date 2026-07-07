# AI-Driven IoT Weather Forecasting and Telemetry System

A production-quality academic project demonstrating an end-to-end IoT solution for environmental monitoring, AI-powered weather analysis, and real-time telemetry visualization.

## System Architecture

```
                           ESP32 WEATHER STATION
                   (DHT22 + BMP280 + LDR + Rain Sensor)
                                      │
                                      │
                          Reads Sensors Every 30s
                                      │
                                      ▼
                            MQTT Publish (weather/live)
                                      │
                                      ▼
                        Eclipse Mosquitto MQTT Broker
                                      │
                                      │
                           MQTT Topic Subscription
                                      ▼
                         ┌──────────────────────────┐
                         │    Node.js Backend        │
                         │  (Express + Socket.IO)    │
                         │  MQTT Subscriber          │
                         │  Sensor Validation        │
                         │  Trend Analysis           │
                         │  Alert Engine             │
                         │  AI Integration (Gemini)  │
                         │  REST API                 │
                         └──────────────────────────┘
                                │            │
                     ┌──────────┘            └──────────┐
                     ▼                                   ▼
            PostgreSQL Database                  Gemini AI API
                     │                                   │
                     └──────────┬────────────────────────┘
                                │
                         AI Weather Reports
                                │
                                ▼
                     React Dashboard (Real-Time)
                                │
                   Live Charts • AI Reports • Alerts
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Microcontroller** | ESP32 NodeMCU (C++, Arduino) |
| **Communication** | MQTT over TCP (Eclipse Mosquitto) |
| **Backend** | Node.js, Express, Socket.IO, MQTT.js |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **AI** | Google Gemini API, Advanced Prompt Engineering |
| **Frontend** | React 18, TypeScript, Vite, Recharts, Tailwind CSS |
| **DevOps** | Docker, Docker Compose |

## Hardware Components

| Component | Function | Interface |
|-----------|----------|-----------|
| ESP32 NodeMCU | Main controller, WiFi + MQTT | Built-in |
| DHT22 | Temperature & Humidity | Digital (GPIO4) |
| BMP280 | Pressure & Altitude | I2C (0x76) |
| YL-83 | Rain Detection | Analog (GPIO35) |
| LDR | Ambient Light | Analog (GPIO34) |

## Project Structure

```
iot-weather-system/
├── esp32/
│   └── weather-station/       # ESP32 firmware (Arduino sketch)
├── backend/
│   ├── src/
│   │   ├── config/            # Environment configuration
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Error handling
│   │   ├── mqtt/              # MQTT subscriber
│   │   ├── routes/            # Express routes
│   │   ├── services/          # Business logic
│   │   └── utils/             # Prisma, validation, logger
│   ├── prisma/                # Database schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── hooks/             # React Query hooks
│   │   ├── services/          # API + WebSocket clients
│   │   └── types/             # TypeScript definitions
│   ├── Dockerfile
│   └── nginx.conf
├── database/
│   └── init.sql               # DB schema reference (Prisma manages the actual schema)
├── docker/
│   └── mosquitto/config/      # MQTT broker config
├── docker-compose.yml         # Orchestration
└── .env.example               # Environment template
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Supabase account (free tier) with a project created
- Gemini API key (optional - system works without it using mock AI)

### Supabase Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > Database > Connection string**
3. Copy the **URI** connection string (not the psql one)
4. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxx.supabase.co:5432/postgres`
5. Append `?schema=public` to the end

### Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd iot-weather-system

# 2. Configure environment
cp .env.example .env
# Edit .env:
#   - Set DATABASE_URL to your Supabase connection string
#   - Add your GEMINI_API_KEY (optional)

# 3. Start all services
docker compose up --build
```

### Access the Dashboard

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MQTT Broker**: localhost:1883 (TCP), localhost:9001 (WebSocket)

The weather simulator starts automatically and publishes readings every 30 seconds. The dashboard updates in real-time via WebSocket.

## Data Collection Flow

Below is exactly how sensor data travels from physical hardware to the database and dashboard.

### End-to-End Pipeline

```
ESP32 (Physical Hardware)
  │
  │  Reads DHT22, BMP280, LDR, YL-83 sensors every 30 seconds
  │  Builds JSON payload with all readings + deviceId + timestamp
  │
  ▼
WiFi / TCP
  │
  │  Publishes to topic: weather/live
  │
  ▼
Eclipse Mosquitto (MQTT Broker - Docker container running inside Docker network)
  │
  │  Broker receives message, holds it briefly per QoS 1
  │  Broker distributes to all subscribers of "weather/#"
  │
  ▼
Node.js Backend (MQTT Subscriber - within the same Docker network)
  │
  │  ┌──────────────────────────────────────────────────┐
  │  │ Step 1: RECEIVE                                  │
  │  │   MQTT client.on("message") fires                │
  │  │   topic → "weather/live"                         │
  │  │   payload → raw JSON string                      │
  │  │   Parsed into JavaScript object                  │
  │  │                                                  │
  │  │ Step 2: VALIDATE                                 │
  │  │   Checks temperature range (-20°C to 60°C)       │
  │  │   Checks humidity range (0% to 100%)             │
  │  │   Checks pressure range (700hPa to 1100hPa)      │
  │  │   Checks altitude, light, battery boundaries     │
  │  │   REJECTS invalid data (logs warning + alert)    │
  │  │                                                  │
  │  │ Step 3: SANITIZE                                 │
  │  │   Casts values to proper types (parseFloat, etc) │
  │  │   Normalizes timestamps                          │
  │  │   Returns clean reading object                   │
  │  │                                                  │
  │  │ Step 4: STORE (see below for Supabase details)   │
  │  │   Prisma ORM → INSERT into weather_readings      │
  │  │   Falls back gracefully if DB is unreachable     │
  │  │                                                  │
  │  │ Step 5: BROADCAST                                │
  │  │   Socket.IO emits "weather:reading" to all       │
  │  │   connected dashboard clients (real-time)        │
  │  │                                                  │
  │  │ Step 6: COMPUTE TRENDS                           │
  │  │   Queries recent readings from database          │
  │  │   Calculates 30min/1hr/6hr statistics            │
  │  │   Analyzes pressure/temp/humidity/light trends   │
  │  │   Broadcasts via Socket.IO                       │
  │  │                                                  │
  │  │ Step 7: CHECK ALERTS                             │
  │  │   Evaluates 11 alert conditions (see Alert       │
  │  │   Engine section)                                │
  │  │   Saves alerts to Supabase                       │
  │  │   Publishes to weather/alerts MQTT topic         │
  │  │   Broadcasts to dashboard via Socket.IO          │
  │  │                                                  │
  │  │ Step 8: AI ANALYSIS (every 2 minutes)            │
  │  │   Builds structured Gemini prompt with           │
  │  │   current reading + computed trends              │
  │  │   Calls Gemini API (or mock fallback)            │
  │  │   Parses structured JSON response                │
  │  │   Saves report to ai_reports table               │
  │  │   Broadcasts to dashboard via Socket.IO          │
  │  └──────────────────────────────────────────────────┘
  │
  ▼
Supabase (PostgreSQL - external, NOT in Docker)
  │
  │  Prisma ORM manages all queries via DATABASE_URL
  │  Tables are auto-created on first container start
  │  via: npx prisma db push (runs in entrypoint.sh)
  │
  ├── weather_readings  ← Every validated sensor reading
  ├── ai_reports        ← Gemini analysis results
  ├── alerts            ← Auto-generated weather alerts
  ├── trend_snapshots   ← Pre-computed trend statistics
  └── devices           ← Registered device metadata
```

### How the MQTT Connection Works (Docker Networking)

All Docker containers run on the `iot-network` bridge network. They can reach each other by container name:

- Backend connects to `mqtt://mosquitto:1883` (container name "mosquitto" resolves via Docker DNS)
- ESP32 (physical) connects to `YOUR_HOST_IP:1883` (the host machine's IP where Docker runs)
- The Mosquitto container exposes port 1883 to the host via `ports: - "1883:1883"`
- MQTT QoS level 1 ensures messages are delivered at least once
- The backend subscribes to `weather/#` (wildcard catches all subtopics)
- Topics are routed by the broker: publishers and subscribers never connect to each other directly

### Data Validation (What Gets Rejected)

The backend's `validateSensorReading()` function rejects readings where:

| Field | Valid Range | Reason |
|-------|-------------|--------|
| deviceId | Non-empty string | Must identify the source |
| temperature | -20°C to 60°C | Physical limits of DHT22 |
| humidity | 0% to 100% | Physical limits |
| pressure | 700 hPa to 1100 hPa | Earth's atmospheric range |
| altitude | -500m to 5000m | Reasonable geographic range |
| light | 0 to 100,000 lux | Sensor range |
| battery | 0% to 100% | Percentage boundary |

Rejected readings are logged, trigger an alert, and are **not** stored in the database.

### Graceful Degradation

- If **Supabase is unreachable**: Readings are processed in-memory, trends and alerts still work, the dashboard still updates via Socket.IO — data is simply not persisted until the connection recovers
- If **Gemini API fails**: The system falls back to a deterministic mock AI report with reasonable defaults
- If **MQTT broker is down**: The backend auto-reconnects with exponential backoff; the simulator does the same

### ESP32 Setup

1. Open `esp32/weather-station/weather-station.ino` in Arduino IDE
2. Install required libraries (see Libraries section below)
3. Update WiFi credentials and MQTT broker IP
4. Upload to ESP32

#### Required Arduino Libraries

- `PubSubClient` by Nick O'Leary
- `DHT sensor library` by Adafruit
- `Adafruit BMP280 Library`
- `ArduinoJson` by Benoit Blanchon
- `Adafruit Unified Sensor`

## MQTT Topics

| Topic | Direction | Description | QoS |
|-------|-----------|-------------|-----|
| `weather/live` | ESP32 → Backend | Real-time sensor readings | 1 |
| `weather/alerts` | Backend → Dashboard | System alerts | 1 |
| `weather/status` | Bidirectional | Device status updates | 1 |
| `weather/system` | System → Backend | System health messages | 1 |
| `weather/device/logs` | ESP32 → Backend | Diagnostic logs | 0 |

### Sensor Payload

```json
{
  "deviceId": "station-001",
  "temperature": 28.4,
  "humidity": 71.0,
  "pressure": 1008.0,
  "altitude": 1780.0,
  "light": 3200,
  "rain": false,
  "battery": 100.0,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/weather/latest` | Latest sensor reading |
| GET | `/api/weather/history` | Historical readings (paginated) |
| GET | `/api/weather/charts` | Chart data (time-windowed) |
| GET | `/api/weather/trends` | Computed weather trends |
| GET | `/api/alerts` | System alerts (filterable) |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge an alert |
| PATCH | `/api/alerts/:id/resolve` | Resolve an alert |
| GET | `/api/reports` | AI-generated weather reports |
| GET | `/api/devices` | Registered devices |
| POST | `/api/devices` | Register a device |
| GET | `/api/devices/:deviceId` | Device details |
| GET | `/api/status` | System status |

### Query Parameters

**`GET /api/weather/history`**
- `deviceId` - Filter by device (default: `station-001`)
- `limit` - Records per page (default: 100, max: 1000)
- `offset` - Pagination offset

**`GET /api/weather/charts`**
- `deviceId` - Filter by device
- `hours` - Lookback window (default: 24)

**`GET /api/alerts`**
- `limit` - Max results (default: 50)
- `status` - Filter: `active`, `acknowledged`, `resolved`

## Database Schema (Supabase)

The schema is defined in `backend/prisma/schema.prisma` and auto-synced to Supabase on container startup via `npx prisma db push`. You can also run it manually:

```bash
cd backend && npx prisma db push
```

### `weather_readings`
Stores every sensor reading. Indexed by `device_id` and `recorded_at`.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| device_id | VARCHAR(50) | Device identifier |
| temperature | DECIMAL(5,1) | °Celsius |
| humidity | DECIMAL(5,1) | Percentage |
| pressure | DECIMAL(7,1) | hPa |
| altitude | DECIMAL(7,1) | Meters |
| light | INTEGER | Lux |
| rain | BOOLEAN | Rain detected |
| battery | DECIMAL(5,1) | Percentage |
| recorded_at | TIMESTAMPTZ | Sensor timestamp |
| created_at | TIMESTAMPTZ | Insert timestamp |

### `ai_reports`
AI-generated weather analyses linked to readings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| reading_id | UUID (FK) | Associated reading |
| summary | TEXT | Plain-language summary |
| prediction | TEXT | Rain probability |
| forecast | TEXT | 30-60 minute forecast |
| recommendation | TEXT | Actionable advice |
| confidence | DECIMAL(3,2) | 0.00 - 1.00 |
| reasoning | TEXT | Analysis reasoning |
| created_at | TIMESTAMPTZ | Generation time |

### `alerts`
System-generated weather alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| severity | VARCHAR(20) | info / warning / critical |
| title | VARCHAR(200) | Alert title |
| message | TEXT | Alert details |
| status | VARCHAR(20) | active / acknowledged / resolved |
| created_at | TIMESTAMPTZ | Creation time |
| resolved_at | TIMESTAMPTZ | Resolution time |

### `trend_snapshots`
Pre-computed trend statistics at various intervals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| device_id | VARCHAR(50) | Device identifier |
| period | VARCHAR(20) | 30min / 1hour / 6hour |
| avg_temperature | DECIMAL(5,1) | Mean temperature |
| min/max_temperature | DECIMAL(5,1) | Extremes |
| avg_humidity | DECIMAL(5,1) | Mean humidity |
| avg_pressure | DECIMAL(7,1) | Mean pressure |
| rain_count | INTEGER | Rain occurrences |
| sample_count | INTEGER | Number of samples |

### `devices`
Registered IoT devices.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| device_id | VARCHAR(50) | Unique device ID |
| name | VARCHAR(100) | Friendly name |
| location | VARCHAR(200) | Physical location |
| status | VARCHAR(20) | online / offline / error |
| last_seen | TIMESTAMPTZ | Last communication |

## AI Integration

The system uses Google's Gemini API for intelligent weather analysis. The backend:

1. **Preprocesses sensor data** - Computes trends before sending to AI
2. **Builds structured prompts** - Contains current readings, trends, and context
3. **Parses structured JSON responses** - Validates and stores AI output
4. **Generates mock reports** - Falls back gracefully when API key is not configured

### AI Report Structure

```json
{
  "summary": "Warm and humid conditions with light rain expected.",
  "rainProbability": 65,
  "reasoning": "Pressure dropping 0.3 hPa/reading with humidity above 80%.",
  "forecast": "Rain likely within 30 minutes based on pressure trend.",
  "risks": ["Slippery surfaces", "Reduced visibility"],
  "recommendations": ["Carry umbrella", "Drive carefully"],
  "observations": "Light levels dropped 40% in last 10 minutes.",
  "confidence": 0.78
}
```

## Dashboard Pages

| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/` | Live readings, AI analysis, recent alerts, system stats |
| Live Telemetry | `/live` | Real-time sensor table with auto-update |
| Historical Data | `/history` | Paginated reading history with filters |
| Charts | `/charts` | Interactive Recharts (temp, humidity, pressure, light) |
| AI Reports | `/reports` | Gemini-generated weather analyses |
| Alerts | `/alerts` | Alert management (acknowledge/resolve) |
| System Status | `/status` | System health, device list, metrics |
| Settings | `/settings` | Configuration (thresholds, MQTT info) |

## Real-Time Features

- **WebSocket (Socket.IO)** - Live data push to all connected clients
- **Automatic dashboard updates** - No page refresh needed
- **Instant alert propagation** - MQTT → Backend → WebSocket → Dashboard
- **Live chart updates** - New data points appear in real-time

## Alert Engine

Automatically generated alerts:

| Alert Type | Threshold | Severity |
|------------|-----------|----------|
| Extreme High Temperature | > 40°C | Critical |
| High Temperature | > 35°C | Warning |
| Freezing | < 0°C | Warning |
| Very Low Pressure | < 970 hPa | Critical |
| Low Pressure | < 990 hPa | Warning |
| Storm Risk | Pressure dropping > 0.3 hPa/reading | Warning |
| Heavy Rain | Rain + humidity > 85% | Warning |
| Rain | Rain detected | Info |
| Critical Battery | < 10% | Critical |
| Low Battery | < 20% | Warning |
| Extreme Humidity | > 95% | Warning |
| Extreme Brightness | > 80,000 lux | Info |

## Trend Analysis

The backend computes:

- **Short-term (30 min)**: Current conditions snapshot
- **Hourly (1 hour)**: Recent trend analysis
- **Extended (6 hours)**: Longer-term patterns
- **Pressure trend**: Rising/falling rate for storm prediction
- **Temperature trend**: Warming/cooling rate
- **Humidity trend**: Moisture direction
- **Rain frequency**: Percentage of rain readings
- **Daily/weekly/monthly**: Persistent trend snapshots

## Docker Compose Services

| Service | Image | Ports | Depends On |
|---------|-------|-------|------------|
| mosquitto | eclipse-mosquitto:2 | 1883, 9001 | - |
| backend | Dockerfile (Node.js) | 3001 | mosquitto |
| frontend | Dockerfile (Nginx) | 5173:80 | backend |
| weather-simulator | same as backend | - | mosquitto |

> **Note:** PostgreSQL is not containerized. The system uses **Supabase** — an external hosted PostgreSQL. Configure `DATABASE_URL` in `.env` to point to your Supabase instance. On first startup, the backend's entrypoint automatically runs `npx prisma db push` to sync the schema.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Runtime environment |
| `PORT` | 3001 | Backend port |
| `DATABASE_URL` | (required) | Supabase PostgreSQL connection string, e.g. `postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres?schema=public` |
| `MQTT_BROKER_URL` | mqtt://mosquitto:1883 | MQTT broker (inside Docker, use container name) |
| `GEMINI_API_KEY` | - | Google Gemini API key (optional) |
| `GEMINI_MODEL` | gemini-2.0-flash | AI model |
| `VITE_API_URL` | http://localhost:3001 | Backend URL (frontend) |
| `SIMULATOR_MODE` | false | Enable weather simulator |
| `SIMULATOR_INTERVAL` | 30 | Simulator read interval (s) |

## Software Engineering Practices

- **Clean Architecture**: Separation of concerns across layers
- **Modular Design**: Independent, replaceable components
- **SOLID Principles**: Single responsibility, dependency injection
- **Environment-Based Configuration**: 12-factor app methodology
- **Comprehensive Logging**: Structured winston logging
- **Error Handling**: Centralized error middleware
- **Input Validation**: Sensor data sanitization and validation
- **Type Safety**: Full TypeScript frontend
- **Database Indexing**: Optimized query performance
- **Docker Best Practices**: Multi-stage builds, health checks, networks

## Non-Functional Requirements

| Requirement | Implementation |
|-------------|---------------|
| Modular | Independent containers, separated concerns |
| Real-time | Socket.IO WebSocket push architecture |
| Reliable | MQTT QoS 1, auto-reconnect, graceful shutdown |
| Fault Tolerant | Graceful degradation when AI/DB unavailable |
| Responsive | Tailwind CSS, mobile-friendly layout |
| Extensible | Plugin-style service architecture |
| Deployable | Single `docker compose up` command |

## License

MIT - Academic Project

## Authors

- **MMUST Industrial IoT** - Capstone Project

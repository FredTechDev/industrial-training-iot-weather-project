# Smart Climate-Responsive IoT Clothesline Management System

A production-quality academic project demonstrating an end-to-end IoT solution for automated clothesline management based on real-time environmental conditions from ESP32 sensors and OpenWeatherMap API.

## System Architecture

```
                           ESP32 WEATHER STATION
                   (Rain + Light + Servo)
                                      │
                                      │
                          Reads Sensors Every 15s
                                      │
                                      ▼
                             MQTT Publish (clothesline/telemetry)
                                      │
                                      ▼
                        HiveMQ Cloud (MQTT Broker)
                                      │
                                      │
                           MQTT Topic Subscription
                                      ▼
                         ┌──────────────────────────┐
                         │    Node.js Backend        │
                         │  (Express + Socket.IO)    │
                         │  MQTT Subscriber          │
                         │  OpenWeatherMap API       │
                         │  Sensor Validation        │
                         │  Trend Analysis           │
                         │  Alert Engine             │
                         │  REST API                 │
                         └──────────────────────────┘
                                 │            │
                      ┌──────────┘            └──────────┐
                      ▼                                   ▼
             PostgreSQL Database              OpenWeatherMap API
             (Supabase)                       (Temp/Humidity/Pressure)
                      │
                      ▼
               React Dashboard (Real-Time)
                       │
          Live Charts • Sensors • Alerts • Control
```

## How It Works

**ESP32** handles: rain detection, light level, servo control for clothesline
**OpenWeatherMap** provides: temperature, humidity, atmospheric pressure
**Backend** merges both data sources and stores unified readings
**Frontend** displays real-time dashboard with rule-based clothesline automation

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Microcontroller** | ESP32 NodeMCU (C++, Arduino) |
| **Communication** | MQTT over TLS (HiveMQ Cloud) |
| **Backend** | Node.js, Express, Socket.IO, MQTT.js |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **Weather API** | OpenWeatherMap (free tier) |
| **Frontend** | React 18, TypeScript, Vite, Recharts, Tailwind CSS |
| **DevOps** | Docker, Docker Compose |

## Hardware Components

| Component | Function | Interface |
|-----------|----------|-----------|
| ESP32 NodeMCU | Main controller, WiFi + MQTT | Built-in |
| YL-83 | Rain Detection | Digital (GPIO35) |
| LDR | Ambient Light | Analog (GPIO34) |
| Servo Motor | Clothesline Extend/Retract | PWM (GPIO13) |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Supabase account (free tier) with a project created
- OpenWeatherMap API key (free tier)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd iot-weather-system

# 2. Configure environment
cp .env.example .env
# Edit .env:
#   - Set DATABASE_URL to your Supabase connection string
#   - Set OPENWEATHER_API_KEY to your OpenWeatherMap key
#   - Set MQTT credentials

# 3. Start all services
docker compose up --build
```

### Access the Dashboard

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MQTT Broker**: HiveMQ Cloud (TLS)

## Data Collection Flow

```
ESP32 (Physical Hardware)
  │
  │  Reads rain sensor and light sensor every 15 seconds
  │  Publishes JSON payload to MQTT
  │
  ▼
HiveMQ Cloud (MQTT Broker)
  │
  ▼
Node.js Backend
  │
  │  1. Receives ESP32 data (rain, light)
  │  2. Fetches OpenWeatherMap data (temp, humidity, pressure)
  │  3. Merges into unified reading
  │  4. Validates and sanitizes
  │  5. Stores in PostgreSQL via Prisma
  │  6. Broadcasts to dashboard via Socket.IO
  │  7. Computes trends (30min, 1hr, 6hr)
  │  8. Evaluates alert conditions
  │
  ▼
React Dashboard
  │
  │  Real-time updates via WebSocket
  │  Live charts, sensor gauges, alerts
  │  Manual clothesline control (force extend/retract)
```

## Clothesline Automation Rules (ESP32)

The ESP32 automatically controls the clothesline based on:

| Condition | Action | Reason |
|-----------|--------|--------|
| Rain detected | Retract (0°) | Protect clothes from rain |
| Night time (22:00-06:00) | Retract (0°) | Security |
| Low light level | Retract (0°) | Night security |
| Away/Vacation mode | Retract (0°) | Security |
| All conditions safe + sunlight | Extend (90°) | Optimize drying |

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/weather/latest` | Latest sensor reading |
| GET | `/api/weather/history` | Historical readings |
| GET | `/api/weather/charts` | Chart data |
| GET | `/api/weather/trends` | Computed trends |
| GET | `/api/alerts` | System alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| PATCH | `/api/alerts/:id/resolve` | Resolve alert |
| GET | `/api/devices` | Registered devices |
| GET | `/api/status` | System status |

## Database Schema

Managed by Prisma ORM, auto-synced to Supabase on startup.

### `weather_readings`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| device_id | VARCHAR(50) | Device identifier |
| temperature | DECIMAL(5,1) | °Celsius (from OpenWeatherMap) |
| humidity | DECIMAL(5,1) | Percentage (from OpenWeatherMap) |
| pressure | DECIMAL(6,1) | hPa (from OpenWeatherMap) |
| light | INTEGER | Lux (from ESP32) |
| rain | BOOLEAN | Rain detected (from ESP32) |
| recorded_at | TIMESTAMPTZ | Reading timestamp |

### `alerts`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| severity | VARCHAR(20) | info / warning / critical |
| title | VARCHAR(200) | Alert title |
| message | TEXT | Alert details |
| status | VARCHAR(20) | active / acknowledged / resolved |

### `trend_snapshots`
Pre-computed trend statistics at 30min, 1hr, 6hr intervals.

### `devices`
Registered IoT device metadata.

## Alert Engine

| Alert Type | Threshold | Severity |
|------------|-----------|----------|
| Extreme High Temperature | > 40°C | Critical |
| High Temperature | > 35°C | Warning |
| Freezing | < 0°C | Warning |
| Low Pressure | < 990 hPa | Warning |
| Very Low Pressure | < 970 hPa | Critical |
| Storm Risk | Pressure dropping rapidly | Warning |
| Heavy Rain | Rain + humidity > 85% | Warning |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Runtime environment |
| `PORT` | 3001 | Backend port |
| `DATABASE_URL` | (required) | Supabase PostgreSQL connection string |
| `MQTT_BROKER_URL` | (required) | HiveMQ Cloud MQTT URL |
| `MQTT_USERNAME` | (required) | MQTT username |
| `MQTT_PASSWORD` | (required) | MQTT password |
| `OPENWEATHER_API_KEY` | (required) | OpenWeatherMap API key |
| `OPENWEATHER_LAT` | -0.0797 | Latitude (MMUST Kakamega) |
| `OPENWEATHER_LON` | 34.7316 | Longitude (MMUST Kakamega) |
| `VITE_API_URL` | http://localhost:3001 | Backend URL (frontend) |

## License

MIT - Academic Project

## Authors

- **MMUST Industrial IoT** - Capstone Project

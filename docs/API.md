# IoT Weather System - API Documentation

Base URL: `http://localhost:3001`

## Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

## Weather Endpoints

### Get Latest Reading

```
GET /api/weather/latest?deviceId=station-001
```

**Parameters:**
- `deviceId` (query, optional) - Device identifier. Default: `station-001`

**Response 200:**
```json
{
  "id": "uuid",
  "deviceId": "station-001",
  "temperature": 28.4,
  "humidity": 71.0,
  "pressure": 1013.2,
  "light": 3200,
  "rain": false,
  "recordedAt": "2026-01-15T10:30:00.000Z",
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

**Response 404:**
```json
{ "error": "No readings found" }
```

### Get History

```
GET /api/weather/history?deviceId=station-001&limit=100&offset=0
```

**Parameters:**
- `deviceId` (query, optional) - Device identifier
- `limit` (query, optional) - Records per page (default: 100)
- `offset` (query, optional) - Pagination offset (default: 0)

**Response 200:** Array of weather readings.

### Get Chart Data

```
GET /api/weather/charts?deviceId=station-001&hours=24
```

**Parameters:**
- `deviceId` (query, optional) - Device identifier
- `hours` (query, optional) - Lookback window in hours (default: 24)

**Response 200:** Array of weather readings sorted ascending by time.

### Get Trends

```
GET /api/weather/trends?deviceId=station-001
```

**Parameters:**
- `deviceId` (query, optional) - Device identifier

**Response 200:**
```json
{
  "current": { "WeatherReading" },
  "shortTerm": { "TrendStats" },
  "hourly": { "TrendStats" },
  "sixHour": { "TrendStats" },
  "pressure": {
    "direction": "stable",
    "rate": 0.02,
    "description": "Pressure is stable"
  },
  "temperature": {
    "direction": "stable",
    "rate": 0.02,
    "description": "Temperature is stable"
  },
  "humidity": {
    "direction": "rising",
    "rate": 0.12,
    "description": "Humidity increasing"
  },
  "light": {
    "direction": "decreasing",
    "rate": -150,
    "description": "Getting darker"
  },
  "rainFrequency": {
    "frequency": 15.0,
    "description": "Intermittent rain"
  }
}
```

## Alert Endpoints

### Get Alerts

```
GET /api/alerts?limit=50&status=active
```

**Parameters:**
- `limit` (query, optional) - Max results (default: 50)
- `status` (query, optional) - Filter: `active`, `acknowledged`, `resolved`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "severity": "warning",
    "title": "High Temperature Warning",
    "message": "Temperature at 38.2°C is above normal range.",
    "status": "active",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "resolvedAt": null
  }
]
```

### Acknowledge Alert

```
PATCH /api/alerts/:id/acknowledge
```

**Response 200:** Updated alert object.

### Resolve Alert

```
PATCH /api/alerts/:id/resolve
```

**Response 200:** Updated alert object with `resolvedAt` timestamp.

## Device Endpoints

### Get All Devices

```
GET /api/devices
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "deviceId": "station-001",
    "name": "Main Weather Station",
    "location": "MMUST Campus",
    "firmwareVersion": null,
    "lastSeen": "2026-01-15T10:30:00.000Z",
    "status": "online",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
]
```

### Register Device

```
POST /api/devices
Content-Type: application/json

{
  "deviceId": "station-002",
  "name": "Secondary Station",
  "location": "Lab Building",
  "firmwareVersion": "1.0.0"
}
```

**Response 201:** Created device object.

### Get Device

```
GET /api/devices/:deviceId
```

**Response 200:** Device object.
**Response 404:** `{ "error": "Device not found" }`

## Status Endpoint

### Get System Status

```
GET /api/status
```

**Response 200:**
```json
{
  "uptime": 3600.5,
  "totalReadings": 1250,
  "lastHourReadings": 120,
  "activeAlerts": 2,
  "devices": [ "Device[]" ],
  "latestReading": { "WeatherReading" },
  "websocketClients": 3,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

## Error Responses

```json
{
  "error": "Description of what went wrong"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `404` - Resource not found
- `500` - Internal Server Error

## WebSocket Events

### Client → Server

- `subscribe` - Join a room/channel
- `unsubscribe` - Leave a room/channel

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `weather:reading` | WeatherReading | New sensor reading |
| `weather:trends` | TrendData | Computed trend analysis |
| `weather:alert` | Alert | New alert generated |
| `weather:status` | object | Device status change |
| `weather:system` | object | System messages |

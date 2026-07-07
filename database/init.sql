-- ──────────────────────────────────────────────
-- IoT Weather System - Database Schema Reference
-- ──────────────────────────────────────────────
-- NOTE: This file is for reference only.
-- The actual schema is managed by Prisma ORM
-- via: backend/prisma/schema.prisma
--
-- On container startup, backend/entrypoint.sh
-- runs: npx prisma db push
-- to auto-sync the schema to Supabase.
-- ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Weather readings table
CREATE TABLE IF NOT EXISTS weather_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL DEFAULT 'station-001',
    temperature DECIMAL(5, 1) NOT NULL,
    humidity DECIMAL(5, 1) NOT NULL,
    pressure DECIMAL(7, 1) NOT NULL,
    altitude DECIMAL(7, 1) NOT NULL DEFAULT 0,
    light INTEGER NOT NULL DEFAULT 0,
    rain BOOLEAN NOT NULL DEFAULT FALSE,
    battery DECIMAL(5, 1) NOT NULL DEFAULT 100,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI reports table
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_id UUID REFERENCES weather_readings(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    prediction TEXT NOT NULL,
    forecast TEXT,
    recommendation TEXT NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Trend snapshots table
CREATE TABLE IF NOT EXISTS trend_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL DEFAULT 'station-001',
    period VARCHAR(20) NOT NULL CHECK (period IN ('30min', '1hour', '6hour', '24hour', '7day', '30day')),
    avg_temperature DECIMAL(5, 1),
    min_temperature DECIMAL(5, 1),
    max_temperature DECIMAL(5, 1),
    avg_humidity DECIMAL(5, 1),
    min_humidity DECIMAL(5, 1),
    max_humidity DECIMAL(5, 1),
    avg_pressure DECIMAL(7, 1),
    min_pressure DECIMAL(7, 1),
    max_pressure DECIMAL(7, 1),
    avg_light INTEGER,
    rain_count INTEGER,
    sample_count INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Device registry
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    location VARCHAR(200),
    firmware_version VARCHAR(20),
    last_seen TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_readings_device_time ON weather_readings(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_recorded_at ON weather_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON ai_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_device_period ON trend_snapshots(device_id, period, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

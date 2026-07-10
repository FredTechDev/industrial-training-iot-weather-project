import { motion } from "framer-motion";
import { useTelemetry } from "../hooks/useTelemetry";
import Gauge from "../components/common/Gauge";
import StatusBadge from "../components/common/StatusBadge";
import { SENSOR_THRESHOLDS } from "../constants";
import { CloudRain, Sun, Moon, Thermometer, Droplets, Gauge } from "lucide-react";

function SensorCard({ title, icon: Icon, children, delay = 0 }: {
  title: string; icon: React.ElementType; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-900 rounded-2xl p-5 border border-gray-800"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Icon size={14} className="text-blue-400" />
        </div>
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

export default function SensorsPage() {
  const { telemetry, tempLevel, humidityLevel, pressureLevel } = useTelemetry();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Sensors</h1>
        <p className="text-gray-400 text-sm">Real-time environmental readings from ESP32</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Temperature */}
        <SensorCard title="Temperature" icon={Thermometer} delay={0}>
          <div className="flex justify-center">
            <Gauge
              value={telemetry?.temperature ?? 0}
              min={SENSOR_THRESHOLDS.temp.min}
              max={SENSOR_THRESHOLDS.temp.max}
              label="Temperature"
              unit="°C"
              color="#f59e0b"
              dangerLow={SENSOR_THRESHOLDS.temp.danger.low}
              dangerHigh={SENSOR_THRESHOLDS.temp.danger.high}
            />
          </div>
          {tempLevel === "danger" && (
            <p className="text-red-400 text-xs text-center mt-2 font-medium">⚠ Outside safe range</p>
          )}
        </SensorCard>

        {/* Humidity */}
        <SensorCard title="Humidity" icon={Droplets} delay={0.05}>
          <div className="flex justify-center">
            <Gauge
              value={telemetry?.humidity ?? 0}
              min={SENSOR_THRESHOLDS.humidity.min}
              max={SENSOR_THRESHOLDS.humidity.max}
              label="Humidity"
              unit="%"
              color="#06b6d4"
              dangerHigh={SENSOR_THRESHOLDS.humidity.danger.high}
              dangerLow={SENSOR_THRESHOLDS.humidity.danger.low}
            />
          </div>
          {humidityLevel === "danger" && (
            <p className="text-red-400 text-xs text-center mt-2 font-medium">⚠ Outside safe range</p>
          )}
        </SensorCard>

        {/* Pressure */}
        <SensorCard title="Atmospheric Pressure" icon={Gauge} delay={0.1}>
          <div className="flex justify-center">
            <Gauge
              value={telemetry?.pressure ?? 0}
              min={SENSOR_THRESHOLDS.pressure.min}
              max={SENSOR_THRESHOLDS.pressure.max}
              label="Pressure"
              unit=" hPa"
              color="#8b5cf6"
              dangerLow={SENSOR_THRESHOLDS.pressure.danger.low}
              dangerHigh={SENSOR_THRESHOLDS.pressure.danger.high}
            />
          </div>
          {!telemetry?.pressure && (
            <p className="text-gray-500 text-xs text-center mt-2">Waiting for data...</p>
          )}
          {telemetry?.pressure && telemetry.pressure < SENSOR_THRESHOLDS.pressure.danger.low && (
            <p className="text-amber-400 text-xs text-center mt-2 font-medium">⚠ Low pressure — storm risk</p>
          )}
        </SensorCard>

        {/* Rain */}
        <SensorCard title="Rain Sensor" icon={CloudRain} delay={0.15}>
          <div className="flex flex-col items-center gap-3 py-4">
            {telemetry?.rain ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                  <CloudRain size={32} className="text-blue-400" />
                </div>
                <StatusBadge status="RAIN DETECTED" color="bg-blue-500/15 text-blue-400 border-blue-500/30" />
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  <CloudRain size={32} className="text-gray-600" />
                </div>
                <StatusBadge status="NO RAIN" color="bg-gray-500/15 text-gray-400 border-gray-500/30" />
              </>
            )}
          </div>
        </SensorCard>

        {/* Light */}
        <SensorCard title="Light Level" icon={Sun} delay={0.2}>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              {telemetry?.lightState === "NIGHT" ? (
                <Moon size={32} className="text-indigo-400" />
              ) : (
                <Sun size={32} className="text-yellow-400" />
              )}
            </div>
            <StatusBadge
              status={telemetry?.lightState || "DAY"}
              color={telemetry?.lightState === "NIGHT" ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"}
            />
          </div>
        </SensorCard>
      </div>
    </div>
  );
}

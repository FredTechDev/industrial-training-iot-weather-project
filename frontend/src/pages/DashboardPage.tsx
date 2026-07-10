import { motion } from "framer-motion";
import { useAppStore } from "../stores/useAppStore";
import { useTelemetry } from "../hooks/useTelemetry";
import ClotheslineAnimation from "../components/clothesline/ClotheslineAnimation";
import StatusBadge from "../components/common/StatusBadge";
import { REASON_LABELS, THREAT_COLORS } from "../constants";
import { formatDuration } from "../utils/format";
import { Signal, Wifi, Radio, Clock, Cpu, Thermometer, Droplets, Gauge, TrendingDown, TrendingUp, Minus } from "lucide-react";
import PresenceSelector from "../components/presence/PresenceSelector";

export default function DashboardPage() {
  const { telemetry, threatColor } = useTelemetry();
  const { deviceStatus, connection } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm">Real-time clothesline management overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Clothesline visualization */}
            <div className="flex flex-col items-center gap-4">
              <ClotheslineAnimation isExtended={telemetry?.line === "EXTENDED"} />
              <div className="mt-6">
                <StatusBadge status={telemetry?.line || "RETRACTED"} pulse />
              </div>
            </div>

            {/* Status grid */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Operating Mode</p>
                <StatusBadge status={telemetry?.mode || "AUTO"} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Threat Level</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${THREAT_COLORS[telemetry?.prediction || "SAFE"]}`}>
                  {telemetry?.prediction || "SAFE"}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className={`text-sm font-medium ${REASON_LABELS[telemetry?.reason || "SAFE"]?.color || "text-gray-400"}`}>
                  {REASON_LABELS[telemetry?.reason || "SAFE"]?.label || telemetry?.reason || "Awaiting data"}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${connection === "connected" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <Radio size={14} className={connection === "connected" ? "text-emerald-400" : "text-red-400"} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">MQTT</p>
                  <p className={`text-sm font-medium ${connection === "connected" ? "text-emerald-400" : "text-red-400"}`}>
                    {connection === "connected" ? "Connected" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Signal size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">WiFi</p>
                  <p className="text-sm font-medium text-white">{deviceStatus?.wifiSignal ?? "--"} dBm</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Cpu size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Uptime</p>
                  <p className="text-sm font-medium text-white">{formatDuration(deviceStatus?.uptime ?? 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Presence Mode */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <PresenceSelector />
          </motion.div>

          {/* Timestamps */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Clock size={12} />
                  Last Update
                </div>
                <span className="text-xs text-white font-mono">
                  {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : "--:--:--"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Wifi size={12} />
                  Firmware
                </div>
                <span className="text-xs text-white font-mono">{deviceStatus?.firmware || "--"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Weather Conditions from OpenWeatherMap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gray-900 rounded-2xl p-5 border border-gray-800"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Weather Conditions (OpenWeatherMap)</h3>
          {telemetry?.pressureTrend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              telemetry.pressureTrend === "dropping" ? "text-red-400" :
              telemetry.pressureTrend === "rising" ? "text-emerald-400" : "text-gray-400"
            }`}>
              {telemetry.pressureTrend === "dropping" ? <TrendingDown size={12} /> :
               telemetry.pressureTrend === "rising" ? <TrendingUp size={12} /> : <Minus size={12} />}
              Pressure {telemetry.pressureTrend}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Thermometer size={14} className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Temperature</p>
              <p className="text-sm font-medium text-white">{telemetry?.owmTemperature ?? "--"}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Droplets size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Humidity</p>
              <p className="text-sm font-medium text-white">{telemetry?.owmHumidity ?? "--"}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Gauge size={14} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pressure</p>
              <p className="text-sm font-medium text-white">{telemetry?.owmPressure ?? "--"} hPa</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

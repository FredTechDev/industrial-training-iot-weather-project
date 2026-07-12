import { motion } from "framer-motion";
import { useAppStore } from "../stores/useAppStore";
import { useTelemetry } from "../hooks/useTelemetry";
import ClotheslineAnimation from "../components/clothesline/ClotheslineAnimation";
import StatusBadge from "../components/common/StatusBadge";
import { REASON_LABELS, THREAT_COLORS } from "../constants";
import { formatDuration } from "../utils/format";
import { Signal, Radio, Cpu, Thermometer, Droplets, Gauge, TrendingDown, TrendingUp, Minus } from "lucide-react";
import PresenceSelector from "../components/presence/PresenceSelector";

function wifiSignalLabel(dbm: number): { label: string; color: string } {
  if (dbm >= -50) return { label: "Excellent", color: "text-emerald-400" };
  if (dbm >= -65) return { label: "Strong", color: "text-emerald-400" };
  if (dbm >= -75) return { label: "Fair", color: "text-amber-400" };
  return { label: "Weak", color: "text-red-400" };
}

export default function DashboardPage() {
  const { telemetry, isStale, threatColor } = useTelemetry();
  const { deviceStatus, connection } = useAppStore();

  const live = telemetry && !isStale;
  const wifiInfo = live && deviceStatus?.wifiSignal != null ? wifiSignalLabel(deviceStatus.wifiSignal) : null;

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
              <ClotheslineAnimation isExtended={live ? telemetry.line === "EXTENDED" : true} />
              <div className="mt-6">
                {live ? (
                  <StatusBadge status={telemetry.line} pulse />
                ) : (
                  <span className="text-xs text-gray-500">Awaiting sensor data...</span>
                )}
              </div>
            </div>

            {/* Status grid */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Operating Mode</p>
                {live && telemetry.mode ? <StatusBadge status={telemetry.mode} /> : <span className="text-sm text-gray-500">--</span>}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Threat Level</p>
                {live && telemetry.prediction ? (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${THREAT_COLORS[telemetry.prediction]}`}>
                    {telemetry.prediction}
                  </div>
                ) : <span className="text-sm text-gray-500">--</span>}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                {live && telemetry.reason ? (
                  <p className={`text-sm font-medium ${REASON_LABELS[telemetry.reason]?.color || "text-gray-400"}`}>
                    {REASON_LABELS[telemetry.reason]?.label || telemetry.reason}
                  </p>
                ) : <span className="text-sm text-gray-500">Awaiting data...</span>}
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
                  <p className={`text-sm font-medium ${wifiInfo ? wifiInfo.color : "text-gray-500"}`}>
                    {wifiInfo ? wifiInfo.label : "--"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Cpu size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Uptime</p>
                  <p className="text-sm font-medium text-white">{live && deviceStatus?.uptime != null ? formatDuration(deviceStatus.uptime) : "--"}</p>
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
          {live && telemetry?.pressureTrend && telemetry.pressureTrend !== "stable" && (
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
              <p className="text-sm font-medium text-white">{live && telemetry?.temperature != null ? `${telemetry.temperature}°C` : "--"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Droplets size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Humidity</p>
              <p className="text-sm font-medium text-white">{live && telemetry?.humidity != null ? `${telemetry.humidity}%` : "--"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Gauge size={14} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pressure</p>
              <p className="text-sm font-medium text-white">{live && telemetry?.pressure != null ? `${telemetry.pressure} hPa` : "--"}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

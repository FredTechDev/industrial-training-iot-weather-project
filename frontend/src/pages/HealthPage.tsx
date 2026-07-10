import { motion } from "framer-motion";
import { useAppStore } from "../stores/useAppStore";
import { useTelemetry } from "../hooks/useTelemetry";
import { formatDuration } from "../utils/format";
import {
  Wifi, Radio, Cpu, HardDrive, Clock, Globe, Server, Activity, ThermometerSun,
} from "lucide-react";

function HealthCard({ label, value, icon: Icon, color, delay = 0 }: {
  label: string; value: string | number; icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-900 rounded-2xl p-5 border border-gray-800"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HealthPage() {
  const { telemetry } = useTelemetry();
  const { deviceStatus, connection } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Device Health</h1>
        <p className="text-gray-400 text-sm">ESP32 system diagnostics and connectivity metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard label="WiFi Signal" value={`${deviceStatus?.wifiSignal ?? "--"} dBm`} icon={Wifi} color="bg-blue-500/10 text-blue-400" delay={0} />
        <HealthCard label="MQTT Latency" value={`${deviceStatus?.mqttLatency ?? "--"} ms`} icon={Radio} color="bg-emerald-500/10 text-emerald-400" delay={0.05} />
        <HealthCard label="Heap Free" value={deviceStatus?.heapFree != null ? `${(deviceStatus.heapFree / 1024).toFixed(1)} KB` : "--"} icon={HardDrive} color="bg-purple-500/10 text-purple-400" delay={0.1} />
        <HealthCard label="Uptime" value={deviceStatus?.uptime != null ? formatDuration(deviceStatus.uptime) : "--"} icon={Clock} color="bg-amber-500/10 text-amber-400" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Connection Details</h3>
          <div className="space-y-3">
            {[
              { label: "Broker Status", value: connection === "connected" ? "Connected" : "Disconnected", color: connection === "connected" ? "text-emerald-400" : "text-red-400" },
              { label: "Device IP", value: deviceStatus?.ip || "N/A" },
              { label: "Firmware", value: deviceStatus?.firmware || "N/A" },
              { label: "Last Heartbeat", value: deviceStatus?.lastHeartbeat ? new Date(deviceStatus.lastHeartbeat).toLocaleString() : "N/A" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className={`text-sm font-mono ${item.color || "text-white"}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Sensors</h3>
          <div className="space-y-3">
              {[
                { label: "YL-83", desc: "Rain Detection (Digital + Analog)", status: telemetry?.rain ? "alert" : "active" },
                { label: "LDR", desc: "Light Sensor", status: "active" },
                { label: "Servo SG90", desc: "Clothesline Actuator", status: "active" },
              ].map((sensor) => (
                <div key={sensor.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-white">{sensor.label}</p>
                    <p className="text-xs text-gray-500">{sensor.desc}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sensor.status === "alert" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {sensor.status === "alert" ? "Alert" : "Active"}
                  </span>
                </div>
              ))}
            </div>
        </motion.div>
      </div>
    </div>
  );
}

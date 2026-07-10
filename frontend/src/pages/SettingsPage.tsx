import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/useAppStore";
import { useCommands } from "../hooks/useCommands";
import toast from "react-hot-toast";
import { Save, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const { config, updateConfig } = useAppStore();
  const { sendConfig } = useCommands();
  const [local, setLocal] = useState({ ...config });

  const handleSave = () => {
    updateConfig(local);
    sendConfig(local);
    toast.success("Configuration published to device");
  };

  const handleReset = () => {
    const defaults = {
      tempHigh: 30,
      tempLow: 18,
      humidityHigh: 80,
      nightLightThreshold: 200,
      telemetryInterval: 15,
    };
    setLocal(defaults);
    updateConfig(defaults);
    toast.success("Settings reset to defaults");
  };

  const fields = [
    { key: "tempHigh" as const, label: "High Temperature Threshold", unit: "°C", desc: "Line retracts above this" },
    { key: "tempLow" as const, label: "Low Temperature Threshold", unit: "°C", desc: "Line retracts below this" },
    { key: "humidityHigh" as const, label: "Humidity Threshold", unit: "%", desc: "Line retracts above this" },
    { key: "nightLightThreshold" as const, label: "Night Light Threshold", unit: "ADC", desc: "Night security trigger" },
    { key: "telemetryInterval" as const, label: "Telemetry Interval", unit: "sec", desc: "ESP32 publish rate" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400 text-sm">Configure automation thresholds and device parameters</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
            <RotateCcw size={14} />
            Reset
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
            <Save size={14} />
            Save & Publish
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-6">Automation Thresholds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-gray-400 text-sm">{f.label}</label>
              <p className="text-gray-600 text-xs mb-1">{f.desc}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={local[f.key]}
                  onChange={(e) => setLocal({ ...local, [f.key]: Number(e.target.value) })}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-500 text-xs w-8">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">MQTT Topics</h3>
        <div className="space-y-2">
          {[
            { topic: "clothesline/telemetry", dir: "Subscribe", desc: "Sensor data from ESP32" },
            { topic: "clothesline/status", dir: "Subscribe", desc: "Device online/offline" },
            { topic: "clothesline/events", dir: "Subscribe", desc: "System events" },
            { topic: "clothesline/system", dir: "Subscribe", desc: "System diagnostics" },
            { topic: "clothesline/control", dir: "Publish", desc: "Commands to ESP32" },
            { topic: "clothesline/config", dir: "Publish", desc: "Configuration updates" },
          ].map((t) => (
            <div key={t.topic} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div>
                <span className="font-mono text-xs text-emerald-400">{t.topic}</span>
                <p className="text-gray-500 text-xs mt-0.5">{t.desc}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                t.dir === "Publish" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
              }`}>
                {t.dir}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

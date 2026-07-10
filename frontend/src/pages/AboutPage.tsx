import { motion } from "framer-motion";
import { Cpu, Wifi, Cloud, Brain, Radio, GraduationCap, User, Code2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">About</h1>
        <p className="text-gray-400 text-sm">Smart Climate-Responsive IoT Window Management System</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-3">Project Objectives</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          This system automatically manages window positioning based on real-time environmental analysis.
          An ESP32 microcontroller monitors temperature, humidity, rain, light levels,
          and battery status. Using edge computing, it decides whether the window should open or close
          to maintain comfort, safety, and security. The dashboard serves as a remote command center,
          enabling real-time monitoring and manual override via MQTT.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: Cpu, title: "ESP32 Edge Computing", desc: "Local sensor fusion and autonomous decision-making without cloud dependency" },
          { icon: Radio, title: "MQTT over TLS", desc: "Secure bidirectional communication via HiveMQ Cloud using WSS protocol" },
          { icon: Cloud, title: "Cloud Integration", desc: "Real-time telemetry streaming with automatic reconnection and state sync" },
          { icon: Brain, title: "Intelligent Automation", desc: "Multi-factor decision engine: rain, night security, temperature limits, battery safety" },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gray-900 rounded-2xl p-5 border border-gray-800"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
              <item.icon size={18} className="text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Sensors & Hardware</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: "DHT22", purpose: "Temperature & Humidity" },
            { name: "YL-83", purpose: "Rain Detection" },
            { name: "LDR", purpose: "Light Intensity" },
            { name: "SG90 Servo", purpose: "Window Actuator" },
            { name: "ADC GPIO32", purpose: "Battery Monitor" },
          ].map((s) => (
            <div key={s.name} className="bg-gray-800 rounded-lg p-3">
              <p className="text-white text-sm font-medium">{s.name}</p>
              <p className="text-gray-500 text-xs">{s.purpose}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Technology Stack</h2>
        <div className="flex flex-wrap gap-2">
          {["React 19", "TypeScript", "Vite", "TailwindCSS", "Framer Motion", "Recharts", "mqtt.js", "Zustand", "Lucide React", "HiveMQ Cloud", "ESP32", "ArduinoJson", "PubSubClient"].map((tech) => (
            <span key={tech} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-full border border-gray-700">
              {tech}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Team & Supervision</h2>
        <div className="space-y-3">
          {[
            { icon: GraduationCap, label: "University", value: "Masinde Muliro University of Science and Technology (MMUST)" },
            { icon: User, label: "Department", value: "Industrial & Applied IoT" },
            { icon: Code2, label: "Version", value: "2.0.0 — Capstone 2026" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <item.icon size={16} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

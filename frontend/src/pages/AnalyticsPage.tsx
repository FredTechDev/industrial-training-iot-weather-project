import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/useAppStore";
import {
  LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
} from "recharts";
import { formatTime } from "../utils/format";
import { Clock, Thermometer, Droplets, CloudRain, Gauge } from "lucide-react";

const TIME_RANGES = [
  { label: "1H", minutes: 60 },
  { label: "24H", minutes: 1440 },
  { label: "7D", minutes: 10080 },
  { label: "30D", minutes: 43200 },
];

function ChartCard({ title, icon: Icon, children, delay = 0 }: {
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
        <Icon size={16} className="text-blue-400" />
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(60);
  const events = useAppStore((s) => s.events);

  // Build chart data from real telemetry
  const chartData = useMemo(() => {
    const now = Date.now();
    const cutoff = now - range * 60 * 1000;
    return events
      .filter((e) => new Date(e.timestamp).getTime() > cutoff)
      .map((e, i) => ({
        time: formatTime(e.timestamp),
        index: i,
      }));
  }, [events, range]);

  const sensorHistory = useAppStore((s) => s.telemetry);
  const dataPoints = useMemo(() => {
    const base = sensorHistory;
    if (!base) return [];
    return [{
      time: "Now",
      temp: base.temperature,
      humidity: base.humidity,
        pressure: base.pressure,
        rain: base.rain ? 1 : 0,
    }];
  }, [sensorHistory]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-400 text-sm">Historical trend analysis and visualizations</p>
        </div>
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.minutes}
              onClick={() => setRange(tr.minutes)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                range === tr.minutes ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {dataPoints.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
          <Clock size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">Waiting for telemetry data to populate charts</p>
          <p className="text-gray-600 text-xs mt-1">Data accumulates as the ESP32 sends readings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Temperature Trend" icon={Thermometer} delay={0}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dataPoints}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Humidity Trend" icon={Droplets} delay={0.05}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dataPoints}>
                <defs>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                <Area type="monotone" dataKey="humidity" stroke="#06b6d4" fill="url(#humGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Atmospheric Pressure" icon={Gauge} delay={0.1}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dataPoints}>
                <defs>
                  <linearGradient id="presGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis domain={[990, 1040]} tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                <Area type="monotone" dataKey="pressure" stroke="#8b5cf6" fill="url(#presGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Rain Events" icon={CloudRain} delay={0.15}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeatherReading } from "../../types";

interface TemperatureChartProps {
  data: WeatherReading[];
}

export default function TemperatureChart({ data }: TemperatureChartProps) {
  const chartData = data.map((r) => ({
    time: new Date(r.recordedAt).toLocaleTimeString(),
    temperature: Number(r.temperature),
    humidity: Number(r.humidity),
  }));

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Temperature & Humidity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
          <YAxis yAxisId="temp" stroke="#EF4444" fontSize={11} />
          <YAxis yAxisId="hum" orientation="right" stroke="#3B82F6" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temperature"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            name="Temperature (°C)"
          />
          <Line
            yAxisId="hum"
            type="monotone"
            dataKey="humidity"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Humidity (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

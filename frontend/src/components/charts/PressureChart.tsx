import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeatherReading } from "../../types";

interface PressureChartProps {
  data: WeatherReading[];
}

export default function PressureChart({ data }: PressureChartProps) {
  const chartData = data.map((r) => ({
    time: new Date(r.recordedAt).toLocaleTimeString(),
    pressure: Number(r.pressure),
  }));

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Atmospheric Pressure</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
          <YAxis domain={["dataMin - 5", "dataMax + 5"]} stroke="#8B5CF6" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Area
            type="monotone"
            dataKey="pressure"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.1}
            strokeWidth={2}
            name="Pressure (hPa)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

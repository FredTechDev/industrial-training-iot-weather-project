import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeatherReading } from "../../types";

interface LightChartProps {
  data: WeatherReading[];
}

export default function LightChart({ data }: LightChartProps) {
  const chartData = data.map((r) => ({
    time: new Date(r.recordedAt).toLocaleTimeString(),
    light: r.light,
    rain: r.rain ? 1 : 0,
  }));

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Light & Rain</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
          <YAxis yAxisId="light" stroke="#F59E0B" fontSize={11} />
          <YAxis yAxisId="rain" orientation="right" stroke="#06B6D4" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Bar yAxisId="light" dataKey="light" fill="#F59E0B" opacity={0.7} name="Light (lux)" />
          <Bar
            yAxisId="rain"
            dataKey="rain"
            fill="#06B6D4"
            opacity={0.7}
            name="Rain"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

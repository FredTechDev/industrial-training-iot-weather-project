import { useState } from "react";
import { useWeatherHistory } from "../hooks/useWeather";
import Spinner from "../components/common/Spinner";

export default function HistoryPage() {
  const [limit, setLimit] = useState(100);
  const { data: readings, isLoading } = useWeatherHistory("station-001", limit);

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Historical Data</h2>
          <p className="text-gray-400 text-sm">Past weather readings</p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
        >
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
          <option value={500}>Last 500</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-right py-3 px-4">Temperature</th>
                <th className="text-right py-3 px-4">Humidity</th>
                <th className="text-right py-3 px-4">Pressure</th>
                <th className="text-right py-3 px-4">Altitude</th>
                <th className="text-right py-3 px-4">Light</th>
                <th className="text-center py-3 px-4">Rain</th>
                <th className="text-right py-3 px-4">Battery</th>
              </tr>
            </thead>
            <tbody>
              {readings?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No historical data available
                  </td>
                </tr>
              ) : (
                readings?.map((r) => (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2 px-4 text-gray-300 whitespace-nowrap">
                      {new Date(r.recordedAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-right text-red-400">
                      {Number(r.temperature).toFixed(1)}°C
                    </td>
                    <td className="py-2 px-4 text-right text-blue-400">
                      {Number(r.humidity).toFixed(1)}%
                    </td>
                    <td className="py-2 px-4 text-right text-purple-400">
                      {Number(r.pressure).toFixed(1)} hPa
                    </td>
                    <td className="py-2 px-4 text-right text-gray-400">
                      {Number(r.altitude).toFixed(0)}m
                    </td>
                    <td className="py-2 px-4 text-right text-yellow-400">{r.light} lux</td>
                    <td className="py-2 px-4 text-center">{r.rain ? "🌧" : "☀️"}</td>
                    <td className="py-2 px-4 text-right text-green-400">
                      {Number(r.battery).toFixed(0)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {readings && (
        <p className="text-gray-500 text-xs">
          Showing {readings.length} readings
        </p>
      )}
    </div>
  );
}

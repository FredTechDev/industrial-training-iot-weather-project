import { useEffect, useState } from "react";
import type { WeatherReading } from "../types";
import { socketService } from "../services/socket";
import { weatherApi } from "../services/api";
import CurrentReadings from "../components/dashboard/CurrentReadings";
import Spinner from "../components/common/Spinner";

export default function LiveTelemetryPage() {
  const [reading, setReading] = useState<WeatherReading | null>(null);
  const [history, setHistory] = useState<WeatherReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    weatherApi.getLatest().then((data) => {
      setReading(data);
      setLoading(false);
    }).catch(() => setLoading(false));

    const handler = (data: WeatherReading) => {
      setReading(data);
      setHistory((prev) => [data, ...prev].slice(0, 50));
    };

    socketService.on("weather:reading", handler);
    return () => socketService.off("weather:reading", handler);
  }, []);

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Live Telemetry</h2>
        <p className="text-gray-400 text-sm">Real-time sensor readings from weather station</p>
      </div>

      <CurrentReadings initialData={reading} />

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Readings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">Time</th>
                <th className="text-right py-2 px-3">Temp</th>
                <th className="text-right py-2 px-3">Humidity</th>
                <th className="text-right py-2 px-3">Pressure</th>
                <th className="text-right py-2 px-3">Light</th>
                <th className="text-center py-2 px-3">Rain</th>
                <th className="text-right py-2 px-3">Battery</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    Waiting for readings...
                  </td>
                </tr>
              ) : (
                history.map((r) => (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2 px-3 text-gray-300">
                      {new Date(r.recordedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-right text-red-400">
                      {Number(r.temperature).toFixed(1)}°C
                    </td>
                    <td className="py-2 px-3 text-right text-blue-400">
                      {Number(r.humidity).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-purple-400">
                      {Number(r.pressure).toFixed(1)} hPa
                    </td>
                    <td className="py-2 px-3 text-right text-yellow-400">
                      {r.light} lux
                    </td>
                    <td className="py-2 px-3 text-center">
                      {r.rain ? "🌧" : "☀️"}
                    </td>
                    <td className="py-2 px-3 text-right text-green-400">
                      {Number(r.battery).toFixed(0)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

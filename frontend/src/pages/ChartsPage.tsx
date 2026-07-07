import { useState } from "react";
import { useChartData } from "../hooks/useWeather";
import TemperatureChart from "../components/charts/TemperatureChart";
import PressureChart from "../components/charts/PressureChart";
import LightChart from "../components/charts/LightChart";
import Spinner from "../components/common/Spinner";

export default function ChartsPage() {
  const [hours, setHours] = useState(6);
  const { data: chartData, isLoading } = useChartData("station-001", hours);

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Charts</h2>
          <p className="text-gray-400 text-sm">Visual weather data analysis</p>
        </div>
        <div className="flex gap-2">
          {[1, 6, 12, 24].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                hours === h
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      <TemperatureChart data={chartData || []} />
      <PressureChart data={chartData || []} />
      <LightChart data={chartData || []} />
    </div>
  );
}

import { useLatestReading, useTrends, useAlerts, useReports, useSystemStatus } from "../hooks/useWeather";
import CurrentReadings from "../components/dashboard/CurrentReadings";
import AIAnalysisCard from "../components/dashboard/AIAnalysisCard";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import TemperatureChart from "../components/charts/TemperatureChart";
import Spinner from "../components/common/Spinner";

export default function DashboardPage() {
  const { data: latest, isLoading: loadingLatest } = useLatestReading();
  const { data: trends } = useTrends();
  const { data: alerts } = useAlerts(5);
  const { data: reports } = useReports(1);
  const { data: status } = useSystemStatus();

  if (loadingLatest) return <Spinner size="lg" />;

  const chartData = trends?.sixHour
    ? [
        {
          recordedAt: new Date().toISOString(),
          temperature: Number(trends.sixHour.avgTemperature || 0),
          humidity: Number(trends.sixHour.avgHumidity || 0),
          pressure: 0,
          light: 0,
          rain: false,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm">Real-time weather monitoring</p>
        </div>
        {status && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Readings: {status.totalReadings}</span>
            <span>Active Alerts: {status.activeAlerts}</span>
            <span>Uptime: {Math.round(status.uptime / 60)}m</span>
          </div>
        )}
      </div>

      <CurrentReadings initialData={latest} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIAnalysisCard initialData={reports?.[0]} />
        <RecentAlerts initialData={alerts} />
      </div>

      <TemperatureChart data={[]} />
    </div>
  );
}

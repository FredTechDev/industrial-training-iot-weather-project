import { useDashboard } from "../hooks/useWeather";
import CurrentReadings from "../components/dashboard/CurrentReadings";
import AIAnalysisCard from "../components/dashboard/AIAnalysisCard";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import TemperatureChart from "../components/charts/TemperatureChart";
import Spinner from "../components/common/Spinner";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm">Real-time weather monitoring</p>
        </div>
        {data && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Readings: {data.totalReadings}</span>
            <span>Active Alerts: {data.activeAlerts.length}</span>
            <span>Uptime: {Math.round(data.uptime / 60)}m</span>
          </div>
        )}
      </div>

      <CurrentReadings initialData={data?.latestReading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIAnalysisCard initialData={data?.latestReport ?? undefined} />
        <RecentAlerts initialData={data?.activeAlerts} />
      </div>

      <TemperatureChart data={[]} />
    </div>
  );
}

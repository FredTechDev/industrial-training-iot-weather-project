import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Alert } from "../../types";
import { socketService } from "../../services/socket";

interface RecentAlertsProps {
  initialData?: Alert[];
}

const severityStyles = {
  info: "border-blue-500 bg-blue-500/10 text-blue-400",
  warning: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
  critical: "border-red-500 bg-red-500/10 text-red-400",
};

export default function RecentAlerts({ initialData }: RecentAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialData ?? []);

  useEffect(() => {
    const handler = (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 5));
    };
    socketService.on("weather:alert", handler);
    return () => socketService.off("weather:alert", handler);
  }, []);

  useEffect(() => {
    if (initialData) setAlerts(initialData);
  }, [initialData]);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔔</span>
          <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
        </div>
        <Link
          to="/alerts"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all
        </Link>
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-400 text-sm">No active alerts</p>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                severityStyles[alert.severity as keyof typeof severityStyles]
              }`}
            >
              <div className="mt-0.5">
                {alert.severity === "critical" && "🚨"}
                {alert.severity === "warning" && "⚠️"}
                {alert.severity === "info" && "ℹ️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs opacity-80 truncate">{alert.message}</p>
                <p className="text-xs opacity-50 mt-1">
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

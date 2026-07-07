import { useState } from "react";
import { useAlerts } from "../hooks/useWeather";
import { alertApi } from "../services/api";
import Spinner from "../components/common/Spinner";
import { useQueryClient } from "@tanstack/react-query";

const severityStyles = {
  info: "border-blue-500/30 bg-blue-500/5",
  warning: "border-yellow-500/30 bg-yellow-500/5",
  critical: "border-red-500/30 bg-red-500/5",
};

const statusStyles = {
  active: "text-green-400 bg-green-500/10",
  acknowledged: "text-yellow-400 bg-yellow-500/10",
  resolved: "text-gray-400 bg-gray-500/10",
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: alerts, isLoading } = useAlerts(100, filter);
  const queryClient = useQueryClient();

  const handleAcknowledge = async (id: string) => {
    await alertApi.acknowledge(id);
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };

  const handleResolve = async (id: string) => {
    await alertApi.resolve(id);
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Alerts</h2>
          <p className="text-gray-400 text-sm">Weather alerts and system notifications</p>
        </div>
        <div className="flex gap-2">
          {[
            { label: "All", value: undefined },
            { label: "Active", value: "active" },
            { label: "Acknowledged", value: "acknowledged" },
            { label: "Resolved", value: "resolved" },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {alerts?.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <p className="text-gray-400">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts?.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl p-4 border ${severityStyles[alert.severity]} flex items-start justify-between`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl mt-0.5">
                  {alert.severity === "critical" && "🚨"}
                  {alert.severity === "warning" && "⚠️"}
                  {alert.severity === "info" && "ℹ️"}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{alert.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[alert.status]}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{alert.message}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {alert.status === "active" && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-3 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30"
                  >
                    Acknowledge
                  </button>
                )}
                {alert.status !== "resolved" && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1 text-xs bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

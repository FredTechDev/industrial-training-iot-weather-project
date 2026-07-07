import { useSystemStatus, useDevices } from "../hooks/useWeather";
import Spinner from "../components/common/Spinner";

export default function SystemStatusPage() {
  const { data: status, isLoading: loadingStatus } = useSystemStatus();
  const { data: devices, isLoading: loadingDevices } = useDevices();

  if (loadingStatus || loadingDevices) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Status</h2>
        <p className="text-gray-400 text-sm">Overall system health and device status</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Readings</p>
          <p className="text-2xl font-bold text-white mt-1">{status?.totalReadings || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Last Hour</p>
          <p className="text-2xl font-bold text-white mt-1">{status?.lastHourReadings || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Active Alerts</p>
          <p className="text-2xl font-bold text-white mt-1">{status?.activeAlerts || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">WebSocket Clients</p>
          <p className="text-2xl font-bold text-white mt-1">{status?.websocketClients || 0}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Uptime</p>
            <p className="text-white">{Math.floor((status?.uptime || 0) / 3600)}h {Math.floor(((status?.uptime || 0) % 3600) / 60)}m</p>
          </div>
          <div>
            <p className="text-gray-400">Last Updated</p>
            <p className="text-white">{status?.timestamp ? new Date(status.timestamp).toLocaleString() : "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-400">Latest Reading</p>
            <p className="text-white">{status?.latestReading ? new Date(status.latestReading.recordedAt).toLocaleString() : "No data"}</p>
          </div>
          <div>
            <p className="text-gray-400">System Mode</p>
            <p className="text-white">Production</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Connected Devices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-3 px-6">Device ID</th>
                <th className="text-left py-3 px-6">Name</th>
                <th className="text-left py-3 px-6">Location</th>
                <th className="text-left py-3 px-6">Status</th>
                <th className="text-left py-3 px-6">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {devices?.map((device) => (
                <tr key={device.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-6 text-gray-300">{device.deviceId}</td>
                  <td className="py-3 px-6 text-white">{device.name || "N/A"}</td>
                  <td className="py-3 px-6 text-gray-400">{device.location || "N/A"}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        device.status === "online"
                          ? "text-green-400 bg-green-500/10"
                          : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-400">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

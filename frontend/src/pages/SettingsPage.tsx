export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400 text-sm">System configuration</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Alert Thresholds</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">High Temperature Threshold (°C)</label>
              <input
                type="number"
                defaultValue={40}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 border border-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Low Battery Threshold (%)</label>
              <input
                type="number"
                defaultValue={20}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 border border-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Low Pressure Threshold (hPa)</label>
              <input
                type="number"
                defaultValue={990}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 border border-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Reading Interval (seconds)</label>
              <input
                type="number"
                defaultValue={30}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 border border-gray-600"
              />
            </div>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-500">
            Save Settings
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">MQTT Configuration</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <p><span className="text-gray-500">Broker:</span> mosquitto:1883</p>
          <p><span className="text-gray-500">Live Topic:</span> weather/live</p>
          <p><span className="text-gray-500">Alerts Topic:</span> weather/alerts</p>
          <p><span className="text-gray-500">Status Topic:</span> weather/status</p>
        </div>
      </div>
    </div>
  );
}

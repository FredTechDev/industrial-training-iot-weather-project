import { useState, useEffect } from "react";
import { socketService } from "../../services/socket";

export default function Header() {
  const [connected, setConnected] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    socketService.connect();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socketService.on("connect", handleConnect);
    socketService.on("disconnect", handleDisconnect);

    const timer = setInterval(() => setTime(new Date()), 1000);

    return () => {
      socketService.off("connect", handleConnect);
      socketService.off("disconnect", handleDisconnect);
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🌤</div>
          <div>
            <h1 className="text-lg font-bold text-white">IoT Weather Station</h1>
            <p className="text-xs text-gray-400">AI-Driven Telemetry System</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-400">
              {connected ? "Live" : "Disconnected"}
            </span>
          </div>

          <div className="text-sm text-gray-400">
            {time.toLocaleTimeString()}
          </div>

          <div className="text-xs text-gray-500">
            {time.toLocaleDateString()}
          </div>
        </div>
      </div>
    </header>
  );
}

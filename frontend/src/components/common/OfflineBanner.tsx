import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  return (
    <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-2">
      <WifiOff size={14} className="text-red-400" />
      <span className="text-red-400 text-xs font-medium">
        MQTT Disconnected — Attempting to reconnect...
      </span>
    </div>
  );
}

import { useAppStore } from "../../stores/useAppStore";
import { Menu, Bell, Radio } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import { formatTime } from "../../utils/format";

export default function Header() {
  const { telemetry, connection, toggleSidebar } = useAppStore();

  return (
    <header className="h-14 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <Radio size={14} className={connection === "connected" ? "text-emerald-400" : "text-red-400"} />
          <span className="text-xs text-gray-400">
            {connection === "connected" ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {telemetry && (
          <>
            <StatusBadge status={telemetry.line} pulse />
            <StatusBadge status={telemetry.mode} />
            <StatusBadge status={telemetry.prediction} />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {telemetry && (
          <span className="text-xs text-gray-500 hidden sm:block">
            {formatTime(telemetry.timestamp || new Date())}
          </span>
        )}
        <div className="relative">
          <Bell size={16} className="text-gray-400" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>
    </header>
  );
}

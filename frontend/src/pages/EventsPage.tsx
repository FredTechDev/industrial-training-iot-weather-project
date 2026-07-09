import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/useAppStore";
import { formatTime } from "../utils/format";
import { Search, Filter, Clock, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  critical: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

export default function EventsPage() {
  const events = useAppStore((s) => s.events);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filter && e.type !== filter) return false;
      if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [events, search, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Event Timeline</h1>
          <p className="text-gray-400 text-sm">Chronological activity feed from the device</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5 border border-gray-700">
            {[null, "info", "warning", "critical", "success"].map((f) => (
              <button
                key={f || "all"}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filter === f ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {f ? f.charAt(0).toUpperCase() + f.slice(1) : "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
          <Clock size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">{events.length === 0 ? "No events yet" : "No matching events"}</p>
          <p className="text-gray-600 text-xs mt-1">Events will appear as telemetry arrives</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-800" />
          <div className="space-y-1">
            {filtered.map((event, i) => {
              const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.info;
              const Icon = config.icon;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="relative flex items-start gap-4 pl-2"
                >
                  <div className={`relative z-10 w-8 h-8 rounded-full ${config.bg} ${config.border} border flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={config.color} />
                  </div>
                  <div className="flex-1 bg-gray-900 rounded-xl p-3 border border-gray-800">
                    <p className="text-sm text-white">{event.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(event.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

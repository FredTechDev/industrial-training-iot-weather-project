import { NavLink } from "react-router-dom";
import { useAppStore } from "../../stores/useAppStore";
import { NAV_ITEMS } from "../../constants";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wifi, WifiOff, LayoutDashboard, Activity,
  SlidersHorizontal, Clock, HeartPulse, Settings, Info,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Activity, SlidersHorizontal,
  Clock, HeartPulse, Settings, Info,
};

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, connection } = useAppStore();

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden"
        }`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">SmartLine</p>
              <p className="text-gray-500 text-[10px]">IoT Control System</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs">
            {connection === "connected" ? (
              <Wifi size={12} className="text-emerald-400" />
            ) : (
              <WifiOff size={12} className="text-red-400" />
            )}
            <span className={connection === "connected" ? "text-emerald-400" : "text-red-400"}>
              MQTT {connection === "connected" ? "Connected" : connection === "reconnecting" ? "Reconnecting..." : "Offline"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

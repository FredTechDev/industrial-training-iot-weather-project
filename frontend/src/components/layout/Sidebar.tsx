import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/live", label: "Live Telemetry", icon: "📡" },
  { path: "/history", label: "Historical Data", icon: "📜" },
  { path: "/charts", label: "Charts", icon: "📈" },
  { path: "/reports", label: "AI Reports", icon: "🤖" },
  { path: "/alerts", label: "Alerts", icon: "🔔" },
  { path: "/status", label: "System Status", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <div className="text-xs text-gray-500 uppercase tracking-wider">Navigation</div>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-700/50 rounded-lg">
        <p className="text-xs text-gray-400">MMUST Industrial IoT</p>
        <p className="text-xs text-gray-500 mt-1">Capstone Project</p>
      </div>
    </aside>
  );
}

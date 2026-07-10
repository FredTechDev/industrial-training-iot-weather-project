import { motion } from "framer-motion";
import { useAppStore } from "../../stores/useAppStore";
import { mqttService } from "../../services/mqtt";
import { PRESENCE_OPTIONS } from "../../constants";
import { House, DoorOpen, Plane } from "lucide-react";
import toast from "react-hot-toast";

const ICON_MAP: Record<string, React.ElementType> = { House, DoorOpen, Plane };

export default function PresenceSelector() {
  const { presence, setPresence, addCommand } = useAppStore();

  const handlePresenceChange = (mode: "HOME" | "AWAY" | "VACATION") => {
    setPresence(mode);
    const ok = mqttService.publishPresence(mode);
    addCommand(mode, ok);
    toast.success(`Presence set to ${mode}`, { icon: mode === "HOME" ? "🏠" : mode === "AWAY" ? "🚪" : "✈️" });
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <House size={14} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Presence Mode</p>
          <p className="text-[10px] text-gray-500">Published to home/presence</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRESENCE_OPTIONS.map((opt) => {
          const Icon = ICON_MAP[opt.icon] || House;
          const isActive = presence === opt.value;

          return (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePresenceChange(opt.value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                isActive
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="presence-indicator"
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                />
              )}
              <Icon size={20} className={isActive ? "text-blue-400" : "text-gray-400"} />
              <span className={`text-sm font-semibold ${isActive ? "text-blue-400" : "text-gray-300"}`}>
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-600 mt-3 text-center">
        {PRESENCE_OPTIONS.find((o) => o.value === presence)?.description}
      </p>
    </div>
  );
}

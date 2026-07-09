import { mqttService } from "../../services/mqtt";
import { useAppStore } from "../../stores/useAppStore";
import { useCommands } from "../../hooks/useCommands";
import { MQTT_COMMANDS, MQTT_TOPICS } from "../../constants";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Bot, Lock, Unlock, OctagonAlert, RotateCcw, Signal, ShieldAlert,
} from "lucide-react";

const buttons = [
  { cmd: MQTT_COMMANDS.AUTO, label: "Auto Mode", icon: Bot, color: "bg-blue-600 hover:bg-blue-500", needsConfirm: false },
  { cmd: MQTT_COMMANDS.FORCE_OPEN, label: "Force Open", icon: Unlock, color: "bg-emerald-600 hover:bg-emerald-500", needsConfirm: false },
  { cmd: MQTT_COMMANDS.FORCE_CLOSE, label: "Force Close", icon: Lock, color: "bg-amber-600 hover:bg-amber-500", needsConfirm: false },
  { cmd: MQTT_COMMANDS.STOP_AUTOMATION, label: "Stop Auto", icon: OctagonAlert, color: "bg-orange-600 hover:bg-orange-500", needsConfirm: true },
  { cmd: MQTT_COMMANDS.RESTART_DEVICE, label: "Reboot", icon: RotateCcw, color: "bg-purple-600 hover:bg-purple-500", needsConfirm: true },
  { cmd: MQTT_COMMANDS.PING_DEVICE, label: "Ping", icon: Signal, color: "bg-cyan-600 hover:bg-cyan-500", needsConfirm: false },
];

export default function ControlPanel({ compact = false }: { compact?: boolean }) {
  const { send } = useCommands();
  const commandHistory = useAppStore((s) => s.commandHistory);

  const handleEmergency = () => {
    send(MQTT_COMMANDS.FORCE_CLOSE, "Emergency Close", true);
  };

  return (
    <div className="space-y-4">
      <div className={`grid ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"} gap-3`}>
        {buttons.map((b) => (
          <motion.button
            key={b.cmd}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => send(b.cmd, b.label, b.needsConfirm)}
            disabled={!mqttService.connected}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${b.color}`}
          >
            <b.icon size={20} />
            {b.label}
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleEmergency}
        disabled={!mqttService.connected}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-40"
      >
        <ShieldAlert size={18} />
        Emergency Close Window
      </motion.button>

      {commandHistory.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Recent Commands</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {commandHistory.slice(0, 10).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <span className="font-mono text-gray-300">{c.command}</span>
                <span className={c.ack ? "text-emerald-400" : "text-red-400"}>
                  {c.ack ? "sent" : "failed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

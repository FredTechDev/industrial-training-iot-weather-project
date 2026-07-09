import { motion } from "framer-motion";
import ControlPanel from "../components/control/ControlPanel";
import StatusBadge from "../components/common/StatusBadge";
import { useAppStore } from "../stores/useAppStore";
import { SlidersHorizontal } from "lucide-react";

export default function ControlCenterPage() {
  const { telemetry } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Control Center</h1>
        <p className="text-gray-400 text-sm">Send remote commands to the ESP32 window controller</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
      >
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal size={18} className="text-blue-400" />
          <h2 className="text-lg font-semibold">Remote Commands</h2>
        </div>

        <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 mb-2">Current Device State</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={telemetry?.window || "CLOSED"} pulse />
            <StatusBadge status={telemetry?.mode || "AUTO"} />
            <StatusBadge status={telemetry?.prediction || "SAFE"} />
          </div>
        </div>

        <ControlPanel />
      </motion.div>
    </div>
  );
}

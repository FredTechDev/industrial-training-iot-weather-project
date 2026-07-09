import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: string;
  color?: string;
  pulse?: boolean;
}

export default function StatusBadge({ status, color, pulse = false }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    OPEN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    CLOSED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    AUTO: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    MANUAL: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    SAFE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    WARNING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
    online: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    offline: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color || colorMap[status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {status}
    </motion.span>
  );
}

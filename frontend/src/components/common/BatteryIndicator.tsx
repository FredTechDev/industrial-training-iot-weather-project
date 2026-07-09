import { motion } from "framer-motion";

interface BatteryIndicatorProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

export default function BatteryIndicator({ level, size = "md" }: BatteryIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, level));
  const isLow = clamped < 20;
  const isWarning = clamped < 40;

  const heights = { sm: "h-3", md: "h-4", lg: "h-6" };
  const widths = { sm: "w-16", md: "w-24", lg: "w-32" };

  let fill = "bg-emerald-500";
  if (isLow) fill = "bg-red-500";
  else if (isWarning) fill = "bg-amber-500";

  return (
    <div className={`flex items-center gap-2 ${widths[size]}`}>
      <div className={`relative flex-1 ${heights[size]} bg-gray-700 rounded-sm border border-gray-600 overflow-hidden`}>
        <motion.div
          className={`absolute inset-y-0 left-0 ${fill} rounded-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <span className={`text-xs font-bold ${isLow ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}>
        {clamped}%
      </span>
    </div>
  );
}

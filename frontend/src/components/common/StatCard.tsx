interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { direction: "up" | "down" | "stable"; label: string };
  color?: string;
  size?: "sm" | "md" | "lg";
}

export default function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  color = "blue",
  size = "md",
}: StatCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const valueSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    stable: "text-yellow-400",
  };

  return (
    <div className={`bg-gray-800 rounded-xl ${sizeClasses[size]} border border-gray-700 hover:border-${color}-500/50 transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`${valueSizes[size]} font-bold text-white`}>{value}</span>
            {unit && <span className="text-gray-400 text-sm">{unit}</span>}
          </div>
          {trend && (
            <p className={`text-xs mt-1 ${trendColors[trend.direction]}`}>
              {trend.label}
            </p>
          )}
        </div>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
    </div>
  );
}

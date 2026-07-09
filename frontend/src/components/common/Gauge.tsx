import { useMemo } from "react";

interface GaugeProps {
  value: number;
  min?: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  color?: string;
  dangerLow?: number;
  dangerHigh?: number;
}

export default function Gauge({
  value, min = 0, max, label, unit, size = 140, color = "#3b82f6", dangerLow, dangerHigh,
}: GaugeProps) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const pct = clamp((value - min) / (max - min), 0, 1);
  const offset = circ * (1 - pct);
  const cx = size / 2;
  const cy = size / 2;

  const strokeColor = useMemo(() => {
    if (dangerLow !== undefined && value < dangerLow) return "#ef4444";
    if (dangerHigh !== undefined && value > dangerHigh) return "#ef4444";
    return color;
  }, [value, dangerLow, dangerHigh, color]);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke={strokeColor}
          strokeWidth="8" strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={offset} transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${strokeColor}50)` }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-white" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          {value.toFixed(1)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-400" style={{ fontSize: "0.65rem" }}>
          {unit}
        </text>
      </svg>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

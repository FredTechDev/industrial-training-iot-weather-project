import { useEffect, useState } from "react";
import type { WeatherReading } from "../../types";
import { socketService } from "../../services/socket";
import StatCard from "../common/StatCard";

interface CurrentReadingsProps {
  initialData?: WeatherReading | null;
}

function tempIcon(temp: number) {
  if (temp > 35) return "🔥";
  if (temp > 25) return "☀️";
  if (temp > 15) return "🌤";
  if (temp > 5) return "⛅";
  return "❄️";
}

function humidityIcon(h: number) {
  if (h > 80) return "💧";
  if (h > 50) return "💦";
  return "🌫";
}

function getRainIcon(rain: boolean) {
  return rain ? "🌧" : "☀️";
}

export default function CurrentReadings({ initialData }: CurrentReadingsProps) {
  const [reading, setReading] = useState<WeatherReading | null>(initialData ?? null);

  useEffect(() => {
    const handler = (data: WeatherReading) => setReading(data);
    socketService.on("weather:reading", handler);
    return () => socketService.off("weather:reading", handler);
  }, []);

  useEffect(() => {
    if (initialData) setReading(initialData);
  }, [initialData]);

  if (!reading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">Waiting for sensor data...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <StatCard
        title="Temperature"
        value={reading.temperature}
        unit="°C"
        icon={<span className="text-2xl">{tempIcon(reading.temperature)}</span>}
        size="lg"
      />
      <StatCard
        title="Humidity"
        value={reading.humidity}
        unit="%"
        icon={<span className="text-2xl">{humidityIcon(reading.humidity)}</span>}
        size="lg"
      />
      <StatCard
        title="Pressure"
        value={reading.pressure}
        unit="hPa"
        icon={<span className="text-2xl">🌡</span>}
        size="lg"
      />
      <StatCard
        title="Altitude"
        value={reading.altitude}
        unit="m"
        icon={<span className="text-2xl">🏔</span>}
        size="lg"
      />
      <StatCard
        title="Light"
        value={reading.light}
        unit="lux"
        icon={<span className="text-2xl">☀️</span>}
        size="lg"
      />
      <StatCard
        title="Rain"
        value={reading.rain ? "Detected" : "Clear"}
        icon={<span className="text-2xl">{getRainIcon(reading.rain)}</span>}
        color={reading.rain ? "cyan" : "yellow"}
        size="lg"
      />
      <StatCard
        title="Battery"
        value={reading.battery}
        unit="%"
        icon={<span className="text-2xl">🔋</span>}
        size="lg"
      />
      <StatCard
        title="Device"
        value={reading.deviceId}
        icon={<span className="text-2xl">📡</span>}
        size="lg"
      />
    </div>
  );
}

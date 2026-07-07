import { useQuery } from "@tanstack/react-query";
import { weatherApi, alertApi, reportApi, deviceApi, statusApi } from "../services/api";

export function useLatestReading(deviceId?: string) {
  return useQuery({
    queryKey: ["weather", "latest", deviceId],
    queryFn: () => weatherApi.getLatest(deviceId),
    refetchInterval: 30000,
  });
}

export function useWeatherHistory(deviceId?: string, limit = 100) {
  return useQuery({
    queryKey: ["weather", "history", deviceId, limit],
    queryFn: () => weatherApi.getHistory(deviceId, limit),
    refetchInterval: 60000,
  });
}

export function useChartData(deviceId?: string, hours = 24) {
  return useQuery({
    queryKey: ["weather", "charts", deviceId, hours],
    queryFn: () => weatherApi.getChartData(deviceId, hours),
    refetchInterval: 60000,
  });
}

export function useTrends(deviceId?: string) {
  return useQuery({
    queryKey: ["weather", "trends", deviceId],
    queryFn: () => weatherApi.getTrends(deviceId),
    refetchInterval: 60000,
  });
}

export function useAlerts(limit = 50, status?: string) {
  return useQuery({
    queryKey: ["alerts", limit, status],
    queryFn: () => alertApi.getAll(limit, status),
    refetchInterval: 30000,
  });
}

export function useReports(limit = 20) {
  return useQuery({
    queryKey: ["reports", limit],
    queryFn: () => reportApi.getAll(limit),
    refetchInterval: 60000,
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceApi.getAll(),
    refetchInterval: 30000,
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: () => statusApi.get(),
    refetchInterval: 15000,
  });
}

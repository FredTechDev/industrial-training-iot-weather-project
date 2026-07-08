import axios from "axios";
import type { WeatherReading, AiReport, Alert, Device, TrendData, SystemStatus } from "../types";

const api = axios.create({
  baseURL: "",
  timeout: 30000,
});

export const weatherApi = {
  getLatest: (deviceId?: string) =>
    api.get<WeatherReading>("/api/weather/latest", { params: { deviceId } }).then((r) => r.data),

  getHistory: (deviceId?: string, limit = 100, offset = 0) =>
    api
      .get<WeatherReading[]>("/api/weather/history", { params: { deviceId, limit, offset } })
      .then((r) => r.data),

  getChartData: (deviceId?: string, hours = 24) =>
    api
      .get<WeatherReading[]>("/api/weather/charts", { params: { deviceId, hours } })
      .then((r) => r.data),

  getTrends: (deviceId?: string) =>
    api.get<TrendData>("/api/weather/trends", { params: { deviceId } }).then((r) => r.data),
};

export const alertApi = {
  getAll: (limit = 50, status?: string) =>
    api.get<Alert[]>("/api/alerts", { params: { limit, status } }).then((r) => r.data),

  acknowledge: (id: string) => api.patch(`/api/alerts/${id}/acknowledge`).then((r) => r.data),
  resolve: (id: string) => api.patch(`/api/alerts/${id}/resolve`).then((r) => r.data),
};

export const reportApi = {
  getAll: (limit = 20) =>
    api.get<AiReport[]>("/api/reports", { params: { limit } }).then((r) => r.data),
};

export const deviceApi = {
  getAll: () => api.get<Device[]>("/api/devices").then((r) => r.data),
  register: (data: Partial<Device>) => api.post<Device>("/api/devices", data).then((r) => r.data),
  get: (deviceId: string) => api.get<Device>(`/api/devices/${deviceId}`).then((r) => r.data),
};

export const statusApi = {
  get: () => api.get<SystemStatus>("/api/status").then((r) => r.data),
};

export const dashboardApi = {
  get: () => api.get<import("../types").DashboardData>("/api/dashboard").then((r) => r.data),
};

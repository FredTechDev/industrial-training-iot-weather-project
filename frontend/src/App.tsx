import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import LiveTelemetryPage from "./pages/LiveTelemetryPage";
import HistoryPage from "./pages/HistoryPage";
import ChartsPage from "./pages/ChartsPage";
import AIReportsPage from "./pages/AIReportsPage";
import AlertsPage from "./pages/AlertsPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 15000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/live" element={<LiveTelemetryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/reports" element={<AIReportsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/status" element={<SystemStatusPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

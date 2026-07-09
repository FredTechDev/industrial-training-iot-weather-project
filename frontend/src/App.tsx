import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useMqtt } from "./hooks/useMqtt";
import AppLayout from "./layouts/AppLayout";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SensorsPage = lazy(() => import("./pages/SensorsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ControlCenterPage = lazy(() => import("./pages/ControlCenterPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const HealthPage = lazy(() => import("./pages/HealthPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  useMqtt();

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sensors" element={<SensorsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/control" element={<ControlCenterPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

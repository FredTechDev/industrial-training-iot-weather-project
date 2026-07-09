import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import OfflineBanner from "../components/common/OfflineBanner";
import { useAppStore } from "../stores/useAppStore";

export default function AppLayout() {
  const connection = useAppStore((s: { connection: string }) => s.connection);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {connection !== "connected" && <OfflineBanner />}
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

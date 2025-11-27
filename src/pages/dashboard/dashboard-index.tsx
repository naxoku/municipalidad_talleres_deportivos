import AdminDashboard from "./admin";
import ProfesorDashboard from "./profesor";

import { useAuth } from "@/context/auth";

export default function DashboardPage() {
  const { user } = useAuth();

  // Renderizar dashboard según el rol
  if (user?.rol === "admin") {
    return <AdminDashboard />;
  }

  if (user?.rol === "profesor") {
    return <ProfesorDashboard />;
  }

  return null;
}

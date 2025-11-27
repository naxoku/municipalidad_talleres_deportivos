import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Menu, ArrowLeft } from "lucide-react";

import { Sidebar } from "@/components/sidebar";

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profesor/talleres': 'Mis Talleres',
  '/profesor/asistencia': 'Marcar Asistencia',
  '/profesor/clases': 'Historial de Clases',
  '/profesor/alumnos': 'Mis Alumnos',
  '/profesor/horarios': 'Horarios',
  '/profesor/planificacion': 'Planificación',
  '/talleres': 'Talleres',
  '/alumnos': 'Alumnos',
  '/profesores': 'Profesores',
  '/horarios': 'Horarios',
  '/reportes': 'Reportes',
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const segments = location.pathname.split('/').filter(Boolean).length;
  const canGoBack = segments > 1;

  const title = pageTitles[location.pathname] || 'Talleres Municipales';

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-content1 border-b border-divider flex items-center justify-between px-4 z-10">
          {canGoBack && (
            <Button
              isIconOnly
              aria-label="Go back"
              variant="light"
              onPress={() => navigate(-1)}
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <h1 className="text-xl font-bold flex-1 text-center">{title}</h1>
          <Button
            isIconOnly
            aria-label="Toggle sidebar"
            variant="light"
            className={`lg:hidden transition-opacity duration-300 ease-in-out ${
              sidebarOpen ? "opacity-0" : "opacity-100"
            }`}
            onPress={toggleSidebar}
          >
            <Menu size={20} />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

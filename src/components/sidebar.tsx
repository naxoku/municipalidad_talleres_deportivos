import { Link, useLocation } from "react-router-dom";
import { Button, ScrollShadow } from "@heroui/react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Calendar,
  User,
  Sun,
  Moon,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@heroui/use-theme";

import { useAuth } from "@/context/auth";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // For mobile
  const { theme, setTheme } = useTheme();

  // Definir menú según el rol
  const menuItems =
    user?.rol === "admin"
      ? [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Talleres", path: "/talleres", icon: BookOpen },
          { name: "Alumnos", path: "/alumnos", icon: Users },
          { name: "Profesores", path: "/profesores", icon: User },
          { name: "Horarios", path: "/horarios", icon: Calendar },
          { name: "Reportes", path: "/reportes", icon: FileText },
        ]
      : [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Mis Talleres", path: "/profesor/talleres", icon: BookOpen },
          { name: "Mis Alumnos", path: "/profesor/alumnos", icon: Users },
          { name: "Horarios", path: "/horarios", icon: Calendar },
          { name: "Asistencia", path: "/asistencia", icon: CheckCircle },
          { name: "Planificación", path: "/planificacion", icon: FileText },
        ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          isIconOnly
          aria-label="Abrir menú"
          className={isOpen ? "hidden" : ""}
          variant="flat"
          onPress={toggleSidebar}
        >
          <Menu />
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        h-full w-64 bg-content1 border-r border-divider
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-divider">
          <div className="flex items-center gap-2 font-bold text-xl text-inherit">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              M
            </div>
            MuniDeportes
          </div>
          <Button
            isIconOnly
            aria-label="Cerrar menú"
            className="ml-auto lg:hidden"
            variant="light"
            onPress={() => setIsOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollShadow className="flex-1 py-6 px-4">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  className={`
                                flex items-center gap-3 px-3 py-2 rounded-medium transition-colors
                                ${
                                  isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-default-500 hover:bg-default-100 hover:text-default-900"
                                }
                            `}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </ScrollShadow>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-divider">
          <div className="bg-default-50 rounded-lg p-3 mb-4 flex flex-col items-center gap-2">
            <Shield className="text-primary" size={20} />
            <div className="text-center">
              <p className="text-sm font-medium">{user?.nombre}</p>
              <p className="text-xs text-default-500 capitalize">
                {user?.rol === "admin" ? "Administrador" : "Profesor"}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <Button
              fullWidth
              startContent={
                theme === "light" ? <Moon size={18} /> : <Sun size={18} />
              }
              variant="flat"
              onPress={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "Modo Oscuro" : "Modo Claro"}
            </Button>
          </div>
          <Button
            fullWidth
            color="danger"
            startContent={<LogOut size={18} />}
            variant="flat"
            onPress={logout}
          >
            Cerrar Sesión
          </Button>
        </div>
      </aside>
    </>
  );
};

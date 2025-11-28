import { Link, useLocation } from "react-router-dom";
import { Button, ScrollShadow } from "@heroui/react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  LogOut,
  X,
  Calendar,
  User,
  Sun,
  Moon,
  Shield,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import { useTheme } from "@heroui/use-theme";

import { useAuth } from "@/context/auth";

export const Sidebar = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
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
          {
            name: "Mis talleres",
            path: "/panel-profesor/talleres",
            icon: BookOpen,
          },
          { name: "Mis alumnos", path: "/panel-profesor/alumnos", icon: Users },
          {
            name: "Horarios",
            path: "/panel-profesor/horarios",
            icon: Calendar,
          },
          {
            name: "Planificación",
            path: "/panel-profesor/planificacion",
            icon: FileText,
          },
          {
            name: "Historial de clases",
            path: "/panel-profesor/clases",
            icon: ClipboardCheck,
          },
        ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          aria-label="Cerrar menú"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          role="button"
          tabIndex={0}
          onClick={() => onClose()}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") onClose();
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        h-full w-64 bg-content1 border-r border-divider
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col
      `}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-divider">
          <div className="flex items-center gap-3">
            <img
              alt="Logo Municipalidad de Deportes"
              className="h-10 w-10 object-contain"
              src="/assets/android-chrome-192x192.png"
            />
            <span className="font-bold text-sm leading-tight text-inherit max-w-[140px] whitespace-normal break-words">
              Oficina Municipal de Deportes
            </span>
          </div>
          <Button
            isIconOnly
            aria-label="Cerrar menú"
            className="ml-auto lg:hidden"
            variant="light"
            onPress={() => onClose()}
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
                  onClick={() => onClose()}
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
          <div className="bg-default-50 rounded-lg p-3 mb-4 flex flex-col gap-2 items-center">
            <div className="flex items-center gap-2">
              {user?.rol === "admin" ? (
                <Shield className="text-primary" size={20} />
              ) : (
                <GraduationCap className="text-primary" size={20} />
              )}
              <div className="text-left">
                <p className="text-sm font-medium">{user?.nombre}</p>
              </div>
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

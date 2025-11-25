import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { showToast } from "@/lib/toast";
import { User, Role } from "@/types/schema";
import { authApi, LoginCredentials } from "@/api/auth";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  // indica si el proveedor ya leyó el localStorage y está listo
  isAuthReady: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Recuperar usuario almacenado
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    // Ya terminamos la carga inicial
    setIsAuthReady(true);
  }, []);

  // use showToast wrapper

  // Escuchar eventos globales de expiración/invalidación del token (disparados por axios)
  useEffect(() => {
    const onUnauthorized = () => {
      // Limpiar estado local y redirigir a login
      setUser(null);
      try {
        localStorage.removeItem("user");
      } catch {
        /* ignored */
      }

      showToast({
        title: "Tu sesión expiró",
        description: "Por favor inicia sesión de nuevo",
        color: "primary",
      });
      navigate("/login");
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
    };
  }, [navigate]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);

      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          nombre: response.user.nombre,
          rol: response.user.rol,
          token: response.user.token,
          profesor_id: response.user.profesor_id,
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        showToast({
          title: `Bienvenido, ${userData.nombre}`,
          color: "success",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Error al iniciar sesión";

      showToast({ title: errorMessage, color: "danger" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (user?.token) {
      authApi.logout(user.token).catch(() => {
        // Ignorar errores de logout en el backend
      });
    }

    setUser(null);
    localStorage.removeItem("user");
    showToast({ title: "Sesión cerrada", color: "primary" });
    navigate("/login");
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Definir permisos por rol
    const permissions: Record<Role, string[]> = {
      admin: [
        "view_dashboard",
        "manage_talleres",
        "manage_alumnos",
        "manage_profesores",
        "manage_horarios",
        "manage_asistencia",
        "manage_ubicaciones",
        "generate_reports",
        "manage_users",
        "view_reports",
      ],
      profesor: [
        "view_dashboard",
        "view_my_talleres",
        "view_my_alumnos",
        "manage_asistencia",
        "view_horarios",
        "manage_planificacion",
        "view_simple_reports",
      ],
    };

    return permissions[user.rol]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAuthReady,
        isLoading,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

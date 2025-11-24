import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { User, Role } from "@/types/schema";
import { authApi, LoginCredentials } from "@/api/auth";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Recuperar usuario almacenado
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
  }, []);

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

        toast.success(`Bienvenido, ${userData.nombre}`);
        navigate("/dashboard");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Error al iniciar sesión";

      toast.error(errorMessage);
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
    toast.info("Sesión cerrada");
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

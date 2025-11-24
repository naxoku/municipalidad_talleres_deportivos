import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@heroui/react";

import { useAuth } from "@/context/auth";
import { Role } from "@/types/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
  requiredPermission?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Redirigir al login guardando la ubicación actual
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  // Verificar rol requerido
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!roles.includes(user.rol)) {
      // No tiene el rol necesario, redirigir al dashboard
      return <Navigate replace to="/dashboard" />;
    }
  }

  // Verificar permiso requerido
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // No tiene el permiso necesario
    return <Navigate replace to="/dashboard" />;
  }

  return <>{children}</>;
};

// HOC para proteger componentes
export const withAuth = (
  Component: React.ComponentType,
  options?: {
    requiredRole?: Role | Role[];
    requiredPermission?: string;
  },
) => {
  const WrappedComponent = (props: any) => (
    <ProtectedRoute
      requiredPermission={options?.requiredPermission}
      requiredRole={options?.requiredRole}
    >
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
};

// Componente para mostrar loading durante autenticación
export const AuthLoader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner label="Verificando autenticación..." size="lg" />
    </div>
  );
};

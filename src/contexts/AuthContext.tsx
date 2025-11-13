import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definir tipos
type UserRole = 'administrador' | 'profesor' | null;

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de autenticación
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un usuario guardado al iniciar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error al verificar estado de autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (role: UserRole) => {
    if (!role) return;
    
    const userData: User = {
      id: Date.now(), // ID temporal, en un sistema real vendría del backend
      nombre: role === 'administrador' ? 'Administrador' : 'Profesor',
      email: role === 'administrador' ? 'admin@correo.cl' : 'profesor@correo.cl',
      rol: role
    };

    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallback = null 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null; // O un componente de loading
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredRole && user?.rol !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
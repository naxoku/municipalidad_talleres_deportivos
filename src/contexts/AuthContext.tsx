import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// MODIFICADO: Importar desde adminApi en lugar de auth
import { login as apiLogin } from '../api/adminApi'; 

// ... (Tipos e interfaces existentes)
// ... (código existente sin cambios)
interface User {
  id: number;
// ... (código existente sin cambios)
  nombre: string;
  email: string;
  rol: 'admin' | 'profesor' | 'estudiante';
}

interface AuthContextType {
// ... (código existente sin cambios)
  user: User | null;
  isLoading: boolean;
// ... (código existente sin cambios)
  login: (email: string, contrasena: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
// ... (código existente sin cambios)
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
// ... (código existente sin cambios)
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
// ... (código existente sin cambios)
        const userDataString = await AsyncStorage.getItem('userData');
        
        if (token && userDataString) {
          setUser(JSON.parse(userDataString));
// ... (código existente sin cambios)
        }
      } catch (error) {
        console.error("Error al verificar auth", error);
// ... (código existente sin cambios)
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, contrasena: string) => {
// ... (código existente sin cambios)
    try {
      setIsLoading(true);
      // MODIFICADO: apiLogin ahora viene de adminApi
      const data = await apiLogin(email, contrasena); 

      if (data.token && data.usuario) {
// ... (código existente sin cambios)
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.usuario));
        setUser(data.usuario);
      } else {
// ... (código existente sin cambios)
        throw new Error(data.error || 'Respuesta de login inválida');
      }
    } catch (error: any) {
      // MODIFICADO: Mejorar el log de errores
      // Ahora podemos ver los campos recibidos si el backend los envía
      console.error("Error en el login:", error);
      if (error.campos_recibidos) {
        console.error("Campos recibidos por el backend:", error.campos_recibidos);
      }
      throw new Error(error.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
// ... (código existente sin cambios)
    }
  };

  const logout = async () => {
// ... (código existente sin cambios)
    try {
      setIsLoading(true);
// ... (código existente sin cambios)
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
// ... (código existente sin cambios)
      console.error("Error al cerrar sesión", error);
    } finally {
      setIsLoading(false);
    }
  };
// ... (código existente sin cambios)

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
// ... (código existente sin cambios)

export const useAuth = () => {
  const context = useContext(AuthContext);
// ... (código existente sin cambios)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
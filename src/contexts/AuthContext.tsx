import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'administrador' | 'profesor' | null;
  login: (role: 'administrador' | 'profesor') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const platformType = Platform.OS === 'web' ? 'web' : 'native';
  const defaultRole: 'administrador' | 'profesor' = platformType === 'web' ? 'administrador' : 'profesor';

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState<'administrador' | 'profesor' | null>(defaultRole);

  const login = (role: 'administrador' | 'profesor') => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

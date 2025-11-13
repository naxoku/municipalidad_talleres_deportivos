import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

interface AdminSidebarProps {
  currentScreen?: string;
  onNavigate?: (screenName: string) => void;
}

const AdminSidebar = ({ currentScreen, onNavigate }: AdminSidebarProps) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Gestión Usuarios', screen: 'GestionUsuarios' },
    { name: 'Gestión Cursos', screen: 'GestionCursos' },
    { name: 'Gestión Indumentaria', screen: 'GestionIndumentaria' },
    { name: 'Asignar Indumentaria', screen: 'AsignarIndumentaria' },
    { name: 'Reportes', screen: 'Reportes' },
  ];

  const handleLogout = () => {
    logout();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.menuItem,
            (currentScreen === item.screen || route.name === item.screen) && styles.activeMenuItem,
          ]}
          onPress={() => {
            if (onNavigate) {
              onNavigate(item.screen);
            } else {
              navigation.navigate(item.screen);
            }
          }}
        >
          <Text
            style={[
              styles.menuText,
              route.name === item.screen && styles.activeMenuText,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
      
      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#e6f3e6', // Un verde claro para el fondo activo
  },
  menuText: {
    fontSize: 16,
    color: '#333', // Color de texto oscuro
    marginLeft: 10,
  },
  activeMenuText: {
    color: '#007F00', // Verde oscuro para el texto activo
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: '#cc0000', // Rojo para el botón de logout
  },
  logoutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminSidebar;
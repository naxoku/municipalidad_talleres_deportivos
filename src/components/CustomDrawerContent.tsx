import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import {
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext'; // Ruta al AuthContext
import AdminSidebar from './AdminSidebar';
import ProfesorSidebar from './ProfesorSidebar';

// Importa la imagen del logo
const logo = require('../assets/images/logo_omd.png');

type UserRole = 'admin' | 'profesor';

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userRole: UserRole;
}

export default function CustomDrawerContent({
  state,
  navigation,
  userRole,
}: CustomDrawerContentProps) {
  // Obtener el usuario y la función de logout del contexto
  const { user, logout } = useAuth();

  const handleLogout = () => {
    // Opcional: Pedir confirmación antes de cerrar sesión
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Sí, Cerrar Sesión", 
          onPress: () => {
            console.log("Llamando a logout() desde el drawer...");
            logout(); // Llama a la función logout del contexto
          },
          style: "destructive"
        }
      ]
    );
  };

  // Determinar la ruta/pantalla actual
  const currentScreen = state.routes[state.index]?.name || '';

  const handleNavigate = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  const renderSidebar = () => {
    if (userRole === 'admin') {
      return (
        <AdminSidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
        />
      );
    } else {
      return (
        <ProfesorSidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerContainer}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Talleres Deportivos</Text>
        {user && (
          <Text style={styles.userName}>{user.nombre || 'Usuario'}</Text>
        )}
      </View>

      <View style={styles.menuContainer}>
        {renderSidebar()}
      </View>
      
      {/* Botón de Cerrar Sesión en la parte inferior */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Fondo blanco para el drawer
  },
  headerContainer: {
    backgroundColor: '#007F00', // Color verde principal
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: { // Corregido: Se eliminaron los paréntesis extra
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    color: '#e0e0e0', // Un color más suave para el nombre
    marginTop: 4,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#cc0000', // Rojo para el botón de logout
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
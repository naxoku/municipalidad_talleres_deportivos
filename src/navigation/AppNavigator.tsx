import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { shadows } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import GlobalSearch from '../components/GlobalSearch';
import ProfesoresScreen from '../screens/ProfesoresScreen';
// import EstudiantesScreen from '../screens/EstudiantesScreen';
// import TalleresScreen from '../screens/TalleresScreen';

import TalleresEnhancedScreen from '../screens/TalleresEnhancedScreen';
import EstudiantesEnhancedScreen from '../screens/EstudiantesEnhancedScreen';


import HorariosScreen from '../screens/HorariosScreen';
import InscripcionesScreen from '../screens/InscripcionesScreen';
import ClasesScreen from '../screens/ClasesScreen';
import AsistenciaScreen from '../screens/AsistenciaScreen';
import IndumentariaScreen from '../screens/IndumentariaScreen';
import ReportesScreen from '../screens/ReportesScreen';

const Drawer = createDrawerNavigator();

function DrawerNavigatorContent() {
  const { isDesktop, isWeb } = useResponsive();
  const { userRole } = useAuth();
  const shouldShowPermanent = isWeb && isDesktop;

  const isAdmin = userRole === 'administrador';
  const isProfesor = userRole === 'profesor';

  return (
    // Header con barra de búsqueda global
    <View style={{ flex: 1 }}>
      {shouldShowPermanent && (
        <View style={[styles.topBar, { left: 0, right: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: shouldShowPermanent ? 250 : 0 }}>
            <Text style={styles.topBarTitle}>Talleres Municipales</Text>
          </View>
          <View style={{ marginLeft: shouldShowPermanent ? 250 : 0 }}>
            <GlobalSearch inline />
          </View>
        </View>
      )}
      <View style={{ flex: 1, paddingTop: shouldShowPermanent ? 64 : 0 }}>
        <Drawer.Navigator id={undefined}
        screenOptions={{
        drawerType: shouldShowPermanent ? 'permanent' : 'front',
        drawerStyle: {
          backgroundColor: colors.primary,
          width: shouldShowPermanent ? 250 : 280,
          height: '100%',
          paddingTop: 0,
        },
        drawerActiveTintColor: colors.text.light,
        drawerInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        drawerItemStyle: {
          marginVertical: 4,
          borderRadius: 8,
          marginHorizontal: 8,
        },
        drawerActiveBackgroundColor: colors.primaryLight,
        drawerInactiveBackgroundColor: 'transparent',
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: colors.text.light,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShown: !shouldShowPermanent,
      }}
    >
      {isAdmin && (
        <>
          <Drawer.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
              title: 'Dashboard',
              headerRight: ({ tintColor }) => (
                // @ts-ignore - navigation passed automatically by drawer screens
                <GlobalSearch />
              ),
            }}
          />
          <Drawer.Screen
            name="Profesores"
            component={ProfesoresScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
              title: 'Profesores',
            }}
          />
          {/* <Drawer.Screen
            name="Estudiantes"
            component={EstudiantesScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="school" size={size} color={color} />
              ),
              title: 'Estudiantes',
            }}
          />
          <Drawer.Screen
            name="Talleres"
            component={TalleresScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="book" size={size} color={color} />
              ),
              title: 'Talleres',
            }}
          /> */}
          <Drawer.Screen name="Talleres" component={TalleresEnhancedScreen} 
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="book" size={size} color={color} />
              ),
              title: 'Talleres',
            }}
          />
          <Drawer.Screen name="Estudiantes" component={EstudiantesEnhancedScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="school" size={size} color={color} />
              ),
              title: 'Estudiantes',
            }}
          />
          <Drawer.Screen
            name="Horarios"
            component={HorariosScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="time" size={size} color={color} />
              ),
              title: 'Horarios',
            }}
          />
          <Drawer.Screen
            name="Inscripciones"
            component={InscripcionesScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="checkmark-circle" size={size} color={color} />
              ),
              title: 'Inscripciones',
            }}
          />
          <Drawer.Screen
            name="Clases"
            component={ClasesScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="calendar" size={size} color={color} />
              ),
              title: 'Clases',
            }}
          />
          <Drawer.Screen
            name="Asistencia"
            component={AsistenciaScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="location" size={size} color={color} />
              ),
              title: 'Asistencia',
            }}
          />
          <Drawer.Screen
            name="Indumentaria"
            component={IndumentariaScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="shirt" size={size} color={color} />
              ),
              title: 'Indumentaria',
            }}
          />
          <Drawer.Screen
            name="Reportes"
            component={ReportesScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="bar-chart" size={size} color={color} />
              ),
              title: 'Reportes',
            }}
          />
        </>
      )}
      {isProfesor && (
        <>
          <Drawer.Screen
            name="Mis Talleres"
            component={TalleresEnhancedScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="book" size={size} color={color} />
              ),
              title: 'Mis Talleres',
            }}
          />
          <Drawer.Screen
            name="Horarios"
            component={HorariosScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="time" size={size} color={color} />
              ),
              title: 'Horarios',
            }}
          />
          <Drawer.Screen
            name="Estudiantes"
            component={EstudiantesEnhancedScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="school" size={size} color={color} />
              ),
              title: 'Estudiantes',
            }}
          />
          <Drawer.Screen
            name="Asistencia"
            component={AsistenciaScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="location" size={size} color={color} />
              ),
              title: 'Asistencia',
            }}
          />
          <Drawer.Screen
            name="Clases"
            component={ClasesScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="calendar" size={size} color={color} />
              ),
              title: 'Clases',
            }}
          />
        </>
      )}
        </Drawer.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    height: 64,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 1000,
    ...(shadows.sm as any),
  },
  topBarTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: -0.5,
  }
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <DrawerNavigatorContent />
    </NavigationContainer>
  );
}

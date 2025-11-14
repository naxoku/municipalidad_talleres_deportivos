import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';

// Screens
import ProfesoresScreen from '../screens/ProfesoresScreen';
import EstudiantesScreen from '../screens/EstudiantesScreen';
import TalleresScreen from '../screens/TalleresScreen';
import HorariosScreen from '../screens/HorariosScreen';
import InscripcionesScreen from '../screens/InscripcionesScreen';
import ClasesScreen from '../screens/ClasesScreen';
import AsistenciaScreen from '../screens/AsistenciaScreen';
import IndumentariaScreen from '../screens/IndumentariaScreen';

const Drawer = createDrawerNavigator();

function DrawerNavigatorContent() {
  const { isDesktop, isWeb } = useResponsive();
  const shouldShowPermanent = isWeb && isDesktop;

  return (
    /* @ts-ignore - Version mismatch con tipos de navigation */
    <Drawer.Navigator
      screenOptions={{
        drawerType: shouldShowPermanent ? 'permanent' : 'front',
        drawerStyle: {
          backgroundColor: colors.primary,
          width: shouldShowPermanent ? 250 : 280,
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
          shadowOpacity: 0,
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
        <Drawer.Screen
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
      </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <DrawerNavigatorContent />
    </NavigationContainer>
  );
}

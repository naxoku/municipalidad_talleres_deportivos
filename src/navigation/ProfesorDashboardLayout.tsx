import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ProfesorDrawerParamList } from "../types/navigation";
import { useAuth } from "../contexts/AuthContext";

import ProfesorDashboardScreen from "../screens/DashboardProfesor";
import AsistenciaScreen from "../screens/AsistenciaScreen";
import PlanificacionScreen from "../screens/PlanificacionScreen";
import ListadoClasesScreen from "../screens/ListadoClasesScreen";
import ListadoAlumnosScreen from "../screens/ListadoAlumnosScreen";
import AsignarIndumentariaScreen from "../screens/AsignarIndumentariaScreen";
import CustomDrawerContent from "../components/CustomDrawerContent";

const Drawer = createDrawerNavigator<ProfesorDrawerParamList>();

interface ProfesorDashboardLayoutProps {
  userRole: "admin" | "profesor";
}

export default function ProfesorDashboardLayout({ userRole }: ProfesorDashboardLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaProvider>
      <Drawer.Navigator
        id={undefined}
        drawerContent={(props) => <CustomDrawerContent {...props} userRole={userRole} />}
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: "#333",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          drawerStyle: {
            backgroundColor: "#333",
            width: 250,
          },
          drawerActiveTintColor: "#fff",
          drawerActiveBackgroundColor: "#007F00",
          drawerInactiveTintColor: "#ddd",
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: "500",
          },
          drawerType: Platform.select({
            web: "slide",
            default: "front",
          }),
          overlayColor: Platform.select({
            web: "transparent",
            default: "rgba(0, 0, 0, 0.5)",
          }),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="menu" size={30} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={logout}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="log-out" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      >
        <Drawer.Screen
          name="ProfesorDrawerDashboard"
          component={ProfesorDashboardScreen}
          options={{
            drawerLabel: "Dashboard",
            title: "Dashboard",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Asistencia"
          component={AsistenciaScreen}
          options={{
            drawerLabel: "Asistencia",
            title: "Asistencia",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Planificacion"
          component={PlanificacionScreen}
          options={{
            drawerLabel: "Planificación",
            title: "Planificación",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="ListadoClases"
          component={ListadoClasesScreen}
          options={{
            drawerLabel: "Listado de Clases",
            title: "Listado de Clases",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="ListadoAlumnos"
          component={ListadoAlumnosScreen}
          options={{
            drawerLabel: "Listado de Alumnos",
            title: "Listado de Alumnos",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="AsignarIndumentaria"
          component={AsignarIndumentariaScreen}
          options={{
            drawerLabel: "Asignar Indumentaria",
            title: "Asignar Indumentaria",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="shirt" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </SafeAreaProvider>
  );
}
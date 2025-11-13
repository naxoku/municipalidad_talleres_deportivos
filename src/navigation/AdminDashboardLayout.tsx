import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AdminDrawerParamList } from "../types/navigation";

import ManageUsersScreen from "../screens/ManageUsersScreen";
import CourseListScreen from "../screens/CourseListScreen";
import ReportsScreen from "../screens/ReportsScreen";
import CustomDrawerContent from "../components/CustomDrawerContent";

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

interface AdminDashboardLayoutProps {
  userRole: "admin" | "profesor";
}

export default function AdminDashboardLayout({ userRole }: AdminDashboardLayoutProps) {
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
            default: "rgba(0, 0, 0, 0.5)"
          }),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="menu" size={30} color="#fff" />
            </TouchableOpacity>
          ),
          // Removemos el headerRight con el botón de logout
        })}
      >
        <Drawer.Screen
          name="GestionUsuarios"
          component={ManageUsersScreen}
          options={{
            drawerLabel: "Gestión de Usuarios",
            title: "Gestión de Usuarios",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="GestionCursos"
          component={CourseListScreen}
          options={{
            drawerLabel: "Gestión de Cursos",
            title: "Gestión de Cursos",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Reportes"
          component={ReportsScreen}
          options={{
            drawerLabel: "Generar Reportes",
            title: "Generar Reportes",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="GestionIndumentaria"
          component={CourseListScreen}
          options={{
            drawerLabel: "Gestión de Indumentaria",
            title: "Gestión de Indumentaria",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="create" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </SafeAreaProvider>
  );
}
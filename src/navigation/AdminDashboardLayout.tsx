import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminDrawerParamList } from "../types/navigation";

import ManageUsersScreen from "../screens/ManageUsersScreen";
import CourseListScreen from "../screens/CourseListScreen";
import ReportsScreen from "../screens/ReportsScreen";
import ModifyCoursesScreen from "../screens/CourseListScreen";
import CustomDrawerContent from "../components/CustomDrawerContent";

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

export default function AdminDashboardLayout() {
  return (
    <Drawer.Navigator id={undefined}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
          web: "slide", // Cambiado a "slide" para permitir el cierre en web
          default: "front",
        }),
        headerLeft: () =>
          Platform.OS === "web" ? (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="menu" size={30} color="#fff" />
            </TouchableOpacity>
          ) : undefined,
      })}
    >
      <Drawer.Screen
        name="ManageUsers"
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
        name="CourseList"
        component={CourseListScreen}
        options={{
          drawerLabel: "Listado de Cursos",
          title: "Listado de Cursos",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports"
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
        name="ModifyCourses"
        component={CourseListScreen}
        options={{
          drawerLabel: "Modificar Cursos",
          title: "Modificar Cursos",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
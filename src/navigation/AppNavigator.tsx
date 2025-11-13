import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/navigation";

import LoginScreen from "../screens/LoginScreen";
import AdminDashboardLayout from "./AdminDashboardLayout";
import ProfesorDashboardLayout from "./ProfesorDashboardLayout";
import { useAuth } from "../contexts/AuthContext";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    // Muestra un indicador de carga mientras se verifica el estado de autenticación
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        initialRouteName={!isAuthenticated ? "Login" : (user?.rol === "administrador" ? "AdminDashboard" : "ProfesorDashboard")}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="Login"
          options={{ headerShown: false }}
        >
          {(props) => <LoginScreen />}
        </Stack.Screen>
        
        <Stack.Screen
          name="AdminDashboard"
          options={{ headerShown: false }}
        >
          {(props) => <AdminDashboardLayout userRole={user?.rol === "administrador" ? "admin" : "profesor"} />}
        </Stack.Screen>
        
        <Stack.Screen
          name="ProfesorDashboard"
          options={{ headerShown: false }}
        >
          {(props) => <ProfesorDashboardLayout userRole={user?.rol === "profesor" ? "profesor" : "admin"} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
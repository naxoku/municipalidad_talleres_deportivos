import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/navigation";

import LoginScreen from "../screens/LoginScreen";
import AdminDashboardLayout from "./AdminDashboardLayout";
import DashboardProfesor from "../screens/DashboardProfesor";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined}
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* Pantalla de Login */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Dashboard Admin con Drawer Navigation */}
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboardLayout} 
        />
        
        {/* Dashboard Profesor */}
        <Stack.Screen 
          name="DashboardProfesor" 
          component={DashboardProfesor} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
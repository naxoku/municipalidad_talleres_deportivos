import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/navigation";

import LoginScreen from "../screens/LoginScreen";
import DashboardAdmin from "../screens/DashboardAdmin";
import DashboardProfesor from "../screens/DashboardProfesor";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined} initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DashboardAdmin" component={DashboardAdmin} />
        <Stack.Screen name="DashboardProfesor" component={DashboardProfesor} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

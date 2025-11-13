import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DrawerContentComponentProps,
  DrawerNavigationProp,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AdminSidebar from "./AdminSidebar";
import ProfesorSidebar from "./ProfesorSidebar";

type UserRole = "admin" | "profesor";

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userRole: UserRole;
}

export default function CustomDrawerContent({
  state,
  navigation,
  descriptors,
  userRole,
}: CustomDrawerContentProps) {
  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
  };

  const currentRoute = state.routes[state.index];
  const currentScreen = currentRoute.name;

  const handleNavigate = (screenName: string) => {
    navigation.navigate(screenName as never);
    navigation.closeDrawer();
  };

  const renderSidebar = () => {
    if (userRole === "admin") {
      return (
        <AdminSidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      );
    } else {
      return (
        <ProfesorSidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userRole === "admin" ? "Administración" : "Panel del Profesor"}
        </Text>
      </View>
      {renderSidebar()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#004d00",
  },
  header: {
    backgroundColor: "#006400",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#003d00",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e8f5e8",
  },
});
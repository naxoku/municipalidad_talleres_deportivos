import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList, AdminDrawerParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<AppStackParamList, "AdminDashboard">;

interface AdminSidebarProps {
  currentScreen: string;
  onNavigate: (screenName: keyof AdminDrawerParamList) => void;
}

export default function AdminSidebar({ currentScreen, onNavigate }: AdminSidebarProps) {
  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;
  const navigation = useNavigation<NavigationProp>();

  const handleLogout = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={[styles.sidebar, isLargeScreen ? styles.sidebarWeb : styles.sidebarMobile]}>
      <Text style={[styles.sidebarTitle, isLargeScreen && styles.sidebarTitleWeb]}>
        Administración
      </Text>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "ManageUsers" && styles.navItemActive
        ]}
        onPress={() => onNavigate("ManageUsers")}
      >
        <Text style={styles.navItemText}>Gestión de Usuarios</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "CourseList" && styles.navItemActive
        ]}
        onPress={() => onNavigate("CourseList")}
      >
        <Text style={styles.navItemText}>Listado de Cursos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "Reports" && styles.navItemActive
        ]}
        onPress={() => onNavigate("Reports")}
      >
        <Text style={styles.navItemText}>Generar Reportes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "ModifyCourses" && styles.navItemActive
        ]}
        onPress={() => onNavigate("ModifyCourses")}
      >
        <Text style={styles.navItemText}>Modificar Cursos</Text>
      </TouchableOpacity>

      {isLargeScreen && <View style={styles.spacer} />}

      <TouchableOpacity
        style={[styles.logoutButton, isLargeScreen && styles.logoutButtonWeb]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: "#333",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  sidebarWeb: {
    width: 250,
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  sidebarMobile: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 10,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
    width: "100%",
  },
  sidebarTitleWeb: {
    textAlign: "left",
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: "45%",
    alignItems: "center",
  },
  navItemWeb: {
    width: "100%",
    alignItems: "flex-start",
  },
  navItemActive: {
    backgroundColor: "#007F00",
  },
  navItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    width: "45%",
    alignItems: "center",
  },
  logoutButtonWeb: {
    width: "100%",
    marginTop: 0,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { ProfesorDrawerParamList } from "../types/navigation";

interface ProfesorSidebarProps {
  currentScreen: string;
  onNavigate: (screenName: keyof ProfesorDrawerParamList) => void;
  onLogout: () => void;
}

export default function ProfesorSidebar({ currentScreen, onNavigate, onLogout }: ProfesorSidebarProps) {
  const { width } = Dimensions.get("window");
  const isLargeScreen = width > 768;

  return (
    <View style={[styles.sidebar, isLargeScreen ? styles.sidebarWeb : styles.sidebarMobile]}>
      {/* <Text style={[styles.sidebarTitle, isLargeScreen && styles.sidebarTitleWeb]}>
        Panel del Profesor
      </Text> */}

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "ProfesorDrawerDashboard" && styles.navItemActive
        ]}
        onPress={() => onNavigate("ProfesorDrawerDashboard")}
      >
        <Text style={styles.navItemText}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "Asistencia" && styles.navItemActive
        ]}
        onPress={() => onNavigate("Asistencia")}
      >
        <Text style={styles.navItemText}>Asistencia</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "Planificacion" && styles.navItemActive
        ]}
        onPress={() => onNavigate("Planificacion")}
      >
        <Text style={styles.navItemText}>Planificación</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "ListadoClases" && styles.navItemActive
        ]}
        onPress={() => onNavigate("ListadoClases")}
      >
        <Text style={styles.navItemText}>Listado de Clases</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "ListadoAlumnos" && styles.navItemActive
        ]}
        onPress={() => onNavigate("ListadoAlumnos")}
      >
        <Text style={styles.navItemText}>Listado de Alumnos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navItem,
          isLargeScreen && styles.navItemWeb,
          currentScreen === "AsignarIndumentaria" && styles.navItemActive
        ]}
        onPress={() => onNavigate("AsignarIndumentaria")}
      >
        <Text style={styles.navItemText}>Asignar Indumentaria</Text>
      </TouchableOpacity>

      {isLargeScreen && <View style={styles.spacer} />}

      <TouchableOpacity
        style={[styles.logoutButton, isLargeScreen && styles.logoutButtonWeb]}
        onPress={onLogout}
      >
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: "#004d00",
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
    backgroundColor: "#cc0000",
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
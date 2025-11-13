import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ListadoGeneralScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Listado General</Text>
      <Text style={styles.subtitle}>Aquí se puede ver el listado general de todos los cursos, profesores, estudiantes, indumentaria, etc.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
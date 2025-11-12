import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CourseListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Listado de Cursos</Text>
      <Text>Aquí se mostrará el listado general de todos los cursos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
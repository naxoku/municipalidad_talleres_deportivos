import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  getProfesores,
  createProfesor,
  deleteProfesor,
  getEstudiantes,
  createEstudiante,
  deleteEstudiante,
} from "../api/adminApi"; // Importamos las nuevas funciones

// Tipos
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'profesor' | 'estudiante';
}

// Componente de Formulario reutilizable
const UserForm = ({ role, onSubmit }: { role: 'profesor' | 'estudiante', onSubmit: (data: any) => void }) => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleSubmit = () => {
    if (!nombre || !email || !contrasena) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    onSubmit({ nombre, email, contrasena });
    setNombre("");
    setEmail("");
    setContrasena("");
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Crear nuevo {role}</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre Completo"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Crear</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente de Lista reutilizable
const UserList = ({ title, data, onDelete }: { title: string, data: Usuario[], onDelete: (id: number) => void }) => (
  <View style={styles.listContainer}>
    <Text style={styles.listTitle}>{title}</Text>
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemNombre}>{item.nombre}</Text>
            <Text style={styles.itemEmail}>{item.email}</Text>
          </View>
          <TouchableOpacity
            style={[styles.itemButton, styles.deleteButton]}
            onPress={() => onDelete(item.id)}
          >
            <Text style={styles.itemButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No hay {title.toLowerCase()} registrados.</Text>}
    />
  </View>
);

export default function GestionUsuariosScreen() {
  const [profesores, setProfesores] = useState<Usuario[]>([]);
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profData, estData] = await Promise.all([
        getProfesores(),
        getEstudiantes(),
      ]);
      setProfesores(profData);
      setEstudiantes(estData);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", "No se pudieron cargar los datos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateProfesor = async (data: any) => {
    try {
      await createProfesor(data);
      Alert.alert("Éxito", "Profesor creado correctamente");
      fetchData(); // Recargar datos
    } catch (err: any) {
      Alert.alert("Error", "No se pudo crear el profesor: " + err.message);
    }
  };

  const handleDeleteProfesor = async (id: number) => {
    Alert.alert("Confirmar", "¿Está seguro de que desea eliminar a este profesor?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProfesor(id);
            Alert.alert("Éxito", "Profesor eliminado");
            fetchData(); // Recargar datos
          } catch (err: any) {
            Alert.alert("Error", "No se pudo eliminar el profesor: " + err.message);
          }
        },
      },
    ]);
  };

  const handleCreateEstudiante = async (data: any) => {
     try {
      await createEstudiante(data);
      Alert.alert("Éxito", "Estudiante creado correctamente");
      fetchData(); // Recargar datos
    } catch (err: any) {
      Alert.alert("Error", "No se pudo crear el estudiante: " + err.message);
    }
  };

  const handleDeleteEstudiante = async (id: number) => {
     Alert.alert("Confirmar", "¿Está seguro de que desea eliminar a este estudiante?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEstudiante(id);
            Alert.alert("Éxito", "Estudiante eliminado");
            fetchData(); // Recargar datos
          } catch (err: any) {
            Alert.alert("Error", "No se pudo eliminar el estudiante: " + err.message);
          }
        },
      },
    ]);
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007F00" />
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  if (error) {
     return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchData}>
            <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestión de Usuarios</Text>
      
      {/* Sección Profesores */}
      <UserForm role="profesor" onSubmit={handleCreateProfesor} />
      <UserList title="Profesores" data={profesores} onDelete={handleDeleteProfesor} />

      {/* Sección Estudiantes */}
      <UserForm role="estudiante" onSubmit={handleCreateEstudiante} />
      <UserList title="Estudiantes" data={estudiantes} onDelete={handleDeleteEstudiante} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007F00",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    marginBottom: 30,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 5,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemEmail: {
    fontSize: 14,
    color: "#666",
  },
  itemButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: "#cc0000",
  },
  itemButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 15,
  }
});
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
  getIndumentaria,
  createIndumentaria,
  deleteIndumentaria,
  updateIndumentaria, // Asegúrate de importar esto
} from "../api/adminApi"; // Importamos las nuevas funciones

// Tipos
interface Indumentaria {
  id: number;
  nombre: string;
  talla: string;
  stock: number;
}

// Componente de Formulario
const IndumentariaForm = ({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData?: Indumentaria | null }) => {
  const [nombre, setNombre] = useState("");
  const [talla, setTalla] = useState("");
  const [stock, setStock] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre);
      setTalla(initialData.talla);
      setStock(initialData.stock.toString());
      setIsEditing(true);
    } else {
      setNombre("");
      setTalla("");
      setStock("");
      setIsEditing(false);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!nombre || !talla || !stock) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    onSubmit({ nombre, talla, stock: parseInt(stock, 10) });
    if (!isEditing) {
        setNombre("");
        setTalla("");
        setStock("");
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>{isEditing ? "Editar" : "Crear"} Artículo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del artículo"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Talla (ej: M, L, 38, Única)"
        value={talla}
        onChangeText={setTalla}
      />
      <TextInput
        style={styles.input}
        placeholder="Stock"
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isEditing ? "Actualizar" : "Crear"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function GestionIndumentariaScreen() {
  const [indumentaria, setIndumentaria] = useState<Indumentaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Indumentaria | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIndumentaria();
      setIndumentaria(data);
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

  const handleSubmit = async (data: Omit<Indumentaria, 'id'>) => {
    try {
      if (selectedItem) {
        // Actualizar
        await updateIndumentaria(selectedItem.id, data);
        Alert.alert("Éxito", "Artículo actualizado");
        setSelectedItem(null);
      } else {
        // Crear
        await createIndumentaria(data);
        Alert.alert("Éxito", "Artículo creado");
      }
      fetchData(); // Recargar datos
    } catch (err: any) {
      Alert.alert("Error", "No se pudo guardar el artículo: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Confirmar", "¿Está seguro de que desea eliminar este artículo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteIndumentaria(id);
            Alert.alert("Éxito", "Artículo eliminado");
            fetchData(); // Recargar datos
          } catch (err: any) {
            Alert.alert("Error", "No se pudo eliminar el artículo: " + err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007F00" />
        <Text>Cargando indumentaria...</Text>
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
      <Text style={styles.title}>Gestión de Indumentaria</Text>
      
      <IndumentariaForm 
        onSubmit={handleSubmit}
        initialData={selectedItem} 
      />
      {selectedItem && (
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setSelectedItem(null)}>
            <Text style={styles.buttonText}>Cancelar Edición</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.listTitle}>Inventario</Text>
      <FlatList
        data={indumentaria}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemNombre}>{item.nombre}</Text>
              <Text style={styles.itemEmail}>Talla: {item.talla} | Stock: {item.stock}</Text>
            </View>
            <TouchableOpacity
              style={[styles.itemButton, styles.editButton]}
              onPress={() => setSelectedItem(item)}
            >
              <Text style={styles.itemButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.itemButton, styles.deleteButton]}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.itemButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay indumentaria registrada.</Text>}
      />
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
    marginBottom: 10,
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
  cancelButton: {
    backgroundColor: "#777",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 15,
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
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: "#0066cc",
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
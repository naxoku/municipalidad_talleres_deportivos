import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { estudiantesApi } from '../api/estudiantes';
import { Estudiante } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Table, TableColumn, TableAction } from '../components/Table';
import { useResponsive } from '../hooks/useResponsive';

const EstudiantesScreen = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEstudiante, setCurrentEstudiante] = useState<Estudiante | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    contacto: '',
  });

  const { isWeb, isDesktop } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoading(true);
    try {
      const data = await estudiantesApi.listar();
      setEstudiantes(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentEstudiante(null);
    setFormData({ nombre: '', edad: '', contacto: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (estudiante: Estudiante) => {
    setIsEditing(true);
    setCurrentEstudiante(estudiante);
    setFormData({
      nombre: estudiante.nombre,
      edad: estudiante.edad?.toString() || '',
      contacto: estudiante.contacto || '',
    });
    setModalVisible(true);
  };

  const guardarEstudiante = async () => {
    if (!formData.nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: formData.nombre,
        edad: formData.edad ? parseInt(formData.edad) : undefined,
        contacto: formData.contacto || undefined,
      };

      if (isEditing && currentEstudiante) {
        await estudiantesApi.actualizar({ id: currentEstudiante.id, ...data } as Estudiante);
        Alert.alert('Éxito', 'Estudiante actualizado correctamente');
      } else {
        await estudiantesApi.crear(data);
        Alert.alert('Éxito', 'Estudiante creado correctamente');
      }
      setModalVisible(false);
      cargarEstudiantes();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarEstudiante = (estudiante: Estudiante) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${estudiante.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await estudiantesApi.eliminar(estudiante.id);
              Alert.alert('Éxito', 'Estudiante eliminado correctamente');
              cargarEstudiantes();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderEstudiante = ({ item }: { item: Estudiante }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        {item.edad && <Text style={styles.cardDetail}>Edad: {item.edad} años</Text>}
        {item.contacto && <Text style={styles.cardDetail}>Contacto: {item.contacto}</Text>}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => abrirModalEditar(item)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => eliminarEstudiante(item)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const tableColumns: TableColumn<Estudiante>[] = [
    { key: 'nombre', header: 'Nombre', render: (item) => item.nombre },
    { key: 'edad', header: 'Edad', render: (item) => item.edad ? `${item.edad} años` : '-', width: 120 },
    { key: 'contacto', header: 'Contacto', render: (item) => item.contacto || '-' },
  ];

  const tableActions: TableAction<Estudiante>[] = [
    { label: 'Editar', onPress: abrirModalEditar, color: '#007bff' },
    { label: 'Eliminar', onPress: eliminarEstudiante, color: '#dc3545' },
  ];

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estudiantes</Text>
          <TouchableOpacity style={styles.addButton} onPress={abrirModalCrear}>
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

        {!loading && estudiantes.length === 0 && (
          <EmptyState message="No hay estudiantes registrados" />
        )}

        {!loading && estudiantes.length > 0 && shouldShowTable && (
          <View style={styles.tableContainer}>
            <Table
              columns={tableColumns}
              data={estudiantes}
              keyExtractor={(item) => item.id.toString()}
              actions={tableActions}
            />
          </View>
        )}

        {!loading && estudiantes.length > 0 && !shouldShowTable && (
          <FlatList
            data={estudiantes}
            renderItem={renderEstudiante}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, isWeb && styles.webModalOverlay]}>
          <SafeAreaView style={[styles.modalSafeArea, isWeb && styles.webModalSafeArea]} edges={isWeb ? [] : ['bottom']}>
            <View style={[styles.modalContent, isWeb && styles.webModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                </Text>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Input
                  label="Nombre"
                  required
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  placeholder="Nombre completo"
                />

                <Input
                  label="Edad"
                  value={formData.edad}
                  onChangeText={(text) => setFormData({ ...formData, edad: text.replace(/[^0-9]/g, '') })}
                  placeholder="Edad en años"
                  keyboardType="numeric"
                />

                <Input
                  label="Contacto"
                  value={formData.contacto}
                  onChangeText={(text) => setFormData({ ...formData, contacto: text })}
                  placeholder="Teléfono o email"
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                />
                <Button
                  title={isEditing ? 'Actualizar' : 'Crear'}
                  variant="success"
                  onPress={guardarEstudiante}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentWrapper: {
    flex: 1,
  },
  webContentWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardContent: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  webModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSafeArea: {
    maxHeight: '90%',
  },
  webModalSafeArea: {
    maxHeight: undefined,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
  },
  webModalContent: {
    borderRadius: 12,
    width: 600,
    maxWidth: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: Platform.OS === 'web' ? 400 : undefined,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
  },
});

export default EstudiantesScreen;

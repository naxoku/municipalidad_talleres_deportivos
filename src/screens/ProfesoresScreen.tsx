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
import { profesoresApi } from '../api/profesores';
import { Profesor } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Table, TableColumn, TableAction } from '../components/Table';
import { useResponsive } from '../hooks/useResponsive';

const ProfesoresScreen = () => {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfesor, setCurrentProfesor] = useState<Profesor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    contrasena: '',
  });

  const { isWeb, isDesktop } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;

  useEffect(() => {
    cargarProfesores();
  }, []);

  const cargarProfesores = async () => {
    setLoading(true);
    try {
      const data = await profesoresApi.listar();
      setProfesores(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentProfesor(null);
    setFormData({ nombre: '', especialidad: '', email: '', contrasena: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (profesor: Profesor) => {
    setIsEditing(true);
    setCurrentProfesor(profesor);
    setFormData({
      nombre: profesor.nombre,
      especialidad: profesor.especialidad || '',
      email: profesor.email || '',
      contrasena: '',
    });
    setModalVisible(true);
  };

  const guardarProfesor = async () => {
    if (!formData.nombre || !formData.especialidad || !formData.email) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!isEditing && !formData.contrasena) {
      Alert.alert('Error', 'La contraseña es obligatoria para crear un profesor');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && currentProfesor) {
        await profesoresApi.actualizar({
          id: currentProfesor.id,
          nombre: formData.nombre,
          especialidad: formData.especialidad,
          email: formData.email,
        });
        Alert.alert('Éxito', 'Profesor actualizado correctamente');
      } else {
        await profesoresApi.crear(formData as any);
        Alert.alert('Éxito', 'Profesor creado correctamente');
      }
      setModalVisible(false);
      cargarProfesores();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarProfesor = (profesor: Profesor) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${profesor.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await profesoresApi.eliminar(profesor.id);
              Alert.alert('Éxito', 'Profesor eliminado correctamente');
              cargarProfesores();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderProfesor = ({ item }: { item: Profesor }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <Text style={styles.cardDetail}>Especialidad: {item.especialidad}</Text>
        <Text style={styles.cardDetail}>Email: {item.email}</Text>
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
          onPress={() => eliminarProfesor(item)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Table configuration for web
  const tableColumns: TableColumn<Profesor>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (item) => item.nombre,
    },
    {
      key: 'especialidad',
      header: 'Especialidad',
      render: (item) => item.especialidad || '-',
    },
    {
      key: 'email',
      header: 'Email',
      render: (item) => item.email || '-',
    },
  ];

  const tableActions: TableAction<Profesor>[] = [
    {
      label: 'Editar',
      onPress: abrirModalEditar,
      color: '#007bff',
    },
    {
      label: 'Eliminar',
      onPress: eliminarProfesor,
      color: '#dc3545',
    },
  ];

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profesores</Text>
          <TouchableOpacity style={styles.addButton} onPress={abrirModalCrear}>
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

        {!loading && profesores.length === 0 && (
          <EmptyState message="No hay profesores registrados" />
        )}

        {!loading && profesores.length > 0 && shouldShowTable && (
          <View style={styles.tableContainer}>
            <Table
              columns={tableColumns}
              data={profesores}
              keyExtractor={(item) => item.id.toString()}
              actions={tableActions}
            />
          </View>
        )}

        {!loading && profesores.length > 0 && !shouldShowTable && (
          <FlatList
            data={profesores}
            renderItem={renderProfesor}
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
                  {isEditing ? 'Editar Profesor' : 'Nuevo Profesor'}
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
                  label="Especialidad"
                  required
                  value={formData.especialidad}
                  onChangeText={(text) => setFormData({ ...formData, especialidad: text })}
                  placeholder="Ej: Educación Física, Danza"
                />

                <Input
                  label="Email"
                  required
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {!isEditing && (
                  <Input
                    label="Contraseña"
                    required
                    value={formData.contrasena}
                    onChangeText={(text) => setFormData({ ...formData, contrasena: text })}
                    placeholder="Contraseña"
                    secureTextEntry
                  />
                )}
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
                  onPress={guardarProfesor}
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
    borderLeftColor: '#0066cc',
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

export default ProfesoresScreen;

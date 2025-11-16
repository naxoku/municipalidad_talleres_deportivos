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
import { inscripcionesApi } from '../api/inscripciones';
import { estudiantesApi } from '../api/estudiantes';
import { talleresApi } from '../api/talleres';
import { Inscripcion, Estudiante, Taller } from '../types';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { shadows } from '../theme/colors';

const InscripcionesScreen = () => {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    estudiante_id: '',
    taller_id: '',
  });

  useEffect(() => {
    cargarInscripciones();
    cargarEstudiantes();
    cargarTalleres();
  }, []);

  const cargarInscripciones = async () => {
    setLoading(true);
    try {
      const data = await inscripcionesApi.listar();
      setInscripciones(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstudiantes = async () => {
    try {
      const data = await estudiantesApi.listar();
      setEstudiantes(data);
    } catch (error: any) {
      console.error('Error cargando estudiantes:', error);
    }
  };

  const cargarTalleres = async () => {
    try {
      const data = await talleresApi.listar();
      setTalleres(data);
    } catch (error: any) {
      console.error('Error cargando talleres:', error);
    }
  };

  const abrirModal = () => {
    setFormData({ estudiante_id: '', taller_id: '' });
    setModalVisible(true);
  };

  const crearInscripcion = async () => {
    if (!formData.estudiante_id || !formData.taller_id) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await inscripcionesApi.crear({
        estudiante_id: parseInt(formData.estudiante_id),
        taller_id: parseInt(formData.taller_id),
      });
      Alert.alert('Éxito', 'Inscripción creada correctamente');
      setModalVisible(false);
      cargarInscripciones();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarInscripcion = (inscripcion: Inscripcion) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar esta inscripción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await inscripcionesApi.eliminar(inscripcion.id);
              Alert.alert('Éxito', 'Inscripción eliminada correctamente');
              cargarInscripciones();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderInscripcion = ({ item }: { item: Inscripcion }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {item.estudiante_nombre || `Estudiante ID: ${item.estudiante_id}`}
        </Text>
        <Text style={styles.cardDetail}>
          Taller: {item.taller_nombre || `ID: ${item.taller_id}`}
        </Text>
        {item.fecha_inscripcion && (
          <Text style={styles.cardDetail}>Fecha: {item.fecha_inscripcion}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => eliminarInscripcion(item)}
      >
        <Text style={styles.actionButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inscripciones</Text>
        <TouchableOpacity style={styles.addButton} onPress={abrirModal}>
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

      {!loading && inscripciones.length === 0 && (
        <EmptyState message="No hay inscripciones registradas" />
      )}

      {!loading && inscripciones.length > 0 && (
        <FlatList
          data={inscripciones}
          renderItem={renderInscripcion}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea} edges={['bottom']}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Inscripción</Text>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Estudiante *</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                      {estudiantes.map((estudiante) => (
                        <TouchableOpacity
                          key={estudiante.id}
                          style={[
                            styles.pickerItem,
                            formData.estudiante_id === estudiante.id.toString() && styles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, estudiante_id: estudiante.id.toString() })}
                        >
                          <Text style={styles.pickerItemText}>{estudiante.nombre}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Taller *</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                      {talleres.map((taller) => (
                        <TouchableOpacity
                          key={taller.id}
                          style={[
                            styles.pickerItem,
                            formData.taller_id === taller.id.toString() && styles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, taller_id: taller.id.toString() })}
                        >
                          <Text style={styles.pickerItemText}>{taller.nombre}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Crear"
                  variant="success"
                  onPress={crearInscripcion}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    ...(shadows.md as any),
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
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
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
  modalSafeArea: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 200,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#333',
  },
});

export default InscripcionesScreen;

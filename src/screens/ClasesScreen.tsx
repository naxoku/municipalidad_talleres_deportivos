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
import { clasesApi } from '../api/clases';
import { talleresApi } from '../api/talleres';
import { Clase, Taller } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

const ClasesScreen = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    taller_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
  });

  useEffect(() => {
    cargarClases();
    cargarTalleres();
  }, []);

  const cargarClases = async () => {
    setLoading(true);
    try {
      const data = await clasesApi.listar();
      setClases(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
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
    const today = new Date().toISOString().split('T')[0];
    setFormData({ taller_id: '', fecha: today, hora_inicio: '', hora_fin: '' });
    setModalVisible(true);
  };

  const crearClase = async () => {
    if (!formData.taller_id || !formData.fecha || !formData.hora_inicio || !formData.hora_fin) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await clasesApi.crear({
        taller_id: parseInt(formData.taller_id),
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
      });
      Alert.alert('Éxito', 'Clase creada correctamente');
      setModalVisible(false);
      cargarClases();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarClase = (clase: Clase) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar esta clase?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clasesApi.eliminar(clase.id);
              Alert.alert('Éxito', 'Clase eliminada correctamente');
              cargarClases();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderClase = ({ item }: { item: Clase }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.taller_nombre || `Taller ID: ${item.taller_id}`}</Text>
        <Text style={styles.cardDetail}>Fecha: {item.fecha}</Text>
        <Text style={styles.cardDetail}>Horario: {item.hora_inicio} - {item.hora_fin}</Text>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => eliminarClase(item)}
      >
        <Text style={styles.actionButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clases</Text>
        <TouchableOpacity style={styles.addButton} onPress={abrirModal}>
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

      {!loading && clases.length === 0 && (
        <EmptyState message="No hay clases registradas" />
      )}

      {!loading && clases.length > 0 && (
        <FlatList
          data={clases}
          renderItem={renderClase}
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
                <Text style={styles.modalTitle}>Nueva Clase</Text>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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

                <Input
                  label="Fecha"
                  required
                  value={formData.fecha}
                  onChangeText={(text) => setFormData({ ...formData, fecha: text })}
                  placeholder="YYYY-MM-DD (ej: 2025-11-14)"
                />

                <Input
                  label="Hora inicio"
                  required
                  value={formData.hora_inicio}
                  onChangeText={(text) => setFormData({ ...formData, hora_inicio: text })}
                  placeholder="HH:MM (ej: 14:00)"
                />

                <Input
                  label="Hora fin"
                  required
                  value={formData.hora_fin}
                  onChangeText={(text) => setFormData({ ...formData, hora_fin: text })}
                  placeholder="HH:MM (ej: 16:00)"
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
                  title="Crear"
                  variant="success"
                  onPress={crearClase}
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
    borderLeftColor: '#6f42c1',
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
    maxHeight: 150,
  },
  pickerScroll: {
    maxHeight: 150,
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

export default ClasesScreen;

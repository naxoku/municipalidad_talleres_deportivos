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
import { horariosApi } from '../api/horarios';
import { talleresApi } from '../api/talleres';
import { Horario, Taller } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Table, TableColumn, TableAction } from '../components/Table';
import { useResponsive } from '../hooks/useResponsive';

const DIAS_SEMANA = [
  { label: 'Lunes', value: 'Lunes' },
  { label: 'Martes', value: 'Martes' },
  { label: 'Miércoles', value: 'Miércoles' },
  { label: 'Jueves', value: 'Jueves' },
  { label: 'Viernes', value: 'Viernes' },
  { label: 'Sábado', value: 'Sábado' },
  { label: 'Domingo', value: 'Domingo' },
];

const HorariosScreen = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    taller_id: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
  });

  const { isWeb, isDesktop } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;

  useEffect(() => {
    cargarHorarios();
    cargarTalleres();
  }, []);

  const cargarHorarios = async () => {
    setLoading(true);
    try {
      const data = await horariosApi.listar();
      setHorarios(data);
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
    setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
    setModalVisible(true);
  };

  const crearHorario = async () => {
    if (!formData.taller_id || !formData.dia_semana || !formData.hora_inicio || !formData.hora_fin) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await horariosApi.crear({
        taller_id: parseInt(formData.taller_id),
        dia_semana: formData.dia_semana,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
      });
      Alert.alert('Éxito', 'Horario creado correctamente');
      setModalVisible(false);
      cargarHorarios();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarHorario = (horario: Horario) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await horariosApi.eliminar(horario.id);
              Alert.alert('Éxito', 'Horario eliminado correctamente');
              cargarHorarios();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderHorario = ({ item }: { item: Horario }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.taller_nombre || `Taller ID: ${item.taller_id}`}</Text>
        <Text style={styles.cardDetail}>Día: {item.dia_semana}</Text>
        <Text style={styles.cardDetail}>Horario: {item.hora_inicio} - {item.hora_fin}</Text>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => eliminarHorario(item)}
      >
        <Text style={styles.actionButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  const tableColumns: TableColumn<Horario>[] = [
    { key: 'taller', header: 'Taller', render: (item) => item.taller_nombre || `ID: ${item.taller_id}` },
    { key: 'dia', header: 'Día', render: (item) => item.dia_semana, width: 120 },
    { key: 'hora_inicio', header: 'Hora Inicio', render: (item) => item.hora_inicio, width: 100 },
    { key: 'hora_fin', header: 'Hora Fin', render: (item) => item.hora_fin, width: 100 },
  ];

  const tableActions: TableAction<Horario>[] = [
    { label: 'Eliminar', onPress: eliminarHorario, color: '#dc3545' },
  ];

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Horarios</Text>
          <TouchableOpacity style={styles.addButton} onPress={abrirModal}>
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

        {!loading && horarios.length === 0 && (
          <EmptyState message="No hay horarios registrados" />
        )}

        {!loading && horarios.length > 0 && shouldShowTable && (
          <View style={styles.tableContainer}>
            <Table
              columns={tableColumns}
              data={horarios}
              keyExtractor={(item) => item.id.toString()}
              actions={tableActions}
            />
          </View>
        )}

        {!loading && horarios.length > 0 && !shouldShowTable && (
          <FlatList
            data={horarios}
            renderItem={renderHorario}
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
                <Text style={styles.modalTitle}>Nuevo Horario</Text>
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

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Día de la semana *</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                      {DIAS_SEMANA.map((dia) => (
                        <TouchableOpacity
                          key={dia.value}
                          style={[
                            styles.pickerItem,
                            formData.dia_semana === dia.value && styles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, dia_semana: dia.value })}
                        >
                          <Text style={styles.pickerItemText}>{dia.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

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
                  onPress={crearHorario}
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
    borderLeftColor: '#17a2b8',
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

export default HorariosScreen;

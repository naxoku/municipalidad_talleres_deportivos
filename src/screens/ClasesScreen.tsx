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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';
import HeaderWithSearch from '../components/HeaderWithSearch';

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

  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const [searchTerm, setSearchTerm] = useState('');

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
    <View style={sharedStyles.card}>
      <View style={sharedStyles.cardContent}>
        <Text style={sharedStyles.cardTitle}>{item.taller_nombre || `Taller ID: ${item.taller_id}`}</Text>
        <Text style={sharedStyles.cardDetail}>Fecha: {item.fecha}</Text>
        <Text style={sharedStyles.cardDetail}>Horario: {item.hora_inicio} - {item.hora_fin}</Text>
      </View>
      {isAdmin && (
        <TouchableOpacity
          style={[sharedStyles.actionButton, sharedStyles.deleteButton]}
          onPress={() => eliminarClase(item)}
        >
          <Text style={sharedStyles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.container} edges={['bottom']}>
      <HeaderWithSearch title={isAdmin ? 'Clases' : 'Mis Clases'} searchTerm={searchTerm} onSearch={setSearchTerm} onAdd={isAdmin ? abrirModal : undefined} />

      {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

      {!loading && clases.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <EmptyState message="No hay clases registradas" icon={<Ionicons name="calendar" size={48} color={colors.primary || '#888'} />} />
        </View>
      )}

      {!loading && clases.length > 0 && (
        <FlatList
          data={clases}
          renderItem={renderClase}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={sharedStyles.listContent}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={sharedStyles.modalOverlay}>
          <SafeAreaView style={sharedStyles.modalSafeArea} edges={['bottom']}>
            <View style={sharedStyles.modalContent}>
              <View style={sharedStyles.modalHeader}>
                <Text style={sharedStyles.modalTitle}>Nueva Clase</Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={sharedStyles.inputContainer}>
                  <Text style={sharedStyles.label}>Taller *</Text>
                  <View style={sharedStyles.pickerWrapper}>
                    <ScrollView style={sharedStyles.pickerScroll} nestedScrollEnabled>
                      {talleres.map((taller) => (
                        <TouchableOpacity
                          key={taller.id}
                          style={[
                            sharedStyles.pickerItem,
                            formData.taller_id === taller.id.toString() && sharedStyles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, taller_id: taller.id.toString() })}
                        >
                          <Text style={sharedStyles.pickerItemText}>{taller.nombre}</Text>
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

              <View style={sharedStyles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={sharedStyles.modalButton}
                />
                <Button
                  title="Crear"
                  variant="success"
                  onPress={crearClase}
                  loading={loading}
                  style={sharedStyles.modalButton}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({});

export default ClasesScreen;

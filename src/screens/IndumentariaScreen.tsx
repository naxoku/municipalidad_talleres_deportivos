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
import { indumentariaApi } from '../api/indumentaria';
import { talleresApi } from '../api/talleres';
import { Indumentaria, IndumentariaTaller, Taller } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';

const IndumentariaScreen = () => {
  const [indumentarias, setIndumentarias] = useState<Indumentaria[]>([]);
  const [asignaciones, setAsignaciones] = useState<IndumentariaTaller[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAsignacion, setModalAsignacion] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIndumentaria, setCurrentIndumentaria] = useState<Indumentaria | null>(null);
  const [tabActiva, setTabActiva] = useState<'indumentaria' | 'asignaciones'>('indumentaria');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: '',
  });
  const [formAsignacion, setFormAsignacion] = useState({
    indumentaria_id: '',
    taller_id: '',
  });

  useEffect(() => {
    cargarIndumentarias();
    cargarAsignaciones();
    cargarTalleres();
  }, []);

  const cargarIndumentarias = async () => {
    setLoading(true);
    try {
      const data = await indumentariaApi.listar();
      setIndumentarias(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignaciones = async () => {
    try {
      const data = await indumentariaApi.listarAsignaciones();
      setAsignaciones(data);
    } catch (error: any) {
      console.error('Error cargando asignaciones:', error);
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

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentIndumentaria(null);
    setFormData({ nombre: '', descripcion: '', cantidad: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (indumentaria: Indumentaria) => {
    setIsEditing(true);
    setCurrentIndumentaria(indumentaria);
    setFormData({
      nombre: indumentaria.nombre,
      descripcion: indumentaria.descripcion || '',
      cantidad: indumentaria.cantidad.toString(),
    });
    setModalVisible(true);
  };

  const guardarIndumentaria = async () => {
    if (!formData.nombre || !formData.cantidad) {
      Alert.alert('Error', 'El nombre y la cantidad son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        cantidad: parseInt(formData.cantidad),
      };

      if (isEditing && currentIndumentaria) {
        await indumentariaApi.actualizar({ id: currentIndumentaria.id, ...data } as Indumentaria);
        Alert.alert('Éxito', 'Indumentaria actualizada correctamente');
      } else {
        await indumentariaApi.crear(data);
        Alert.alert('Éxito', 'Indumentaria creada correctamente');
      }
      setModalVisible(false);
      cargarIndumentarias();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarIndumentaria = (indumentaria: Indumentaria) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar "${indumentaria.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await indumentariaApi.eliminar(indumentaria.id);
              Alert.alert('Éxito', 'Indumentaria eliminada correctamente');
              cargarIndumentarias();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const abrirModalAsignacion = () => {
    setFormAsignacion({ indumentaria_id: '', taller_id: '' });
    setModalAsignacion(true);
  };

  const asignarIndumentaria = async () => {
    if (!formAsignacion.indumentaria_id || !formAsignacion.taller_id) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await indumentariaApi.asignarATaller(
        parseInt(formAsignacion.indumentaria_id),
        parseInt(formAsignacion.taller_id)
      );
      Alert.alert('Éxito', 'Indumentaria asignada correctamente');
      setModalAsignacion(false);
      cargarAsignaciones();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const desasignarIndumentaria = (asignacion: IndumentariaTaller) => {
    Alert.alert(
      'Confirmar desasignación',
      '¿Estás seguro de desasignar esta indumentaria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desasignar',
          style: 'destructive',
          onPress: async () => {
            try {
              await indumentariaApi.desasignar(asignacion.id);
              Alert.alert('Éxito', 'Indumentaria desasignada correctamente');
              cargarAsignaciones();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderIndumentaria = ({ item }: { item: Indumentaria }) => (
    <View style={[sharedStyles.card, { borderLeftColor: colors.accent.purple }]}>
      <View style={sharedStyles.cardContent}>
        <Text style={sharedStyles.cardTitle}>{item.nombre}</Text>
        {item.descripcion && <Text style={sharedStyles.cardDetail}>Descripción: {item.descripcion}</Text>}
        <Text style={sharedStyles.cardDetail}>Cantidad: {item.cantidad}</Text>
      </View>
      <View style={sharedStyles.cardActions}>
        <TouchableOpacity
          style={[sharedStyles.actionButton, sharedStyles.editButton]}
          onPress={() => abrirModalEditar(item)}
        >
          <Text style={sharedStyles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sharedStyles.actionButton, sharedStyles.deleteButton]}
          onPress={() => eliminarIndumentaria(item)}
        >
          <Text style={sharedStyles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAsignacion = ({ item }: { item: IndumentariaTaller }) => (
    <View style={[sharedStyles.card, { borderLeftColor: colors.accent.orange }]}>
      <View style={sharedStyles.cardContent}>
        <Text style={sharedStyles.cardTitle}>
          {item.indumentaria_nombre || `Indumentaria ID: ${item.indumentaria_id}`}
        </Text>
        <Text style={sharedStyles.cardDetail}>
          Taller: {item.taller_nombre || `ID: ${item.taller_id}`}
        </Text>
      </View>
      <TouchableOpacity
        style={[sharedStyles.actionButton, sharedStyles.deleteButton]}
        onPress={() => desasignarIndumentaria(item)}
      >
        <Text style={sharedStyles.actionButtonText}>Desasignar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.container} edges={['bottom']}>
      <View style={sharedStyles.header}>
        <Text style={sharedStyles.headerTitle}>Indumentaria</Text>
        <TouchableOpacity
          style={sharedStyles.addButton}
          onPress={tabActiva === 'indumentaria' ? abrirModalCrear : abrirModalAsignacion}
        >
          <Text style={sharedStyles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'indumentaria' && styles.tabActive]}
          onPress={() => setTabActiva('indumentaria')}
        >
          <Text style={[styles.tabText, tabActiva === 'indumentaria' && styles.tabTextActive]}>
            Indumentaria
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'asignaciones' && styles.tabActive]}
          onPress={() => setTabActiva('asignaciones')}
        >
          <Text style={[styles.tabText, tabActiva === 'asignaciones' && styles.tabTextActive]}>
            Asignaciones
          </Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

      {!loading && tabActiva === 'indumentaria' && indumentarias.length === 0 && (
        <EmptyState message="No hay indumentaria registrada" />
      )}

      {!loading && tabActiva === 'asignaciones' && asignaciones.length === 0 && (
        <EmptyState message="No hay asignaciones registradas" />
      )}

      {!loading && tabActiva === 'indumentaria' && indumentarias.length > 0 && (
        <FlatList
          data={indumentarias}
          renderItem={renderIndumentaria}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={sharedStyles.listContent}
        />
      )}

      {!loading && tabActiva === 'asignaciones' && asignaciones.length > 0 && (
        <FlatList
          data={asignaciones}
          renderItem={renderAsignacion}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={sharedStyles.listContent}
        />
      )}

      {/* Modal Indumentaria */}
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
                <Text style={sharedStyles.modalTitle}>
                  {isEditing ? 'Editar Indumentaria' : 'Nueva Indumentaria'}
                </Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Input
                  label="Nombre"
                  required
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  placeholder="Nombre del artículo"
                />

                <Input
                  label="Descripción"
                  value={formData.descripcion}
                  onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                  placeholder="Descripción del artículo"
                  multiline
                  numberOfLines={2}
                />

                <Input
                  label="Cantidad"
                  required
                  value={formData.cantidad}
                  onChangeText={(text) => setFormData({ ...formData, cantidad: text.replace(/[^0-9]/g, '') })}
                  placeholder="Cantidad disponible"
                  keyboardType="numeric"
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
                  title={isEditing ? 'Actualizar' : 'Crear'}
                  variant="success"
                  onPress={guardarIndumentaria}
                  loading={loading}
                  style={sharedStyles.modalButton}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Modal Asignación */}
      <Modal
        visible={modalAsignacion}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAsignacion(false)}
      >
        <View style={sharedStyles.modalOverlay}>
          <SafeAreaView style={sharedStyles.modalSafeArea} edges={['bottom']}>
            <View style={sharedStyles.modalContent}>
              <View style={sharedStyles.modalHeader}>
                <Text style={sharedStyles.modalTitle}>Asignar Indumentaria</Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={sharedStyles.inputContainer}>
                  <Text style={sharedStyles.label}>Indumentaria *</Text>
                  <View style={sharedStyles.pickerWrapper}>
                    <ScrollView style={sharedStyles.pickerScroll} nestedScrollEnabled>
                      {indumentarias.map((indumentaria) => (
                        <TouchableOpacity
                          key={indumentaria.id}
                          style={[
                            sharedStyles.pickerItem,
                            formAsignacion.indumentaria_id === indumentaria.id.toString() && sharedStyles.pickerItemSelected,
                          ]}
                          onPress={() =>
                            setFormAsignacion({ ...formAsignacion, indumentaria_id: indumentaria.id.toString() })
                          }
                        >
                          <Text style={sharedStyles.pickerItemText}>
                            {indumentaria.nombre} (Cantidad: {indumentaria.cantidad})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={sharedStyles.inputContainer}>
                  <Text style={sharedStyles.label}>Taller *</Text>
                  <View style={sharedStyles.pickerWrapper}>
                    <ScrollView style={sharedStyles.pickerScroll} nestedScrollEnabled>
                      {talleres.map((taller) => (
                        <TouchableOpacity
                          key={taller.id}
                          style={[
                            sharedStyles.pickerItem,
                            formAsignacion.taller_id === taller.id.toString() && sharedStyles.pickerItemSelected,
                          ]}
                          onPress={() => setFormAsignacion({ ...formAsignacion, taller_id: taller.id.toString() })}
                        >
                          <Text style={sharedStyles.pickerItemText}>{taller.nombre}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>

              <View style={sharedStyles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalAsignacion(false)}
                  style={sharedStyles.modalButton}
                />
                <Button
                  title="Asignar"
                  variant="success"
                  onPress={asignarIndumentaria}
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

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});

export default IndumentariaScreen;

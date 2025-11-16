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
import { talleresApi } from '../api/talleres';
import { horariosApi } from '../api/horarios';
import { profesoresApi } from '../api/profesores';
import { Taller, Profesor, Horario } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';
import { formatTimeHHMM } from '../utils/time';
import { Select } from '../components/Select';

const spacing = {
  xl: 20,
  sm: 8,
};

const typography = {
  sizes: {
    xs: 12,
  },
};

const TalleresScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaller, setCurrentTaller] = useState<Taller | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    profesorIds: [] as number[],
  });
  const [horarioModalVisible, setHorarioModalVisible] = useState(false);
  const [horarioModalContent, setHorarioModalContent] = useState('');
  const [horarioModalTitle, setHorarioModalTitle] = useState('');

  const { isWeb, isDesktop } = useResponsive();
  const { userRole } = useAuth();
  const shouldShowTable = isWeb && isDesktop;
  const isAdmin = userRole === 'administrador';

  useEffect(() => {
    cargarTalleres();
    cargarProfesores();
  }, []);

  const cargarTalleres = async () => {
    setLoading(true);
    try {
      // Fetch talleres and horarios in parallel so we can compute schedule per taller
      const [talleresData, horariosData] = await Promise.all([talleresApi.listar(), horariosApi.listar()]);

      // Build map tallerId -> horarios array
      const horarioMap: Record<number, Horario[]> = {};
      horariosData.forEach((h) => {
        if (!h.taller_id) return;
        const tid = Number(h.taller_id);
        if (!horarioMap[tid]) horarioMap[tid] = [];
        horarioMap[tid].push(h);
      });

      // For each taller, attach horarios (as readable strings) and keep ubicacion/profesores
      const merged = talleresData.map((t) => {
        const hs = horarioMap[t.id] || [];
        // create readable schedule: e.g. 'Lunes 18:00-20:00, Mié 16:00-17:00'
        const horarioStr = hs.length
          ? hs.map(h => `${h.dia_semana} ${formatTimeHHMM(h.hora_inicio)}-${formatTimeHHMM(h.hora_fin)}`).join(', ')
          : '';
        return {
          ...t,
          horario: horarioStr,
        };
      });

      setTalleres(merged as any);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarProfesores = async () => {
    try {
      const data = await profesoresApi.listar();
      setProfesores(data);
    } catch (error: any) {
      console.error('Error cargando profesores:', error);
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentTaller(null);
    setFormData({ nombre: '', descripcion: '', profesorIds: [] });
    setModalVisible(true);
  };

  const abrirModalEditar = (taller: Taller) => {
    setIsEditing(true);
    setCurrentTaller(taller);
    setFormData({
      nombre: taller.nombre,
      descripcion: taller.descripcion || '',
      profesorIds: taller.profesores?.map(p => p.id) || [],
    });
    setModalVisible(true);
  };

  const guardarTaller = async () => {
    if (!formData.nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
      };

      if (isEditing && currentTaller) {
        await talleresApi.actualizar({ id: currentTaller.id, ...data } as Taller);
        Alert.alert('Éxito', 'Taller actualizado correctamente');
      } else {
        await talleresApi.crear(data);
        Alert.alert('Éxito', 'Taller creado correctamente');
      }
      setModalVisible(false);
      cargarTalleres();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarTaller = (taller: Taller) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar el taller "${taller.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await talleresApi.eliminar(taller.id);
              Alert.alert('Éxito', 'Taller eliminado correctamente');
              cargarTalleres();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderTaller = ({ item }: { item: Taller }) => (
    <View style={sharedStyles.card}>
      <View style={sharedStyles.cardContent}>
        <Text style={sharedStyles.cardTitle}>{item.nombre}</Text>
        {item.descripcion && <Text style={sharedStyles.cardDetail}>Descripción: {item.descripcion}</Text>}
        {item.profesores && item.profesores.length > 0 && <Text style={sharedStyles.cardDetail}>Profesores: {item.profesores.map((p: any) => p.nombre).join(', ')}</Text>}
        {item.horario && item.horario.length > 0 && <Text style={sharedStyles.cardDetail}>Horario: {item.horario}</Text>}
        {item.ubicacion && <Text style={sharedStyles.cardDetail}>Ubicación: {item.ubicacion}</Text>}
      </View>
      {isAdmin && (
        <View style={sharedStyles.cardActions}>
          <TouchableOpacity
            style={[sharedStyles.actionButton, sharedStyles.editButton]}
            onPress={() => abrirModalEditar(item)}
          >
            <Text style={sharedStyles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sharedStyles.actionButton, sharedStyles.deleteButton]}
            onPress={() => eliminarTaller(item)}
          >
            <Text style={sharedStyles.actionButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Se eliminó la representación en tabla. Usamos listas/ítems en tarjetas.

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <View style={[sharedStyles.header, { flexDirection: 'column' }] }>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Text style={sharedStyles.headerTitle}>{isAdmin ? 'Talleres' : 'Mis Talleres'}</Text>
            {isAdmin && (
              <TouchableOpacity style={sharedStyles.addButton} onPress={abrirModalCrear}>
                <Text style={sharedStyles.addButtonText}>+ Nuevo</Text>
              </TouchableOpacity>
            )}
          </View>
          {isWeb && shouldShowTable && (
            <View style={{ marginTop: 12, width: '100%' }}>
              <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar talleres..." onClear={() => setSearchTerm('')} />
            </View>
          )}
        </View>

        {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

        {!loading && talleres.length === 0 && (
          <EmptyState message="No hay talleres registrados" />
        )}

        {!loading && talleres.length > 0 && (
          <FlatList
            data={talleres}
            renderItem={renderTaller}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={sharedStyles.listContent}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
          <SafeAreaView style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]} edges={isWeb ? [] : ['bottom']}>
            <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent]}>
              <View style={sharedStyles.modalHeader}>
                <Text style={sharedStyles.modalTitle}>
                  {isEditing ? 'Editar Taller' : 'Nuevo Taller'}
                </Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Input
                  label="Nombre"
                  required
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  placeholder="Nombre del taller"
                />

                <Input
                  label="Descripción"
                  value={formData.descripcion}
                  onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                  placeholder="Descripción del taller"
                  multiline
                  numberOfLines={3}
                />

                <View style={sharedStyles.inputContainer}>
                  <Text style={sharedStyles.label}>Profesores Asignados</Text>
                  <ScrollView style={sharedStyles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {profesores.map((profesor) => (
                      <TouchableOpacity
                        key={profesor.id}
                        style={[
                          sharedStyles.pickerItem,
                          formData.profesorIds.includes(profesor.id) && sharedStyles.pickerItemSelected,
                        ]}
                        onPress={() => {
                          const newIds = formData.profesorIds.includes(profesor.id)
                            ? formData.profesorIds.filter(id => id !== profesor.id)
                            : [...formData.profesorIds, profesor.id];
                          setFormData({ ...formData, profesorIds: newIds });
                        }}
                      >
                        <Text style={sharedStyles.pickerItemText}>
                          {formData.profesorIds.includes(profesor.id) ? '✓ ' : '○ '}
                          {profesor.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {formData.profesorIds.length > 0 && (
                    <Text style={[sharedStyles.label, { marginTop: spacing.sm, fontSize: typography.sizes.xs }]}>
                      {formData.profesorIds.length} profesor(es) seleccionado(s)
                    </Text>
                  )}
                </View>
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
                  onPress={guardarTaller}
                  loading={loading}
                  style={sharedStyles.modalButton}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Horario modal (view full schedule) */}
      <Modal
        visible={horarioModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setHorarioModalVisible(false)}
      >
        <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
          <SafeAreaView style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]} edges={isWeb ? [] : ['bottom']}>
            <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent]}>
              <View style={sharedStyles.modalHeader}>
                <Text style={sharedStyles.modalTitle}>Horario: {horarioModalTitle}</Text>
              </View>
              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={true}>
                <Text style={[sharedStyles.cardDetail, { marginBottom: 12 }]}>{horarioModalContent}</Text>
              </ScrollView>
              <View style={sharedStyles.modalFooter}>
                <Button title="Cerrar" variant="secondary" onPress={() => setHorarioModalVisible(false)} />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </Container>
  );
};

// Estilos locales ya no son necesarios, se usan sharedStyles
const styles = StyleSheet.create({});

export default TalleresScreen;

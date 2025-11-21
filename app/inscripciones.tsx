import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { inscripcionesApi } from '../src/api/inscripciones';
import { alumnosApi } from '../src/api/alumnos';
import { talleresApi } from '../src/api/talleres';
import { Inscripcion, Alumno, Taller } from '../src/types';
import { EmptyState } from '../src/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { shadows, colors, spacing, typography, borderRadius } from '../src/theme/colors';
import HeaderWithSearch from '../src/components/HeaderWithSearch';
import Modal from '../src/components/Modal'; // Usando ElegantModal
import { Select } from '../src/components/Select';
import { useAuth } from '../src/contexts/AuthContext';


const InscripcionesScreen = () => {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [Alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    estudiante_id: '',
    taller_id: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const [saving, setSaving] = useState(false);


  const cargarInscripciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inscripcionesApi.listar();
      setInscripciones(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarAlumnos = useCallback(async () => {
    try {
      const data = await alumnosApi.listar();
      setAlumnos(data);
    } catch (error: any) {
      console.error('Error cargando Alumnos:', error);
    }
  }, []);

  const cargarTalleres = useCallback(async () => {
    try {
      const data = await talleresApi.listar();
      setTalleres(data);
    } catch (error: any) {
      console.error('Error cargando talleres:', error);
    }
  }, []);

  useEffect(() => {
    cargarInscripciones();
    cargarAlumnos();
    cargarTalleres();
  }, [cargarInscripciones, cargarAlumnos, cargarTalleres]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarInscripciones();
    setRefreshing(false);
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

    setSaving(true);
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
      setSaving(false);
    }
  };

  const eliminarInscripcion = (inscripcion: Inscripcion) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar la inscripción de ${inscripcion.estudiante_nombre} al taller ${inscripcion.taller_nombre}?`,
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

  const filteredInscripciones = inscripciones.filter((i) =>
    (i.estudiante_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.taller_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderInscripcion = ({ item }: { item: Inscripcion }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        
        <View style={styles.headerRowCard}>
          <Ionicons name="person-outline" size={20} color={colors.text.primary} />
          <Text style={styles.cardTitle}>
            {item.estudiante_nombre || `Estudiante ID: ${item.estudiante_id}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="book-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.cardDetail}>
            {item.taller_nombre || `Taller ID: ${item.taller_id}`}
          </Text>
        </View>

        {item.fecha_inscripcion && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.cardDetail}>
              Fecha: {item.fecha_inscripcion}
            </Text>
          </View>
        )}
      </View>
      
      {isAdmin && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => eliminarInscripcion(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  const estudianteItems = useMemo(() => Alumnos.map(e => ({ label: `${e.nombres} ${e.apellidos}`, value: String(e.id) })), [Alumnos]);
  const tallerItems = useMemo(() => talleres.map(t => ({ label: t.nombre, value: String(t.id) })), [talleres]);

  return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <HeaderWithSearch 
          title="Inscripciones" 
          searchTerm={searchTerm} 
          onSearch={setSearchTerm} 
          onAdd={abrirModal} 
          // Por defecto la vista en Inscripciones es siempre la lista
          viewMode={'cards'}
          onViewModeChange={() => {}} 
        />

      {loading && !refreshing && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      {!loading && inscripciones.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <EmptyState 
            message="No hay inscripciones registradas" 
            icon={<Ionicons name="person-add" size={48} color={colors.text.tertiary} />} 
          />
        </View>
      )}

      {!loading && filteredInscripciones.length > 0 && (
        <FlatList
          data={filteredInscripciones}
          renderItem={renderInscripcion}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Modal - Usando el ElegantModal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Nueva Inscripción"
        footer={(
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <Text style={styles.modalFooterButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={crearInscripcion}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.text.secondary} />
                ) : (
                  <Text style={styles.modalFooterButtonText}>Crear</Text>
                )}
              </TouchableOpacity>
            </>
          )}
      >
        <Select
          label="Estudiante"
          required
          value={formData.estudiante_id}
          onValueChange={(value) => setFormData({ ...formData, estudiante_id: String(value) })}
          items={estudianteItems}
        />

        <Select
          label="Taller"
          required
          value={formData.taller_id}
          onValueChange={(value) => setFormData({ ...formData, taller_id: String(value) })}
          items={tallerItems}
        />
      </Modal>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  
  // --- Card Styles ---
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: colors.success, // Color verde para éxito/inscrito
    ...(shadows.sm as any),
  },
  cardContent: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary, // Se sobrescribe con colors.error
  },

  // Modal Footer (copiados de HeaderWithSearch para consistencia)
  modalFooterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  modalFooterButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  footerDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
});

export default InscripcionesScreen;
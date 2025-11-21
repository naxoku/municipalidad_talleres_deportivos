import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SectionCard } from '../../src/components/SectionCard';
import { QuickActionButton } from '../../src/components/QuickActionButton';
import { EditQuickModal } from '../../src/components/EditQuickModal';
import DeleteModal from '../../src/components/DeleteModal';
import { Profesor, Taller, Horario } from '../../src/types/entityTypes';
import { profesoresApi } from '../../src/api/profesores';
import { colors, spacing, typography, borderRadius } from '../../src/theme/colors';
import { useToast } from '../../src/contexts/ToastContext';

const DAYS_MAP: { [key: string]: string } = {
  '1': 'Lun',
  '2': 'Mar',
  '3': 'Mié',
  '4': 'Jue',
  '5': 'Vie',
  '6': 'Sáb',
  '0': 'Dom',
};

export default function ProfesorDetail() {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();

  const cargarProfesor = useCallback(async (showRefresh = false) => {
    if (!id) return;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : id;
    if (!numericId || isNaN(numericId)) return;
    
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await profesoresApi.obtener(numericId, 'talleres,horarios');
      if (data) {
        setProfesor(data as Profesor);
        setTalleres((data as any).talleres || []);
        setHorarios((data as any).horarios || []);
      }
    } catch (error) {
      console.error('Error cargando profesor:', error);
      showToast('Error al cargar el profesor', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    cargarProfesor();
  }, [cargarProfesor]);

  const handleEdit = async (formData: Record<string, string | number>) => {
    if (!profesor) return;
    try {
      await profesoresApi.actualizar(profesor.id, formData);
      showToast('Profesor actualizado correctamente', 'success');
      setEditModalVisible(false);
      cargarProfesor(true);
    } catch (error) {
      console.error('Error actualizando profesor:', error);
      showToast('Error al actualizar el profesor', 'error');
    }
  };

  const handleAssignTaller = () => {
    Alert.alert('Asignar Taller', 'Función en desarrollo');
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!profesor) return;
    try {
      await profesoresApi.eliminar(profesor.id);
      showToast('Profesor eliminado correctamente', 'success');
      setDeleteModalVisible(false);
      router.replace('/profesores');
    } catch (error) {
      console.error('Error eliminando profesor:', error);
      showToast('Error al eliminar el profesor', 'error');
    }
  };

  const onRefresh = () => {
    cargarProfesor(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profesor) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>No se encontró el profesor</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const editFields = [
    { key: 'nombre', value: profesor.nombre, label: 'Nombre', type: 'text' as const, required: true },
    { key: 'especialidad', value: profesor.especialidad, label: 'Especialidad', type: 'text' as const },
    { key: 'email', value: profesor.email, label: 'Email', type: 'text' as const },
    { key: 'telefono', value: profesor.telefono || '', label: 'Teléfono', type: 'text' as const },
  ];

  // Agrupar horarios por día
  const horariosPorDia = horarios.reduce((acc, horario) => {
    const dia = horario.dia_semana;
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(horario);
    return acc;
  }, {} as { [key: string]: Horario[] });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{profesor.nombre}</Text>
            <Text style={styles.headerSubtitle}>{profesor.especialidad || 'Sin especialidad'}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{talleres.length}</Text>
            <Text style={styles.statLabel}>Talleres</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={colors.blue.main} />
            <Text style={styles.statValue}>{horarios.length}</Text>
            <Text style={styles.statLabel}>Horarios</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={colors.success} />
            <Text style={styles.statValue}>
              {Object.keys(horariosPorDia).length}
            </Text>
            <Text style={styles.statLabel}>Días</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <QuickActionButton
            icon="create-outline"
            label="Editar"
            onPress={() => setEditModalVisible(true)}
            variant="primary"
          />
          <QuickActionButton
            icon="add-circle-outline"
            label="Asignar"
            onPress={handleAssignTaller}
            variant="success"
          />
          <QuickActionButton
            icon="trash-outline"
            label="Eliminar"
            onPress={handleDelete}
            variant="danger"
          />
        </View>

        {/* Datos Generales */}
        <SectionCard title="Datos Generales" icon="person-circle-outline">
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profesor.email || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{profesor.telefono || 'No especificado'}</Text>
          </View>
        </SectionCard>

        {/* Talleres Asignados */}
        <SectionCard title="Talleres Asignados" icon="book-outline">
          {talleres.length === 0 ? (
            <Text style={styles.emptyText}>No hay talleres asignados</Text>
          ) : (
            talleres.map((taller) => (
              <TouchableOpacity
                key={taller.id}
                style={styles.tallerCard}
                onPress={() => router.push(`/talleres/${taller.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.tallerInfo}>
                  <Text style={styles.tallerNombre}>{taller.nombre}</Text>
                  {taller.descripcion && (
                    <Text style={styles.tallerDescripcion}>{taller.descripcion}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            ))
          )}
        </SectionCard>

        {/* Horarios Semanales */}
        <SectionCard title="Horarios Semanales" icon="time-outline">
          {horarios.length === 0 ? (
            <Text style={styles.emptyText}>No hay horarios definidos</Text>
          ) : (
            Object.entries(horariosPorDia)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([dia, horariosDelDia]) => (
                <View key={dia} style={styles.diaContainer}>
                  <Text style={styles.diaLabel}>{DAYS_MAP[dia] || dia}</Text>
                  <View style={styles.horariosDelDia}>
                    {horariosDelDia.map((horario, index) => (
                      <View key={index} style={styles.horarioItem}>
                        <View style={styles.horarioTime}>
                          <Ionicons name="time-outline" size={16} color={colors.primary} />
                          <Text style={styles.horarioTimeText}>
                            {horario.hora_inicio} - {horario.hora_fin}
                          </Text>
                        </View>
                        <Text style={styles.horarioTaller}>
                          {(horario as any).taller_nombre || 'Taller'}
                        </Text>
                        {horario.ubicacion && (
                          <View style={styles.horarioLocation}>
                            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                            <Text style={styles.horarioLocationText}>{horario.ubicacion}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))
          )}
        </SectionCard>
      </ScrollView>

      {/* Edit Modal */}
      <EditQuickModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleEdit}
        title="Editar Profesor"
        fields={editFields}
      />

      {/* Delete Modal */}
      <DeleteModal
        visible={deleteModalVisible}
        entityType="profesor"
        entityName={profesor.nombre}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backIcon: {
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    minWidth: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tallerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  tallerInfo: {
    flex: 1,
  },
  tallerNombre: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tallerDescripcion: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  diaContainer: {
    marginBottom: spacing.md,
  },
  diaLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  horariosDelDia: {
    marginLeft: spacing.md,
  },
  horarioItem: {
    backgroundColor: colors.background.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  horarioTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  horarioTimeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  horarioTaller: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  horarioLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horarioLocationText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
});

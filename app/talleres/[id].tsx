import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SectionCard } from '../../src/components/SectionCard';
import { QuickActionButton } from '../../src/components/QuickActionButton';
import { EditQuickModal } from '../../src/components/EditQuickModal';
import DeleteModal from '../../src/components/DeleteModal';
import { Taller } from '../../src/types/entityTypes';
import { talleresApi } from '../../src/api/talleres';
import { colors, spacing, typography, borderRadius } from '../../src/theme/colors';
import { useToast } from '../../src/contexts/ToastContext';

export default function TallerDetail() {
  const [taller, setTaller] = useState<Taller | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();

  const cargarTaller = useCallback(async (showRefresh = false) => {
    if (!id) return;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : id;
    if (!numericId || isNaN(numericId)) return;
    
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await talleresApi.obtener(numericId, 'horarios,alumnos,profesores,estadisticas');
      if (data) {
        setTaller(data as Taller);
      }
    } catch (error) {
      console.error('Error cargando taller:', error);
      showToast('Error al cargar el taller', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    cargarTaller();
  }, [cargarTaller]);

  const handleEdit = async (formData: Record<string, string | number>) => {
    if (!taller) return;
    try {
      await talleresApi.actualizar(taller.id, formData);
      showToast('Taller actualizado correctamente', 'success');
      await cargarTaller();
    } catch (error) {
      showToast('Error al actualizar el taller', 'error');
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!taller) return;
    try {
      await talleresApi.eliminar(taller.id);
      setDeleteModalVisible(false);
      showToast('Taller eliminado correctamente', 'success');
      router.replace('/talleres');
    } catch (error) {
      console.error('Error eliminando taller:', error);
      showToast('Error al eliminar el taller', 'error');
    }
  };

  if (loading || !taller) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarTaller(true)}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header con título y acciones */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{taller.nombre}</Text>
            {taller.descripcion && (
              <Text style={styles.subtitle}>{taller.descripcion}</Text>
            )}
          </View>
        </View>

        {/* Botones de acción rápida */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="create-outline"
            label="Editar"
            variant="primary"
            onPress={() => setEditModalVisible(true)}
            style={styles.quickActionBtn}
          />
          <QuickActionButton
            icon="person-add-outline"
            label="Estudiantes"
            variant="success"
            onPress={() => router.push('/inscripciones')}
            style={styles.quickActionBtn}
          />
          <QuickActionButton
            icon="trash-outline"
            label="Eliminar"
            variant="danger"
            onPress={() => setDeleteModalVisible(true)}
            style={styles.quickActionBtn}
          />
        </View>

        {/* Estadísticas */}
        {taller.estadisticas && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{taller.total_alumnos || 0}</Text>
              <Text style={styles.statLabel}>Alumnos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={24} color={colors.success} />
              <Text style={styles.statValue}>{taller.horarios?.length || 0}</Text>
              <Text style={styles.statLabel}>Horarios</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.info} />
              <Text style={styles.statValue}>{taller.estadisticas.asistencia_promedio || 0}%</Text>
              <Text style={styles.statLabel}>Asistencia</Text>
            </View>
          </View>
        )}

        {/* Sección de Profesores */}
        <SectionCard
          title="Profesores asignados"
          icon="school-outline"
          collapsible
          defaultCollapsed={false}
        >
          {taller.profesores && taller.profesores.length > 0 ? (
            <View style={styles.listContainer}>
              {taller.profesores.map((profesor: any) => (
                <TouchableOpacity
                  key={profesor.id}
                  style={styles.listItem}
                  onPress={() => router.push(`/profesores/${profesor.id}`)}
                >
                  <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
                  <Text style={styles.listItemText}>{profesor.nombre}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No hay profesores asignados</Text>
          )}
        </SectionCard>

        {/* Sección de Alumnos */}
        <SectionCard
          title="Alumnos inscritos"
          icon="people-outline"
          collapsible
          defaultCollapsed={false}
          rightElement={
            <Text style={styles.badge}>{taller.total_alumnos || 0}</Text>
          }
        >
          {taller.alumnos && taller.alumnos.length > 0 ? (
            <View style={styles.listContainer}>
              {taller.alumnos.slice(0, 10).map((alumno: any) => (
                <TouchableOpacity
                  key={alumno.id}
                  style={styles.listItem}
                  onPress={() => router.push(`/alumnos/${alumno.id}`)}
                >
                  <Ionicons name="person-outline" size={28} color={colors.success} />
                  <Text style={styles.listItemText}>{alumno.nombres} {alumno.apellidos}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
              {taller.alumnos.length > 10 && (
                <TouchableOpacity
                  style={styles.verMasButton}
                  onPress={() => router.push('/alumnos')}
                >
                  <Text style={styles.verMasText}>
                    Ver todos ({taller.alumnos.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>No hay alumnos inscritos</Text>
          )}
        </SectionCard>

        {/* Sección de Horarios */}
        <SectionCard
          title="Horarios"
          icon="time-outline"
          collapsible
          defaultCollapsed={false}
        >
          {taller.horarios && taller.horarios.length > 0 ? (
            <View style={styles.listContainer}>
              {taller.horarios.map((horario: any) => (
                <View key={horario.id} style={styles.horarioItem}>
                  <View style={styles.horarioInfo}>
                    <Text style={styles.horarioDia}>{horario.dia_semana}</Text>
                    <Text style={styles.horarioHora}>
                      {horario.hora_inicio} - {horario.hora_fin}
                    </Text>
                    {horario.ubicacion_nombre && (
                      <View style={styles.horarioUbicacion}>
                        <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                        <Text style={styles.horarioUbicacionText}>{horario.ubicacion_nombre}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No hay horarios programados</Text>
          )}
        </SectionCard>
      </ScrollView>

      {/* Modal de Edición Rápida */}
      <EditQuickModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title="Editar Taller"
        fields={[
          { key: 'nombre', label: 'Nombre', type: 'text', value: taller.nombre, required: true },
          { key: 'descripcion', label: 'Descripción', type: 'textarea', value: taller.descripcion || '' },
        ]}
        onSave={handleEdit}
      />

      {/* Modal de Confirmación de Eliminación */}
      <DeleteModal
        visible={deleteModalVisible}
        entityType="taller"
        entityName={taller.nombre}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActionBtn: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  listContainer: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
  },
  listItemText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  verMasButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  verMasText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  horarioItem: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  horarioInfo: {
    gap: spacing.xs,
  },
  horarioDia: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  horarioHora: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  horarioUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  horarioUbicacionText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SectionCard } from '../../src/components/SectionCard';
import { QuickActionButton } from '../../src/components/QuickActionButton';
import { EditQuickModal } from '../../src/components/EditQuickModal';
import DeleteModal from '../../src/components/DeleteModal';
import { Alumno, Taller } from '../../src/types/entityTypes';
import { alumnosApi } from '../../src/api/alumnos';
import { colors, spacing, typography, borderRadius } from '../../src/theme/colors';
import { useToast } from '../../src/contexts/ToastContext';

export default function AlumnoDetail() {
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [asistencia, setAsistencia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();

  const cargarAlumno = useCallback(async (showRefresh = false) => {
    if (!id) return;
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : id;
    if (!numericId || isNaN(numericId)) return;
    
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await alumnosApi.obtener(numericId, 'talleres,asistencia');
      if (data) {
        setAlumno(data as Alumno);
        setTalleres((data as any).talleres || []);
        setAsistencia((data as any).asistencia || []);
      }
    } catch (error) {
      console.error('Error cargando alumno:', error);
      showToast('Error al cargar el alumno', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    cargarAlumno();
  }, [cargarAlumno]);

  const handleEdit = async (formData: Record<string, string | number>) => {
    if (!alumno) return;
    try {
      await alumnosApi.actualizar(alumno.id, formData);
      showToast('Alumno actualizado correctamente', 'success');
      setEditModalVisible(false);
      cargarAlumno(true);
    } catch (error) {
      console.error('Error actualizando alumno:', error);
      showToast('Error al actualizar el alumno', 'error');
    }
  };

  const handleInscribir = () => {
    Alert.alert('Inscribir a Taller', 'Función en desarrollo');
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!alumno) return;
    try {
      await alumnosApi.eliminar(alumno.id);
      showToast('Alumno eliminado correctamente', 'success');
      setDeleteModalVisible(false);
      router.replace('/alumnos');
    } catch (error) {
      console.error('Error eliminando alumno:', error);
      showToast('Error al eliminar el alumno', 'error');
    }
  };

  const onRefresh = () => {
    cargarAlumno(true);
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

  if (!alumno) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>No se encontró el alumno</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const editFields = [
    { key: 'nombres', value: alumno.nombres, label: 'Nombres', type: 'text' as const, required: true },
    { key: 'apellidos', value: alumno.apellidos || '', label: 'Apellidos', type: 'text' as const },
    { key: 'rut', value: alumno.rut || '', label: 'RUT', type: 'text' as const },
    { key: 'edad', value: alumno.edad?.toString() || '', label: 'Edad', type: 'text' as const },
    { key: 'telefono', value: alumno.telefono || '', label: 'Teléfono', type: 'text' as const },
    { key: 'email', value: alumno.email || '', label: 'Email', type: 'text' as const },
    { key: 'tutor', value: alumno.tutor || '', label: 'Tutor', type: 'text' as const },
  ];

  // Calcular estadísticas de asistencia
  const totalClases = asistencia.length;
  const clasesAsistidas = asistencia.filter((a: any) => a.presente).length;
  const porcentajeAsistencia = totalClases > 0 ? Math.round((clasesAsistidas / totalClases) * 100) : 0;

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
            <Text style={styles.headerTitle}>
              {alumno.nombres} {alumno.apellidos || ''}
            </Text>
            <Text style={styles.headerSubtitle}>{alumno.rut || 'Sin RUT'}</Text>
          </View>
          {alumno.edad && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>{alumno.edad} años</Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{talleres.length}</Text>
            <Text style={styles.statLabel}>Talleres</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={colors.blue.main} />
            <Text style={styles.statValue}>{totalClases}</Text>
            <Text style={styles.statLabel}>Clases</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.statValue}>{porcentajeAsistencia}%</Text>
            <Text style={styles.statLabel}>Asistencia</Text>
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
            label="Inscribir"
            onPress={handleInscribir}
            variant="success"
          />
          <QuickActionButton
            icon="trash-outline"
            label="Eliminar"
            onPress={handleDelete}
            variant="danger"
          />
        </View>

        {/* Datos Personales */}
        <SectionCard title="Datos Personales" icon="person-circle-outline">
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>RUT:</Text>
            <Text style={styles.infoValue}>{alumno.rut || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Edad:</Text>
            <Text style={styles.infoValue}>{alumno.edad ? `${alumno.edad} años` : 'No especificada'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{alumno.email || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{alumno.telefono || 'No especificado'}</Text>
          </View>
        </SectionCard>

        {/* Tutor y Contacto */}
        {alumno.tutor && (
          <SectionCard title="Tutor / Apoderado" icon="people-outline">
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{alumno.tutor}</Text>
            </View>
          </SectionCard>
        )}

        {/* Talleres Inscritos */}
        <SectionCard title="Talleres Inscritos" icon="book-outline">
          {talleres.length === 0 ? (
            <Text style={styles.emptyText}>No hay talleres inscritos</Text>
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

        {/* Historial de Asistencia */}
        <SectionCard title="Historial de Asistencia" icon="stats-chart-outline">
          {totalClases === 0 ? (
            <Text style={styles.emptyText}>No hay registros de asistencia</Text>
          ) : (
            <View>
              <View style={styles.asistenciaStats}>
                <View style={styles.asistenciaStatItem}>
                  <Text style={styles.asistenciaStatValue}>{clasesAsistidas}</Text>
                  <Text style={styles.asistenciaStatLabel}>Asistidas</Text>
                </View>
                <View style={styles.asistenciaDivider} />
                <View style={styles.asistenciaStatItem}>
                  <Text style={styles.asistenciaStatValue}>{totalClases - clasesAsistidas}</Text>
                  <Text style={styles.asistenciaStatLabel}>Ausencias</Text>
                </View>
                <View style={styles.asistenciaDivider} />
                <View style={styles.asistenciaStatItem}>
                  <Text style={[styles.asistenciaStatValue, { color: colors.success }]}>
                    {porcentajeAsistencia}%
                  </Text>
                  <Text style={styles.asistenciaStatLabel}>Promedio</Text>
                </View>
              </View>
              
              {/* Últimas asistencias */}
              <View style={styles.asistenciaList}>
                <Text style={styles.asistenciaListTitle}>Últimas clases</Text>
                {asistencia.slice(0, 5).map((registro: any, index: number) => (
                  <View key={index} style={styles.asistenciaItem}>
                    <Ionicons 
                      name={registro.presente ? 'checkmark-circle' : 'close-circle'} 
                      size={20} 
                      color={registro.presente ? colors.success : colors.error} 
                    />
                    <View style={styles.asistenciaItemInfo}>
                      <Text style={styles.asistenciaFecha}>
                        {new Date(registro.fecha).toLocaleDateString()}
                      </Text>
                      <Text style={styles.asistenciaTaller}>{registro.taller_nombre}</Text>
                    </View>
                    <Text style={[
                      styles.asistenciaEstado,
                      { color: registro.presente ? colors.success : colors.error }
                    ]}>
                      {registro.presente ? 'Presente' : 'Ausente'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </SectionCard>
      </ScrollView>

      {/* Edit Modal */}
      <EditQuickModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleEdit}
        title="Editar Alumno"
        fields={editFields}
      />

      {/* Delete Modal */}
      <DeleteModal
        visible={deleteModalVisible}
        entityType="alumno"
        entityName={`${alumno.nombres} ${alumno.apellidos || ''}`}
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
  ageBadge: {
    backgroundColor: colors.blue.soft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  ageText: {
    fontSize: typography.sizes.xs,
    color: colors.blue.main,
    fontWeight: '600',
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
  },
  asistenciaStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  asistenciaStatItem: {
    alignItems: 'center',
  },
  asistenciaStatValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  asistenciaStatLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  asistenciaDivider: {
    width: 1,
    backgroundColor: colors.background.secondary,
  },
  asistenciaList: {
    marginTop: spacing.sm,
  },
  asistenciaListTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  asistenciaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  asistenciaItemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  asistenciaFecha: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  asistenciaTaller: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  asistenciaEstado: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { estudiantesApi } from '../api/estudiantes';
import { inscripcionesApi } from '../api/inscripciones';
import { Estudiante } from '../types';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import SearchBar from '../components/SearchBar';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';
import HeaderWithSearch from '../components/HeaderWithSearch';

interface EstudianteEnriquecido extends Estudiante {
  talleres_inscritos?: Array<{
    id: number;
    nombre: string;
    asistencia_porcentaje: number;
  }>;
  asistencia_global?: number;
  ultima_asistencia?: string;
  total_clases_asistidas?: number;
  total_clases_programadas?: number;
}

export default function EstudiantesEnhancedScreen({ navigation }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estudiantes, setEstudiantes] = useState<EstudianteEnriquecido[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'high' | 'low'>('all');

  const { isWeb } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoading(true);
    try {
      const estudiantesData = await estudiantesApi.listar();
      const inscripcionesData = await inscripcionesApi.listar();

      // Enrich students with their enrollments and attendance
      const enriched: EstudianteEnriquecido[] = estudiantesData.map((estudiante) => {
        const misInscripciones = inscripcionesData.filter(
          (i) => i.estudiante_id === estudiante.id
        );

        // Mock attendance data (should come from API)
        const talleres = misInscripciones.map((insc) => ({
          id: insc.taller_id,
          nombre: insc.taller_nombre || `Taller ${insc.taller_id}`,
          asistencia_porcentaje: Math.floor(Math.random() * 30) + 70, // Mock 70-100%
        }));

        const asistencia_global =
          talleres.length > 0
            ? Math.round(
                talleres.reduce((sum, t) => sum + t.asistencia_porcentaje, 0) / talleres.length
              )
            : 0;

        return {
          ...estudiante,
          talleres_inscritos: talleres,
          asistencia_global,
          ultima_asistencia: 'Hoy 15:00', // Mock
          total_clases_asistidas: Math.floor(Math.random() * 40) + 10, // Mock
          total_clases_programadas: Math.floor(Math.random() * 10) + 50, // Mock
        };
      });

      setEstudiantes(enriched);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEstudiantes();
    setRefreshing(false);
  };

  const getAsistenciaBadge = (porcentaje: number) => {
    if (porcentaje >= 90) return { variant: 'success' as const, icon: '🏆', label: 'Excelente' };
    if (porcentaje >= 80) return { variant: 'success' as const, icon: '⭐', label: 'Bueno' };
    if (porcentaje >= 70) return { variant: 'warning' as const, icon: '👍', label: 'Regular' };
    return { variant: 'error' as const, icon: '⚠️', label: 'Bajo' };
  };

  const filteredEstudiantes = estudiantes
    .filter((e) => {
      const matchesSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterBy === 'high') return matchesSearch && (e.asistencia_global || 0) >= 90;
      if (filterBy === 'low') return matchesSearch && (e.asistencia_global || 0) < 70;
      return matchesSearch;
    })
    .sort((a, b) => (b.asistencia_global || 0) - (a.asistencia_global || 0));

  const renderEstudiante = ({ item }: { item: EstudianteEnriquecido }) => {
    const asistenciaBadge = getAsistenciaBadge(item.asistencia_global || 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={48} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{item.nombre}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>{item.edad} años</Text>
            </View>
            {item.contacto && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={14} color={colors.text.secondary} />
                <Text style={styles.infoText}>{item.contacto}</Text>
              </View>
            )}
          </View>
          <Badge
            label={`${asistenciaBadge.icon} ${asistenciaBadge.label}`}
            variant={asistenciaBadge.variant}
            size="small"
          />
        </View>

        <View style={styles.cardBody}>
          {/* Global attendance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Resumen General</Text>
            <View style={{ marginTop: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text style={styles.statLabel}>Asistencia global</Text>
                <Text style={styles.statValue}>{item.asistencia_global}%</Text>
              </View>
              <ProgressBar
                current={item.asistencia_global || 0}
                total={100}
                height={8}
                showLabel={false}
              />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{item.total_clases_asistidas}</Text>
                <Text style={styles.statText}>Clases asistidas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{item.total_clases_programadas}</Text>
                <Text style={styles.statText}>Clases totales</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{item.talleres_inscritos?.length || 0}</Text>
                <Text style={styles.statText}>Talleres</Text>
              </View>
            </View>
          </View>

          {/* Enrolled workshops */}
          {item.talleres_inscritos && item.talleres_inscritos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Talleres Inscritos</Text>
              {item.talleres_inscritos.map((taller) => (
                <View key={taller.id} style={styles.tallerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tallerName}>{taller.nombre}</Text>
                    <ProgressBar
                      current={taller.asistencia_porcentaje}
                      total={100}
                      height={4}
                      showLabel={false}
                    />
                  </View>
                  <Text style={styles.tallerPercentage}>{taller.asistencia_porcentaje}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* Last activity */}
          {item.ultima_asistencia && (
            <View style={styles.lastActivityContainer}>
              <Ionicons name="time" size={16} color={colors.text.secondary} />
              <Text style={styles.lastActivityText}>
                Última asistencia: {item.ultima_asistencia}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {isAdmin && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                /* Navigate to inscriptions */
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Inscribir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                /* Navigate to edit */
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.blue.main} />
              <Text style={[styles.actionButtonText, { color: colors.blue.main }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                /* Delete student */
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const Container: any = isWeb ? View : SafeAreaView;

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <HeaderWithSearch title={isAdmin ? 'Estudiantes' : 'Mis Estudiantes'} searchTerm={searchTerm} onSearch={setSearchTerm} />
        <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterBy === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterBy('all')}
            >
              <Text
                style={[styles.filterButtonText, filterBy === 'all' && styles.filterButtonTextActive]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterBy === 'high' && styles.filterButtonActive]}
              onPress={() => setFilterBy('high')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterBy === 'high' && styles.filterButtonTextActive,
                ]}
              >
                ⭐ Alta Asist.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterBy === 'low' && styles.filterButtonActive]}
              onPress={() => setFilterBy('low')}
            >
              <Text
                style={[styles.filterButtonText, filterBy === 'low' && styles.filterButtonTextActive]}
              >
                ⚠️ Baja Asist.
              </Text>
            </TouchableOpacity>
          </View>

        {loading && !refreshing && (
          <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />
        )}

        {!loading && filteredEstudiantes.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <EmptyState
              message={
                searchTerm
                  ? `No se encontraron estudiantes con "${searchTerm}"`
                  : 'No hay estudiantes registrados'
              }
              icon={<Ionicons name="person-circle" size={48} color={colors.text.tertiary} />}
            />
          </View>
        )}

        {!loading && filteredEstudiantes.length > 0 && (
          <FlatList
            data={filteredEstudiantes}
            renderItem={renderEstudiante}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.text.light,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.blue.main,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  studentName: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  cardBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  statNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  statText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  tallerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tallerName: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tallerPercentage: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text.primary,
    minWidth: 45,
    textAlign: 'right',
  },
  lastActivityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  lastActivityText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});

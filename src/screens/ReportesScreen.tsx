import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api/config';
import { colors, spacing, typography, borderRadius } from '../theme/colors';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import SimpleBarChart from '../components/SimpleBarChart';
import { useResponsive } from '../hooks/useResponsive';
import HeaderWithSearch from '../components/HeaderWithSearch';
import { sharedStyles } from '../theme/sharedStyles';

interface TallerStats {
  id: number;
  nombre: string;
  asistencia_promedio: number;
  total_Alumnos: number;
  total_clases: number;
  tendencia: 'up' | 'down' | 'stable';
}

export default function ReportesScreen({ navigation, route }: any) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const { isWeb } = useResponsive();

  useEffect(() => {
    cargarEstadisticas();
  }, [selectedPeriod]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reportes.php?action=estadisticas&period=${selectedPeriod}`);
      const json = await res.json();
      if (json.status === 'success') {
        setStats(json.datos);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      const url = `${API_URL}/api/reportes.php?action=exportar_${formato}&period=${selectedPeriod}`;
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Alert.alert('Exportar', `Reporte generado: ${url}`);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const Container: any = isWeb ? View : SafeAreaView;

  if (loading && !stats) {
    return (
      <Container style={sharedStyles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <HeaderWithSearch title="📊 Reportes y Estadísticas" searchTerm={searchTerm} onSearch={setSearchTerm} />
        <View style={styles.header}>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
                Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
                Mes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('year')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
                Año
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Export buttons */}
          <View style={styles.exportSection}>
            <Text style={styles.sectionTitle}>Exportar Reportes</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity style={styles.exportButton} onPress={() => exportarReporte('pdf')}>
                <Ionicons name="document-text" size={24} color={colors.error} />
                <Text style={styles.exportButtonText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={() => exportarReporte('excel')}>
                <Ionicons name="document" size={24} color={colors.success} />
                <Text style={styles.exportButtonText}>Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={() => exportarReporte('csv')}>
                <Ionicons name="document-attach" size={24} color={colors.info} />
                <Text style={styles.exportButtonText}>CSV</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Overall metrics */}
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>Resumen General</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Ionicons name="people" size={32} color={colors.primary} />
                <Text style={styles.metricValue}>{stats?.total_Alumnos || 0}</Text>
                <Text style={styles.metricLabel}>Alumnos Activos</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="calendar" size={32} color={colors.blue.main} />
                <Text style={styles.metricValue}>{stats?.total_clases || 0}</Text>
                <Text style={styles.metricLabel}>Clases Realizadas</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="checkmark-done" size={32} color={colors.success} />
                <Text style={styles.metricValue}>{stats?.asistencia_promedio || 0}%</Text>
                <Text style={styles.metricLabel}>Asistencia Promedio</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="book" size={32} color={colors.accent.purple} />
                <Text style={styles.metricValue}>{stats?.total_talleres || 0}</Text>
                <Text style={styles.metricLabel}>Talleres Activos</Text>
              </View>
            </View>
          </View>

          {/* Top performers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top Alumnos</Text>
            {stats?.top_Alumnos?.map((estudiante: any, index: number) => (
              <View key={estudiante.id} style={styles.rankCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{estudiante.nombre}</Text>
                  <ProgressBar
                    current={estudiante.asistencia_porcentaje}
                    total={100}
                    height={6}
                    showLabel={false}
                  />
                </View>
                <Badge
                  label={`${estudiante.asistencia_porcentaje}%`}
                  variant={estudiante.asistencia_porcentaje >= 90 ? 'success' : 'warning'}
                />
              </View>
            )) || (
              <Text style={styles.emptyText}>No hay datos disponibles</Text>
            )}
          </View>

          {/* Talleres comparison */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Comparación de Talleres</Text>
            {stats?.talleres_stats?.map((taller: any) => (
              <View key={taller.id} style={styles.tallerCard}>
                <View style={styles.tallerHeader}>
                  <Text style={styles.tallerName}>{taller.nombre}</Text>
                  <Badge
                    label={`${taller.asistencia_promedio}%`}
                    variant={
                      taller.asistencia_promedio >= 90
                        ? 'success'
                        : taller.asistencia_promedio >= 70
                        ? 'warning'
                        : 'error'
                    }
                  />
                </View>
                <View style={styles.tallerStats}>
                  <View style={styles.tallerStat}>
                    <Ionicons name="people" size={16} color={colors.text.secondary} />
                    <Text style={styles.tallerStatText}>{taller.total_Alumnos} Alumnos</Text>
                  </View>
                  <View style={styles.tallerStat}>
                    <Ionicons name="calendar" size={16} color={colors.text.secondary} />
                    <Text style={styles.tallerStatText}>{taller.total_clases} clases</Text>
                  </View>
                </View>
                <ProgressBar
                  current={taller.asistencia_promedio}
                  total={100}
                  height={8}
                  showLabel={false}
                />
              </View>
            )) || (
              <Text style={styles.emptyText}>No hay datos disponibles</Text>
            )}
          </View>

          {/* Attendance trend */}
          {stats?.asistencia_tendencia && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Tendencia de Asistencia</Text>
              <SimpleBarChart
                data={stats.asistencia_tendencia.map((d: any) => ({
                  label: d.fecha,
                  value: parseInt(d.presentes || 0),
                }))}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
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
    marginBottom: spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  periodButtonTextActive: {
    color: colors.text.light,
  },
  scrollContent: {
    padding: spacing.md,
  },
  exportSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exportButton: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  metricsSection: {
    marginBottom: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.light,
  },
  rankInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  rankName: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tallerCard: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tallerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tallerName: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  tallerStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  tallerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tallerStatText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

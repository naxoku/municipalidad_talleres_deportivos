import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { asistenciaApi } from '../api/asistencia';
import { clasesApi } from '../api/clases';
import { Asistencia, Clase } from '../types';
import { EmptyState } from '../components/EmptyState';
import { ProgressBar } from '../components/ProgressBar';
import { Badge } from '../components/Badge';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius, shadows } from '../theme/colors';

const AsistenciaScreen = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarClases, setMostrarClases] = useState(true);

  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  useEffect(() => {
    cargarClases();
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

  const cargarAsistencia = async (claseId: number) => {
    setLoading(true);
    try {
      const data = await asistenciaApi.listarPorClase(claseId);
      setAsistencias(data);
      setClaseSeleccionada(claseId);
      setMostrarClases(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarTodos = async (presente: boolean) => {
    if (!claseSeleccionada) return;
    Alert.alert(
      presente ? 'Marcar todos presentes' : 'Marcar todos ausentes',
      presente ? '¿Confirmas marcar todos como presentes?' : '¿Confirmas marcar todos como ausentes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: async () => {
          try {
            setLoading(true);
            await asistenciaApi.marcarMasivo(claseSeleccionada, presente);
            await cargarAsistencia(claseSeleccionada);
            Alert.alert('Listo', presente ? 'Se marcaron todos como presentes' : 'Se marcaron todos como ausentes');
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Error al marcar masivo');
          } finally {
            setLoading(false);
          }
        }}
      ]
    );
  };

  const marcarAsistencia = async (id: number, presente: boolean) => {
    try {
      // Optimistic UI update
      setAsistencias((prev) =>
        prev.map((a) => (a.id === id ? { ...a, presente } : a))
      );

      await asistenciaApi.marcar(id, presente);
      
      // Optionally reload to ensure sync
      if (claseSeleccionada) {
        cargarAsistencia(claseSeleccionada);
      }
    } catch (error: any) {
      // Revert on error
      if (claseSeleccionada) {
        cargarAsistencia(claseSeleccionada);
      }
      Alert.alert('Error', error.message);
    }
  };

  const volverAClases = () => {
    setMostrarClases(true);
    setClaseSeleccionada(null);
    setAsistencias([]);
  };

  const renderClase = ({ item }: { item: Clase }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => cargarAsistencia(item.id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.taller_nombre || `Taller ID: ${item.taller_id}`}</Text>
        <Text style={styles.cardDetail}>Fecha: {item.fecha}</Text>
        <Text style={styles.cardDetail}>Horario: {item.hora_inicio} - {item.hora_fin}</Text>
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderAsistencia = ({ item }: { item: Asistencia }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
          <Text style={styles.cardTitle}>{item.estudiante_nombre || `Estudiante ID: ${item.estudiante_id}`}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={item.presente ? 'checkmark-circle' : 'close-circle'} 
            size={18} 
            color={item.presente ? colors.success : colors.error}
          />
          <Text style={[styles.status, item.presente ? styles.statusPresente : styles.statusAusente]}>
            {item.presente ? 'Presente' : 'Ausente'}
          </Text>
        </View>
      </View>
      {isAdmin && (
        <View style={styles.asistenciaButtons}>
          <TouchableOpacity
            style={[
              styles.asistenciaButton, 
              styles.presenteButton, 
              item.presente && styles.buttonActive
            ]}
            onPress={() => marcarAsistencia(item.id, true)}
          >
            <Ionicons name="checkmark" size={18} color={item.presente ? '#fff' : colors.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.asistenciaButton, 
              styles.ausenteButton, 
              !item.presente && styles.buttonActive
            ]}
            onPress={() => marcarAsistencia(item.id, false)}
          >
            <Ionicons name="close" size={18} color={!item.presente ? '#fff' : colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        {!mostrarClases && (
          <TouchableOpacity onPress={volverAClases} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0066cc" />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {mostrarClases ? (isAdmin ? 'Seleccionar Clase' : 'Seleccionar Mis Clases') : (isAdmin ? 'Registro de Asistencia' : 'Asistencia de Mis Clases')}
        </Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

      {!loading && mostrarClases && clases.length === 0 && (
        <EmptyState message="No hay clases registradas" />
      )}

      {!loading && mostrarClases && clases.length > 0 && (
        <FlatList
          data={clases}
          renderItem={renderClase}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!loading && !mostrarClases && asistencias.length === 0 && (
        <EmptyState message="No hay estudiantes inscritos en esta clase" />
      )}

      {!loading && !mostrarClases && asistencias.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 12, backgroundColor: colors.background.secondary }}>
            <View style={{ marginBottom: spacing.md }}>
              <ProgressBar 
                current={asistencias.filter(a => a.presente).length} 
                total={asistencias.length} 
                height={10}
                showLabel={false}
              />
              <Text style={{ fontSize: typography.sizes.lg, fontWeight: '600', color: colors.text.primary, marginTop: spacing.sm }}>
                {`${asistencias.filter(a => a.presente).length}/${asistencias.length} presentes`}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity 
                onPress={() => marcarTodos(true)} 
                style={{ 
                  flex: 1,
                  backgroundColor: colors.success, 
                  padding: spacing.md, 
                  borderRadius: borderRadius.lg, 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginRight: spacing.xs }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sizes.md }}>Todos Presentes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => marcarTodos(false)} 
                style={{ 
                  flex: 1,
                  backgroundColor: colors.error, 
                  padding: spacing.md, 
                  borderRadius: borderRadius.lg,
                  flexDirection: 'row', 
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color="#fff" style={{ marginRight: spacing.xs }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sizes.md }}>Todos Ausentes</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.blue.soft, borderRadius: borderRadius.md }}>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.blue.dark, textAlign: 'center' }}>
                💡 Tip: Marca todos presentes y ajusta las excepciones
              </Text>
            </View>
          </View>

          <FlatList
            data={asistencias}
            renderItem={renderAsistencia}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  loader: {
    marginTop: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.orange,
    flexDirection: 'row',
    alignItems: 'center',
    ...(shadows.md as any),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  cardArrow: {
    marginLeft: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  status: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  statusPresente: {
    color: colors.success,
  },
  statusAusente: {
    color: colors.error,
  },
  asistenciaButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  asistenciaButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  presenteButton: {
    borderColor: colors.success,
    backgroundColor: colors.background.primary,
  },
  ausenteButton: {
    borderColor: colors.error,
    backgroundColor: colors.background.primary,
  },
  buttonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  asistenciaButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: typography.sizes.xs,
  },
});

export default AsistenciaScreen;

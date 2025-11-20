import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clasesApi } from '../src/api/clases';
import { talleresApi } from '../src/api/talleres';
import { Clase, Taller } from '../src/types';
import { Input } from '../src/components/Input';
import { EmptyState } from '../src/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../src/theme/colors';
import { sharedStyles } from '../src/theme/sharedStyles';
import HeaderWithSearch from '../src/components/HeaderWithSearch';
import Modal from '../src/components/Modal'; // Usando ElegantModal
import { Select } from '../src/components/Select';
import { useToast } from '../src/contexts/ToastContext';
import { useResponsive } from '../src/hooks/useResponsive';
import WeekCalendar, { CalendarEvent } from '../src/components/WeekCalendar'; // Reutilizamos el componente de calendario

// Helper para normalizar strings (remover acentos y convertir a minúsculas)
const normalizeKey = (str: string) => 
  str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ClasesScreen = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('calendar');
  const [formData, setFormData] = useState({
    taller_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: '',
  });

  const { isWeb, isMobile } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const cargarClases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clasesApi.listar();
      setClases(data);
    } catch {
      showToast('Error cargando clases', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const cargarTalleres = useCallback(async () => {
    try {
      const data = await talleresApi.listar();
      setTalleres(data);
    } catch (error: any) {
      console.error('Error cargando talleres:', error);
    }
  }, []);

  useEffect(() => {
    cargarClases();
    cargarTalleres();
  }, [cargarClases, cargarTalleres]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarClases();
    setRefreshing(false);
  };

  const abrirModal = () => {
    setFormData({ 
      taller_id: '', 
      fecha: new Date().toISOString().split('T')[0], 
      hora_inicio: '', 
      hora_fin: '' 
    });
    setModalVisible(true);
  };

  const crearClase = async () => {
    if (!formData.taller_id || !formData.fecha || !formData.hora_inicio || !formData.hora_fin) {
      showToast('Todos los campos son obligatorios', 'error');
      return;
    }

    setSaving(true);
    try {
      await clasesApi.crear({
        taller_id: parseInt(formData.taller_id),
        fecha_clase: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
      } as any);
      showToast('Clase creada correctamente', 'success');
      setModalVisible(false);
      cargarClases();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminarClase = (clase: Clase) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar la clase del taller "${clase.taller_nombre}" el ${clase.fecha_clase}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clasesApi.eliminar(clase.id);
              showToast('Clase eliminada correctamente', 'success');
              cargarClases();
            } catch {
              showToast('Error al eliminar la clase', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    const clase = filteredClases.find(c => c.id === event.id);
    if (clase) {
      eliminarClase(clase);
    }
  };
  
  const filteredClases = clases.filter((c) =>
    (c.taller_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.fecha_clase || '').includes(searchTerm)
  );

  const tallerItems = talleres.map((t) => ({ label: t.nombre, value: String(t.id) }));

  const renderClaseCard = ({ item }: { item: Clase }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.taller_nombre || `Taller ID: ${item.taller_id}`}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.infoLabel}>Fecha</Text>
          <Text style={styles.infoValue}>{item.fecha_clase}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.infoLabel}>Horario</Text>
          <Text style={styles.infoValue}>{item.hora_inicio} - {item.hora_fin}</Text>
        </View>
        {item.profesor_nombre && (
            <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Profesor</Text>
                <Text style={styles.infoValue}>{item.profesor_nombre}</Text>
            </View>
        )}
      </View>
      {isAdmin && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => eliminarClase(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.quickActionText, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCalendarView = () => {
    // Mapear clases al formato que WeekCalendar puede usar
    const clasesParaCalendar = filteredClases.map(c => ({
        id: c.id,
        title: c.taller_nombre || `Taller ${c.taller_id}`,
        subtitle: c.profesor_nombre,
        // Convertir fecha_clase a día de la semana en formato normalizado
        day: normalizeKey(new Date(c.fecha_clase).toLocaleDateString('es-CL', { weekday: 'long' })),
        start: c.hora_inicio,
        end: c.hora_fin,
    }));
    
    return (
      <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={isMobile} contentContainerStyle={styles.calendarContainer}>
        {/* WeekCalendar necesita una ligera adaptación para Clases vs Horarios, pero la estructura responsiva ya está en WeekCalendar.tsx */}
        <WeekCalendar 
          events={clasesParaCalendar} 
          onEventPress={isAdmin ? handleDeleteEvent : undefined} 
        />
      </ScrollView>
    );
  };

  const Container = isWeb ? View : SafeAreaView;

  // Determinar el modo de vista según la plataforma
  const finalViewMode = isMobile ? 'cards' : viewMode;

  return (
    <Container style={styles.container} edges={isWeb ? undefined : ['bottom']}>
        <View style={{ flex: 1 }}>
          <HeaderWithSearch 
            title={isAdmin ? 'Clases Programadas' : 'Mis Clases'} 
            searchTerm={searchTerm} 
            onSearch={setSearchTerm} 
            onAdd={isAdmin ? abrirModal : undefined} 
            viewMode={finalViewMode}
            // Solo permitir cambio de vista en desktop/tablet
            onViewModeChange={!isMobile ? (mode) => {
              if (mode === 'cards' || mode === 'calendar') {
                setViewMode(mode);
              }
            } : undefined}
          />

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {loading && !refreshing && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

            {!loading && clases.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <EmptyState 
                  message="No hay clases programadas" 
                  icon={<Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />} 
                />
              </View>
            )}

            {!loading && filteredClases.length > 0 && (
              finalViewMode === 'cards' ? (
                <FlatList
                    data={filteredClases}
                    renderItem={renderClaseCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: spacing.md }}
                    scrollEnabled={false} // Disable FlatList scroll inside ScrollView
                />
              ) : (
                renderCalendarView()
              )
            )}
          </ScrollView>
        </View>

        {/* Modal - Usando el ElegantModal */}
        <Modal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Programar Nueva Clase"
          maxWidth={isWeb ? 600 : undefined}
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
                onPress={crearClase}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Text style={styles.modalFooterButtonText}>Crear</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        >
          <View style={sharedStyles.inputContainer}>
            <Text style={sharedStyles.label}>Taller *</Text>
            <Select
              label=""
              value={formData.taller_id}
              onValueChange={(value) => setFormData({ ...formData, taller_id: String(value) })}
              items={tallerItems}
            />
          </View>

          <Input
            label="Fecha (YYYY-MM-DD)"
            required
            value={formData.fecha}
            onChangeText={(text) => setFormData({ ...formData, fecha: text })}
            placeholder="Ej: 2025-11-20"
            keyboardType="numbers-and-punctuation"
          />

          <Input
            label="Hora inicio (HH:MM)"
            required
            value={formData.hora_inicio}
            onChangeText={(text) => setFormData({ ...formData, hora_inicio: text })}
            placeholder="Ej: 14:00"
            keyboardType="numbers-and-punctuation"
          />

          <Input
            label="Hora fin (HH:MM)"
            required
            value={formData.hora_fin}
            onChangeText={(text) => setFormData({ ...formData, hora_fin: text })}
            placeholder="Ej: 16:00"
            keyboardType="numbers-and-punctuation"
          />
        </Modal>
      </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
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
  
  // --- Calendar View Container (For alignment on web) ---
  calendarContainer: {
    flex: 1, // Ocupa el ancho disponible en web
    paddingHorizontal: spacing.md,
    // Asegura que WeekCalendar se muestre correctamente dentro del ScrollView horizontal en móvil
    flexDirection: Platform.OS !== 'web' ? 'row' : 'column',
  },
  
  // --- Card Styles (Basado en Talleres.tsx) ---
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && { 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  cardContent: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm, 
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '500',
    minWidth: 70, 
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '400',
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  quickActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.text.secondary,
  },

  // Modal Footer (Minimalista)
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
    color: colors.text.primary, 
  },
  footerDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
});

export default ClasesScreen;
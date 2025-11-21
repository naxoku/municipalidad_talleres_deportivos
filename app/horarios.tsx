import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { horariosApi } from '../src/api/horarios';
import { talleresApi } from '../src/api/talleres';
import { Horario, Taller } from '../src/types';
import { Input } from '../src/components/Input';
import Modal from '../src/components/Modal';
import { EmptyState } from '../src/components/EmptyState';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuth } from '../src/contexts/AuthContext';
import HeaderWithSearch from '../src/components/HeaderWithSearch';
import WeekCalendar, { CalendarEvent } from '../src/components/WeekCalendar'; // Importamos el nuevo calendario
import { Select } from '../src/components/Select';
import { useToast } from '../src/contexts/ToastContext';
import { colors, spacing, borderRadius } from '../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeHHMM } from '../src/utils/time';

// --- Utilidades Locales ---
const normalize = (s?: string) => 
    (s || '').toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const DIAS_SEMANA_FILTRO = [
  { label: 'Todos', value: 'todos', short: 'Todos' },
  { label: 'Lunes', value: 'lunes', short: 'Lun' },
  { label: 'Martes', value: 'martes', short: 'Mar' },
  { label: 'Miércoles', value: 'miercoles', short: 'Mié' },
  { label: 'Jueves', value: 'jueves', short: 'Jue' },
  { label: 'Viernes', value: 'viernes', short: 'Vie' },
  { label: 'Sábado', value: 'sabado', short: 'Sáb' },
  { label: 'Domingo', value: 'domingo', short: 'Dom' },
];

export default function HorariosScreen() {
  // 1. Hooks y Estados
  const { isWeb, isMobile } = useResponsive();
  const { userRole } = useAuth();
  const { showToast } = useToast();
  const isAdmin = userRole === 'administrador';

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // View State
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'planning'>('list'); // 'calendar' = Grid Semanal, 'list' = Tarjetas por día, 'planning' = Planificación
  const [selectedDay, setSelectedDay] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null);
  const [formData, setFormData] = useState({
    taller_id: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
  });

  // 2. Carga de Datos
  const cargarDatos = useCallback(async () => {
    try {
      const [dataHorarios, dataTalleres] = await Promise.all([
        horariosApi.listar(),
        talleresApi.listar()
      ]);
      setHorarios(dataHorarios);
      setTalleres(dataTalleres);
    } catch {
      showToast('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  // 3. Procesamiento de Datos (Filtrado y Transformación)
  const filteredHorarios = useMemo(() => {
    let data = horarios;

    // Filtro por búsqueda (nombre taller, profesor, día)
    if (searchTerm) {
      const q = normalize(searchTerm);
      data = data.filter(h => 
        normalize(h.taller_nombre).includes(q) || 
        normalize(h.profesor_nombre).includes(q) ||
        normalize(h.dia_semana).includes(q)
      );
    }

    // Filtro por día (solo afecta a la vista de lista)
    if (viewMode === 'list' && selectedDay !== 'todos') {
      data = data.filter(h => normalize(h.dia_semana) === selectedDay);
    }

    // Ordenamiento por hora
    return data.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [horarios, searchTerm, selectedDay, viewMode]);

  // Transformar para el componente WeekCalendar
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredHorarios.map(h => ({
      id: h.id,
      title: h.taller_nombre,
      subtitle: h.profesor_nombre || h.ubicacion_nombre,
      day: h.dia_semana,
      start: h.hora_inicio,
      end: h.hora_fin,
      color: colors.infoLight, // Se podría personalizar por taller
      // Datos originales para lógica extra
      ...h 
    }));
  }, [filteredHorarios]);

  // 4. Handlers
  const handleEventPress = (event: CalendarEvent) => {
    const horario = horarios.find(h => h.id === event.id);
    if (horario && isAdmin) {
      setEditingHorario(horario);
      setFormData({
        taller_id: horario.taller_id?.toString() || '',
        dia_semana: horario.dia_semana,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
      });
      setEditModalVisible(true);
    }
  };

  const handleDelete = (horario: Horario) => {
    Alert.alert(
      'Eliminar Horario',
      `¿Estás seguro de eliminar el horario de ${horario.taller_nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await horariosApi.eliminar(horario.id);
              showToast('Horario eliminado', 'success');
              cargarDatos();
            } catch {
              showToast('Error al eliminar', 'error');
            }
          } 
        }
      ]
    );
  };

  const handleCreate = async () => {
    if (!formData.taller_id || !formData.dia_semana || !formData.hora_inicio || !formData.hora_fin) {
        showToast('Completa todos los campos', 'error');
        return;
    }
    setSaving(true);
    try {
        await horariosApi.crear({
            taller_id: parseInt(formData.taller_id),
            dia_semana: formData.dia_semana,
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin
        });
        showToast('Horario creado', 'success');
        setModalVisible(false);
        setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
        cargarDatos();
    } catch {
        showToast('Error al crear horario', 'error');
    } finally {
        setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingHorario || !formData.taller_id || !formData.dia_semana || !formData.hora_inicio || !formData.hora_fin) {
        showToast('Completa todos los campos', 'error');
        return;
    }
    setSaving(true);
    try {
        await horariosApi.actualizar({
            id: editingHorario.id,
            taller_id: parseInt(formData.taller_id),
            dia_semana: formData.dia_semana,
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin
        });
        showToast('Horario actualizado', 'success');
        setEditModalVisible(false);
        setEditingHorario(null);
        setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
        cargarDatos();
    } catch {
        showToast('Error al actualizar horario', 'error');
    } finally {
        setSaving(false);
    }
  };

  // 5. Renderizado
  const renderListItem = ({ item }: { item: Horario }) => (
    <View style={styles.card}>
      {/* Time Block */}
      <View style={styles.cardTime}>
        <Text style={styles.cardTimeText}>{formatTimeHHMM(item.hora_inicio)}</Text>
        <View style={styles.cardTimeLine} />
        <Text style={styles.cardTimeText}>{formatTimeHHMM(item.hora_fin)}</Text>
      </View>

      {/* Info Block */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.taller_nombre}</Text>
        {viewMode === 'list' && selectedDay === 'todos' && (
          <Text style={styles.cardDay}>{item.dia_semana}</Text>
        )}
        
        <View style={styles.cardMetaRow}>
            {item.profesor_nombre && (
                <View style={styles.cardMetaItem}>
                    <Ionicons name="person-outline" size={12} color={colors.text.secondary} />
                    <Text style={styles.cardMetaText}>{item.profesor_nombre}</Text>
                </View>
            )}
            {item.ubicacion_nombre && (
                <View style={styles.cardMetaItem}>
                    <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
                    <Text style={styles.cardMetaText}>{item.ubicacion_nombre}</Text>
                </View>
            )}
        </View>
      </View>

      {/* Actions */}
      {isAdmin && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  const Container: any = isWeb ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={['bottom']}>
      {/* Header Principal */}
      <View style={styles.mainHeader}>
        <HeaderWithSearch
            title="Horarios"
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onAdd={isAdmin ? () => setModalVisible(true) : undefined}
            // En móvil, forzamos 'cards' (list) visualmente en el header, aunque internamente controlamos con viewMode
            viewMode={viewMode === 'list' ? 'cards' : 'table'} 
            onViewModeChange={() => {}} // Deshabilitamos el toggle por defecto del header para usar el custom
        />
      </View>

      {/* Selector de Vista Personalizado (Tabs) */}
      <View style={styles.viewSelector}>
        <TouchableOpacity 
            style={[styles.viewTab, viewMode === 'list' && styles.viewTabActive]}
            onPress={() => setViewMode('list')}
        >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? colors.primary : colors.text.secondary} />
            <Text style={[styles.viewTabText, viewMode === 'list' && styles.viewTabTextActive]}>Lista</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.viewTab, viewMode === 'calendar' && styles.viewTabActive]}
            onPress={() => setViewMode('calendar')}
        >
            <Ionicons name="calendar" size={16} color={viewMode === 'calendar' ? colors.primary : colors.text.secondary} />
            <Text style={[styles.viewTabText, viewMode === 'calendar' && styles.viewTabTextActive]}>Semanal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.viewTab, viewMode === 'planning' && styles.viewTabActive]}
            onPress={() => setViewMode('planning')}
        >
            <Ionicons name="calendar-outline" size={16} color={viewMode === 'planning' ? colors.primary : colors.text.secondary} />
            <Text style={[styles.viewTabText, viewMode === 'planning' && styles.viewTabTextActive]}>Planificación</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Principal */}
      <View style={styles.content}>
        {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
            <>
                {/* VISTA 1: LISTA POR DÍA */}
                {viewMode === 'list' && (
                    <>
                        {/* Filtro de Días (Solo visible en modo lista) */}
                        <View style={styles.dayFilterContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
                                {DIAS_SEMANA_FILTRO.map(day => (
                                    <TouchableOpacity
                                        key={day.value}
                                        style={[styles.dayChip, selectedDay === day.value && styles.dayChipActive]}
                                        onPress={() => setSelectedDay(day.value)}
                                    >
                                        <Text style={[styles.dayChipText, selectedDay === day.value && styles.dayChipTextActive]}>
                                            {isMobile ? day.short : day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <FlatList
                            data={filteredHorarios}
                            renderItem={renderListItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.listContainer}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                            ListEmptyComponent={<EmptyState message="No hay horarios para mostrar" />}
                        />
                    </>
                )}

                {/* VISTA 2: CALENDARIO SEMANAL (GRID) */}
                {viewMode === 'calendar' && (
                    <View style={{ flex: 1 }}>
                        <WeekCalendar 
                            events={calendarEvents} 
                            onEventPress={handleEventPress}
                        />
                    </View>
                )}

                {/* VISTA 3: PLANIFICACIÓN (PRÓXIMAS CLASES) */}
                {viewMode === 'planning' && (
                    <ScrollView 
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.planningContainer}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        <Text style={styles.planningTitle}>Próximas Clases Programadas</Text>
                        <Text style={styles.planningSubtitle}>Horarios recurrentes de la semana</Text>
                        
                        {DIAS_SEMANA_FILTRO.slice(1).map(day => {
                            const dayHorarios = filteredHorarios.filter(h => normalize(h.dia_semana) === normalize(day.label));
                            if (dayHorarios.length === 0) return null;
                            
                            return (
                                <View key={day.value} style={styles.planningDaySection}>
                                    <View style={styles.planningDayHeader}>
                                        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                                        <Text style={styles.planningDayTitle}>{day.label}</Text>
                                        <Text style={styles.planningDayCount}>({dayHorarios.length})</Text>
                                    </View>
                                    
                                    {dayHorarios.map(horario => (
                                        <TouchableOpacity
                                            key={horario.id}
                                            style={styles.planningCard}
                                            onPress={() => isAdmin ? handleEventPress({ id: horario.id, title: horario.taller_nombre } as CalendarEvent) : null}
                                            activeOpacity={isAdmin ? 0.7 : 1}
                                        >
                                            <View style={styles.planningCardTime}>
                                                <Text style={styles.planningCardTimeText}>{formatTimeHHMM(horario.hora_inicio)}</Text>
                                                <Text style={styles.planningCardTimeSeparator}>-</Text>
                                                <Text style={styles.planningCardTimeText}>{formatTimeHHMM(horario.hora_fin)}</Text>
                                            </View>
                                            
                                            <View style={styles.planningCardInfo}>
                                                <Text style={styles.planningCardTitle}>{horario.taller_nombre}</Text>
                                                
                                                <View style={styles.planningCardMeta}>
                                                    {horario.profesor_nombre && (
                                                        <View style={styles.planningCardMetaItem}>
                                                            <Ionicons name="person" size={12} color={colors.text.secondary} />
                                                            <Text style={styles.planningCardMetaText}>{horario.profesor_nombre}</Text>
                                                        </View>
                                                    )}
                                                    {horario.ubicacion_nombre && (
                                                        <View style={styles.planningCardMetaItem}>
                                                            <Ionicons name="location" size={12} color={colors.text.secondary} />
                                                            <Text style={styles.planningCardMetaText}>{horario.ubicacion_nombre}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            
                                            {isAdmin && (
                                                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            );
                        })}
                        
                        {filteredHorarios.length === 0 && (
                            <EmptyState message="No hay horarios programados" />
                        )}
                    </ScrollView>
                )}
            </>
        )}
      </View>

      {/* Modal de Creación */}
      <Modal
        visible={modalVisible}
        onClose={() => {
            setModalVisible(false);
            setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
        }}
        title="Nuevo Horario"
        footer={
            <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => {
                    setModalVisible(false);
                    setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
                }} style={styles.modalBtnCancel}>
                    <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} style={styles.modalBtnConfirm} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnTextConfirm}>Guardar</Text>}
                </TouchableOpacity>
            </View>
        }
      >
        <Select
            label="Taller"
            value={formData.taller_id}
            onValueChange={v => setFormData({...formData, taller_id: String(v)})}
            items={talleres.map(t => ({ label: t.nombre, value: String(t.id) }))}
        />
        <Select
            label="Día"
            value={formData.dia_semana}
            onValueChange={v => setFormData({...formData, dia_semana: String(v)})}
            items={DIAS_SEMANA_FILTRO.slice(1).map(d => ({ label: d.label, value: d.label }))} // Usamos label para guardar bonito
        />
        <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
                <Input 
                    label="Inicio (HH:MM)" 
                    value={formData.hora_inicio} 
                    onChangeText={t => setFormData({...formData, hora_inicio: t})} 
                    placeholder="09:00"
                />
            </View>
            <View style={{ flex: 1 }}>
                <Input 
                    label="Fin (HH:MM)" 
                    value={formData.hora_fin} 
                    onChangeText={t => setFormData({...formData, hora_fin: t})} 
                    placeholder="10:30"
                />
            </View>
        </View>
      </Modal>

      {/* Modal de Edición Rápida */}
      <Modal
        visible={editModalVisible}
        onClose={() => {
            setEditModalVisible(false);
            setEditingHorario(null);
            setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
        }}
        title="Editar Horario"
        footer={
            <View style={styles.modalFooter}>
                {editingHorario && (
                    <TouchableOpacity 
                        onPress={() => {
                            handleDelete(editingHorario);
                            setEditModalVisible(false);
                        }} 
                        style={styles.modalBtnDelete}
                    >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text style={styles.modalBtnTextDelete}>Eliminar</Text>
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity 
                    onPress={() => {
                        setEditModalVisible(false);
                        setEditingHorario(null);
                        setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
                    }} 
                    style={styles.modalBtnCancel}
                >
                    <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdate} style={styles.modalBtnConfirm} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnTextConfirm}>Actualizar</Text>}
                </TouchableOpacity>
            </View>
        }
      >
        <Select
            label="Taller"
            value={formData.taller_id}
            onValueChange={v => setFormData({...formData, taller_id: String(v)})}
            items={talleres.map(t => ({ label: t.nombre, value: String(t.id) }))}
        />
        <Select
            label="Día"
            value={formData.dia_semana}
            onValueChange={v => setFormData({...formData, dia_semana: String(v)})}
            items={DIAS_SEMANA_FILTRO.slice(1).map(d => ({ label: d.label, value: d.label }))}
        />
        <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
                <Input 
                    label="Inicio (HH:MM)" 
                    value={formData.hora_inicio} 
                    onChangeText={t => setFormData({...formData, hora_inicio: t})} 
                    placeholder="09:00"
                />
            </View>
            <View style={{ flex: 1 }}>
                <Input 
                    label="Fin (HH:MM)" 
                    value={formData.hora_fin} 
                    onChangeText={t => setFormData({...formData, hora_fin: t})} 
                    placeholder="10:30"
                />
            </View>
        </View>
      </Modal>

    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  mainHeader: {
    // Unificamos el espacio del header
  },
  content: {
    flex: 1,
  },
  
  // View Selector (Tabs Superiores)
  viewSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  viewTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginRight: 20,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewTabActive: {
    borderBottomColor: colors.primary,
  },
  viewTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  viewTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Day Filter (Chips)
  dayFilterContainer: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginRight: 8,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dayChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  // List Container
  listContainer: {
    padding: spacing.md,
    paddingBottom: 40,
  },

  // Card Styles (Lista)
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    // Sombra sutil
    ...(Platform.OS === 'web' && { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }),
  },
  cardTime: {
    width: 80,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
    paddingVertical: 12,
  },
  cardTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardTimeLine: {
    height: 12,
    width: 1,
    backgroundColor: colors.border.medium,
    marginVertical: 2,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardDay: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal Styles
  modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
  },
  modalBtnCancel: {
      paddingVertical: 10,
      paddingHorizontal: 16,
  },
  modalBtnTextCancel: {
      color: colors.text.secondary,
      fontWeight: '500',
  },
  modalBtnConfirm: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: borderRadius.sm,
  },
  modalBtnTextConfirm: {
      color: '#FFF',
      fontWeight: '600',
  },
  modalBtnDelete: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.error,
  },
  modalBtnTextDelete: {
      color: colors.error,
      fontWeight: '500',
  },

  // Planning View Styles
  planningContainer: {
      padding: spacing.md,
      paddingBottom: 40,
  },
  planningTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.xs,
  },
  planningSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: spacing.lg,
  },
  planningDaySection: {
      marginBottom: spacing.lg,
  },
  planningDayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: spacing.sm,
      paddingBottom: spacing.xs,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
  },
  planningDayTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
  },
  planningDayCount: {
      fontSize: 13,
      color: colors.text.secondary,
      fontWeight: '500',
  },
  planningCard: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
      ...(Platform.OS === 'web' && { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }),
  },
  planningCardTime: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: borderRadius.sm,
      marginRight: spacing.md,
      minWidth: 100,
      justifyContent: 'center',
  },
  planningCardTimeText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
  },
  planningCardTimeSeparator: {
      fontSize: 13,
      color: colors.text.secondary,
      marginHorizontal: 4,
  },
  planningCardInfo: {
      flex: 1,
  },
  planningCardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
  },
  planningCardMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
  },
  planningCardMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  planningCardMetaText: {
      fontSize: 12,
      color: colors.text.secondary,
  },
});
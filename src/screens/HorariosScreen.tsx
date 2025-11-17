import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { horariosApi } from '../api/horarios';
import { talleresApi } from '../api/talleres';
import { Horario, Taller } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from '../components/SearchBar';
import HeaderWithSearch from '../components/HeaderWithSearch';
 
import { sharedStyles } from '../theme/sharedStyles';
import { colors, spacing, typography, borderRadius, shadows } from '../theme/colors';
import { formatTimeHHMM } from '../utils/time';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const DIAS_SEMANA = [
  { label: 'Lunes', value: 'Lunes' },
  { label: 'Martes', value: 'Martes' },
  { label: 'Miércoles', value: 'Miércoles' },
  { label: 'Jueves', value: 'Jueves' },
  { label: 'Viernes', value: 'Viernes' },
  { label: 'Sábado', value: 'Sábado' },
  { label: 'Domingo', value: 'Domingo' },
];

const HorariosScreen = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [formData, setFormData] = useState({
    taller_id: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
  });

  const { isWeb, isDesktop, isMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  useEffect(() => {
    cargarHorarios();
    cargarTalleres();
  }, []);

  const groupedHorarios = useMemo(() => {
    const map: Record<string, Horario[]> = {};
    DIAS_SEMANA.forEach((d) => (map[d.value] = []));
    map['Otros'] = [];

    const normalize = (s?: string) => (s || '').toString().trim().toLowerCase();

    horarios.forEach((h) => {
      const ds = normalize(h.dia_semana);
      const match = DIAS_SEMANA.find((d) => normalize(d.value) === ds || normalize(d.label) === ds || ds.startsWith(normalize(d.value).slice(0, 3)));
      if (match) map[match.value].push(h);
      else map['Otros'].push(h);
    });

    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
    });

    return map;
  }, [horarios]);

  const cargarHorarios = async () => {
    setLoading(true);
    try {
      const data = await horariosApi.listar();
      setHorarios(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarTalleres = async () => {
    try {
      const data = await talleresApi.listar();
      setTalleres(data);
    } catch (error: any) {
      console.error('Error cargando talleres:', error);
    }
  };

  const abrirModal = () => {
    setFormData({ taller_id: '', dia_semana: '', hora_inicio: '', hora_fin: '' });
    setModalVisible(true);
  };

  const crearHorario = async () => {
    if (!formData.taller_id || !formData.dia_semana || !formData.hora_inicio || !formData.hora_fin) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await horariosApi.crear({
        taller_id: parseInt(formData.taller_id),
        dia_semana: formData.dia_semana,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
      });
      Alert.alert('Éxito', 'Horario creado correctamente');
      setModalVisible(false);
      cargarHorarios();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarHorario = (horario: Horario) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await horariosApi.eliminar(horario.id);
              Alert.alert('Éxito', 'Horario eliminado correctamente');
              cargarHorarios();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'calendar' ? 'table' : 'calendar');
  };

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const displayedHorarios = useMemo(() => {
    let arr = [...horarios];
    // Apply simple search filter on taller and profesor
    if (searchTerm && searchTerm.trim() !== '') {
      const q = searchTerm.trim().toLowerCase();
      arr = arr.filter((h) =>
        (h.taller_nombre || (`Taller ${h.taller_id}`)).toLowerCase().includes(q) ||
        (h.profesor_nombre || '').toLowerCase().includes(q) ||
        (h.dia_semana || '').toLowerCase().includes(q)
      );
    }

    if (!sortBy) return arr;

    arr.sort((a, b) => {
      let va: any = '';
      let vb: any = '';
      switch (sortBy) {
        case 'taller':
          va = (a.taller_nombre || `Taller ${a.taller_id}`).toString().toLowerCase();
          vb = (b.taller_nombre || `Taller ${b.taller_id}`).toString().toLowerCase();
          break;
        case 'dia':
          va = (a.dia_semana || '').toString().toLowerCase();
          vb = (b.dia_semana || '').toString().toLowerCase();
          break;
        case 'inicio':
          va = (a.hora_inicio || '').toString();
          vb = (b.hora_inicio || '').toString();
          break;
        case 'fin':
          va = (a.hora_fin || '').toString();
          vb = (b.hora_fin || '').toString();
          break;
        case 'profesor':
          va = (a.profesor_nombre || '').toString().toLowerCase();
          vb = (b.profesor_nombre || '').toString().toLowerCase();
          break;
        case 'ubicacion':
          va = (a.ubicacion_nombre || '').toString().toLowerCase();
          vb = (b.ubicacion_nombre || '').toString().toLowerCase();
          break;
        case 'direccion':
          va = ((a as any).direccion || (a as any).ubicacion_direccion || '').toString().toLowerCase();
          vb = ((b as any).direccion || (b as any).ubicacion_direccion || '').toString().toLowerCase();
          break;
        default:
          va = (a.taller_nombre || `Taller ${a.taller_id}`).toString().toLowerCase();
          vb = (b.taller_nombre || `Taller ${b.taller_id}`).toString().toLowerCase();
      }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return arr;
  }, [horarios, sortBy, sortDir, searchTerm]);

  const renderTableView = () => {
    const renderTableContent = () => (
      <View style={[styles.table, isWeb ? styles.tableWeb : styles.tableMobile]}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
            <TouchableOpacity
              style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 2 } : { width: 200 }, styles.tableHeaderButton]}
              onPress={() => toggleSort('taller')}
            >
              <Text style={styles.headerText}>Taller</Text>
              <Ionicons
                name={sortBy === 'taller' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
                size={14}
                color={sortBy === 'taller' ? '#3B82F6' : '#94A3B8'}
                style={styles.sortIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 1 } : { width: 120 }, styles.tableHeaderButton]}
              onPress={() => toggleSort('dia')}
            >
              <Text style={styles.headerText}>Día</Text>
              <Ionicons
                name={sortBy === 'dia' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
                size={14}
                color={sortBy === 'dia' ? '#3B82F6' : '#94A3B8'}
                style={styles.sortIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 0.8 } : { width: 100 }, styles.tableHeaderButton]}
              onPress={() => toggleSort('inicio')}
            >
              <Text style={styles.headerText}>Inicio</Text>
              <Ionicons
                name={sortBy === 'inicio' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
                size={14}
                color={sortBy === 'inicio' ? '#3B82F6' : '#94A3B8'}
                style={styles.sortIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 0.8 } : { width: 100 }, styles.tableHeaderButton]}
              onPress={() => toggleSort('fin')}
            >
              <Text style={styles.headerText}>Fin</Text>
              <Ionicons
                name={sortBy === 'fin' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
                size={14}
                color={sortBy === 'fin' ? '#3B82F6' : '#94A3B8'}
                style={styles.sortIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 1.5 } : { width: 180 }, styles.tableHeaderButton]}
              onPress={() => toggleSort('profesor')}
            >
              <Text style={styles.headerText}>Profesor</Text>
              <Ionicons
                name={sortBy === 'profesor' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
                size={14}
                color={sortBy === 'profesor' ? '#3B82F6' : '#94A3B8'}
                style={styles.sortIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 1.5 } : { width: 150 }, styles.tableHeaderButton]}
              onPress={() => toggleSort('ubicacion')}
            >
              <Text style={styles.headerText}>Ubicación</Text>
              <Ionicons
                name={sortBy === 'ubicacion' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
                size={14}
                color={sortBy === 'ubicacion' ? '#3B82F6' : '#94A3B8'}
                style={styles.sortIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 1.2 } : { width: 160 }, styles.tableHeaderButton]}
              onPress={() => toggleSort('direccion')}
            >
              <Text style={styles.headerText}>Dirección</Text>
              <Ionicons
                name={sortBy === 'direccion' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
                size={14}
                color={sortBy === 'direccion' ? '#3B82F6' : '#94A3B8'}
                style={styles.sortIcon}
              />
            </TouchableOpacity>

            {isAdmin && (
              <View style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 1 } : { width: 100 }]}> 
                <Text style={styles.headerText}>Acciones</Text>
              </View>
            )}
          </View>

        {/* Table Body */}
        {displayedHorarios.map((horario, index) => (
          <View 
            key={horario.id} 
            style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}
          >
            <View style={[styles.tableCell, isWeb ? { flex: 2 } : { width: 200 }]}>
              <Text style={styles.cellText} numberOfLines={2}>
                {horario.taller_nombre || `Taller ${horario.taller_id}`}
              </Text>
            </View>
            <View style={[styles.tableCell, isWeb ? { flex: 1 } : { width: 120 }]}>
              <Text style={styles.cellText}>{horario.dia_semana}</Text>
            </View>
            <View style={[styles.tableCell, isWeb ? { flex: 0.8 } : { width: 100 }]}>
              <Text style={styles.cellText}>{formatTimeHHMM(horario.hora_inicio)}</Text>
            </View>
            <View style={[styles.tableCell, isWeb ? { flex: 0.8 } : { width: 100 }]}>
              <Text style={styles.cellText}>{formatTimeHHMM(horario.hora_fin)}</Text>
            </View>
            <View style={[styles.tableCell, isWeb ? { flex: 1.5 } : { width: 180 }]}>
              <Text style={styles.cellText} numberOfLines={2}>
                {horario.profesor_nombre || '-'}
              </Text>
            </View>
            <View style={[styles.tableCell, isWeb ? { flex: 1.5 } : { width: 150 }]}>
              <Text style={styles.cellText} numberOfLines={2}>
                {horario.ubicacion_nombre || '-'}
              </Text>
            </View>
            <View style={[styles.tableCell, isWeb ? { flex: 1.2 } : { width: 160 }]}>
              <Text style={styles.cellText} numberOfLines={2}>
                {((horario as any).direccion || (horario as any).ubicacion_direccion || '-')}
              </Text>
            </View>
            {isAdmin && (
              <View style={[styles.tableCell, isWeb ? { flex: 1 } : { width: 100 }]}>
                <TouchableOpacity 
                  style={styles.tableDeleteButton}
                  onPress={() => eliminarHorario(horario)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );

    return (
      <View style={styles.tableContainer}>
        {isWeb ? (
          renderTableContent()
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderTableContent()}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderCalendarView = () => (
    <View style={styles.calendarWrapper}>
      {DIAS_SEMANA.map((dia) => {
        const horariosDelDia = groupedHorarios[dia.value];
        return (
          <View key={dia.value} style={styles.dayColumn}>
            {/* Header del día */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderTitle}>{dia.label}</Text>
              <View style={styles.dayHeaderBadge}>
                <Text style={styles.dayHeaderCount}>{horariosDelDia.length}</Text>
              </View>
            </View>

            {/* Lista de horarios del día */}
            <View style={styles.dayContent}>
              {horariosDelDia.length === 0 ? (
                <View style={styles.emptyDay}>
                  <Ionicons name="calendar-outline" size={28} color="#E0E0E0" />
                  <Text style={styles.emptyDayText}>Sin clases</Text>
                </View>
              ) : (
                horariosDelDia.map((horario) => (
                  <View key={horario.id} style={styles.scheduleCard}>
                    {/* Time Badge */}
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeStart}>{formatTimeHHMM(horario.hora_inicio)}</Text>
                      <View style={styles.timeDivider} />
                      <Text style={styles.timeEnd}>{formatTimeHHMM(horario.hora_fin)}</Text>
                    </View>

                    {/* Card Content */}
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {horario.taller_nombre || `Taller ${horario.taller_id}`}
                      </Text>

                      <View style={styles.cardDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons name="person-outline" size={13} color="#7C8DB5" />
                          <Text style={styles.detailText} numberOfLines={1}>
                            {horario.profesor_nombre || 'Sin profesor'}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Ionicons name="location-outline" size={13} color="#7C8DB5" />
                          <Text style={styles.detailText} numberOfLines={1}>
                            {horario.ubicacion_nombre || 'Sin ubicación'}
                          </Text>
                        </View>
                      </View>

                      {/* Delete Button */}
                      {isAdmin && (
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => eliminarHorario(horario)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={13} color="#EF4444" />
                          <Text style={styles.deleteButtonText}>Eliminar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const Container = SafeAreaView;

  return (
    <Container style={styles.container} edges={['bottom']}>
      <View style={styles.contentWrapper}>
        <HeaderWithSearch 
          title={isAdmin ? 'Horarios' : 'Mis Horarios'} 
          searchTerm={searchTerm} 
          onSearch={setSearchTerm} 
          onAdd={isAdmin ? abrirModal : undefined}
          viewMode={viewMode === 'calendar' ? 'cards' : 'table'}
          onViewModeChange={(m) => setViewMode(m === 'cards' ? 'calendar' : 'table')}
        />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={async () => { 
                setRefreshing(true); 
                await cargarHorarios(); 
                setRefreshing(false); 
              }} 
            />
          }
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          )}

          {!loading && horarios.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <EmptyState 
                message="No hay horarios registrados" 
                icon={<Ionicons name="time-outline" size={48} color={colors.text.tertiary} />} 
              />
            </View>
          )}

          {!loading && horarios.length > 0 && (
            viewMode === 'calendar' ? renderCalendarView() : renderTableView()
          )}
        </ScrollView>
      </View>

      {/* Modal */}
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
                <Text style={sharedStyles.modalTitle}>Nuevo Horario</Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={sharedStyles.inputContainer}>
                  <Text style={sharedStyles.label}>Taller *</Text>
                  <View style={sharedStyles.pickerWrapper}>
                    <ScrollView style={sharedStyles.pickerScroll} nestedScrollEnabled>
                      {talleres.map((taller) => (
                        <TouchableOpacity
                          key={taller.id}
                          style={[
                            sharedStyles.pickerItem,
                            formData.taller_id === taller.id.toString() && sharedStyles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, taller_id: taller.id.toString() })}
                        >
                          <Text style={sharedStyles.pickerItemText}>{taller.nombre}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={sharedStyles.inputContainer}>
                  <Text style={sharedStyles.label}>Día de la semana *</Text>
                  <View style={sharedStyles.pickerWrapper}>
                    <ScrollView style={sharedStyles.pickerScroll} nestedScrollEnabled>
                      {DIAS_SEMANA.map((dia) => (
                        <TouchableOpacity
                          key={dia.value}
                          style={[
                            sharedStyles.pickerItem,
                            formData.dia_semana === dia.value && sharedStyles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, dia_semana: dia.value })}
                        >
                          <Text style={sharedStyles.pickerItemText}>{dia.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <Input
                  label="Hora inicio"
                  required
                  value={formData.hora_inicio}
                  onChangeText={(text) => setFormData({ ...formData, hora_inicio: text })}
                  placeholder="HH:MM (ej: 14:00)"
                />

                <Input
                  label="Hora fin"
                  required
                  value={formData.hora_fin}
                  onChangeText={(text) => setFormData({ ...formData, hora_fin: text })}
                  placeholder="HH:MM (ej: 16:00)"
                />
              </ScrollView>

              <View style={sharedStyles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={sharedStyles.modalButton}
                />
                <Button
                  title="Crear"
                  variant="success"
                  onPress={crearHorario}
                  loading={loading}
                  style={sharedStyles.modalButton}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  
  // Calendar View
  calendarWrapper: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
  },
  dayColumn: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  
  // Day Header
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF2',
  },
  dayHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  dayHeaderBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  dayHeaderCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Day Content
  dayContent: {
    padding: 8,
    gap: 6,
  },
  emptyDay: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  // Schedule Card
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Time Badge
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeStart: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  timeDivider: {
    width: 8,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  timeEnd: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
    textAlign: 'right',
  },
  
  // Card Content
  cardContent: {
    gap: 5,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
    marginBottom: 2,
  },
  cardDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  
  // Delete Button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 3,
  },
  deleteButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Table View
  tableContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  table: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  tableWeb: {
    width: '100%',
    alignSelf: 'stretch',
  },
  tableMobile: {
    minWidth: 720,
    alignSelf: 'flex-start',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#E8ECF2',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowEven: {
    backgroundColor: '#FAFBFC',
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center',
  },
  headerCell: {
    backgroundColor: '#F8FAFC',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  cellText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  tableDeleteButton: {
    padding: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  tableHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortIcon: {
    marginLeft: 6,
  },
});

export default HorariosScreen;
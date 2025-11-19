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
import { horariosApi } from '../src/api/horarios';
import { talleresApi } from '../src/api/talleres';
import { Horario, Taller } from '../src/types';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuth } from '../src/contexts/AuthContext';
import SearchBar from '../src/components/SearchBar';
import HeaderWithSearch from '../src/components/HeaderWithSearch';
 
import { sharedStyles } from '../src/theme/sharedStyles';
import { colors, spacing, typography, borderRadius, shadows } from '../src/theme/colors';
import { formatTimeHHMM } from '../src/utils/time';
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
            />
          </TouchableOpacity>

          {isAdmin && (
            <View style={[styles.tableCell, styles.headerCell, isWeb ? { flex: 1 } : { width: 100 }]}> 
              <Text style={styles.headerText}>Acciones</Text>
            </View>
          )}
        </View>

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
              <Text style={styles.dayHeaderCount}>{horariosDelDia.length}</Text>
            </View>

            {/* Lista de horarios */}
            <View style={styles.dayContent}>
              {horariosDelDia.length === 0 ? (
                <View style={styles.emptyDay}>
                  <Text style={styles.emptyDayText}>Sin clases</Text>
                </View>
              ) : (
                horariosDelDia.map((horario) => (
                  <View key={horario.id} style={styles.scheduleCard}>
                    {/* Horario destacado */}
                    <Text style={styles.timeText}>
                      {formatTimeHHMM(horario.hora_inicio)} - {formatTimeHHMM(horario.hora_fin)}
                    </Text>

                    {/* Nombre del taller - más prominente */}
                    <Text style={styles.tallerName} numberOfLines={2}>
                      {horario.taller_nombre || `Taller ${horario.taller_id}`}
                    </Text>

                    {/* Info secundaria sin labels */}
                    <View style={styles.secondaryInfo}>
                      {horario.profesor_nombre && (
                        <View style={styles.infoRow}>
                          <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                          <Text style={styles.secondaryText} numberOfLines={1}>
                            {horario.profesor_nombre}
                          </Text>
                        </View>
                      )}

                      {horario.ubicacion_nombre && (
                        <View style={styles.infoRow}>
                          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                          <Text style={styles.secondaryText} numberOfLines={1}>
                            {horario.ubicacion_nombre}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Botón eliminar - más discreto */}
                    {isAdmin && (
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => eliminarHorario(horario)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-outline" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
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
                  icon={<Ionicons name="time-outline" size={48} color="#94A3B8" />} 
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
    backgroundColor: '#F8FAFB',
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
  
  // Calendar View - Diseño más limpio y visual
  calendarWrapper: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'nowrap',
  },
  dayColumn: {
    flex: 1,
    minWidth: 170,
  },
  
  // Day Header sin bordes
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 12,
  },
  dayHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  dayHeaderCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  
  // Day Content sin padding extra
  dayContent: {
    gap: 12,
  },
  emptyDay: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  emptyDayText: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  
  // Schedule Card - ultra limpio
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  
  // Time - prominente
  timeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  
  // Nombre del taller - destacado
  tallerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 10,
  },
  
  // Info secundaria sin labels
  secondaryInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  
  // Delete Button - icono solo, esquina superior derecha
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Table View
  tableContainer: {
    flex: 1,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tableWeb: {
    width: '100%',
  },
  tableMobile: {
    minWidth: 720,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  tableDeleteButton: {
    padding: 6,
    backgroundColor: '#FAFBFC',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default HorariosScreen;

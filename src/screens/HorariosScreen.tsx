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
  const [formData, setFormData] = useState({
    taller_id: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
  });

  const { isWeb, isDesktop, isMobile } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  useEffect(() => {
    cargarHorarios();
    cargarTalleres();
  }, []);

  // Agrupar horarios por día de la semana para mostrar en formato tipo calendario
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

    // Ordenar cada día por hora_inicio
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
    });

    return map;
  }, [horarios]);

  const screenWidth = Dimensions.get('window').width;
  const isNarrow = screenWidth < 700;

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

  const renderHorario = ({ item }: { item: Horario }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.taller_nombre || `Taller ID: ${item.taller_id}`}</Text>
        <Text style={styles.cardDetail}>Día: {item.dia_semana}</Text>
        <Text style={styles.cardDetail}>Horario: {formatTimeHHMM(item.hora_inicio)} - {formatTimeHHMM(item.hora_fin)}</Text>
      </View>
      {isAdmin && (
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => eliminarHorario(item)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Se eliminó la representación en tabla. Usamos listas/ítems en tarjetas.

  const Container = SafeAreaView;

  return (
    <Container style={styles.container} edges={['bottom']}>
      <View style={styles.contentWrapper}>
        <View style={[styles.header, isWeb && styles.headerWeb]}> 
          <Text style={styles.headerTitle}>{isAdmin ? 'Horarios' : 'Mis Horarios'}</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity style={styles.addButton} onPress={abrirModal}>
                <Text style={styles.addButtonText}>+ Nuevo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar horarios..." onClear={() => setSearchTerm('')} />
        </View>

        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await cargarHorarios(); setRefreshing(false); }} />}>
            {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

            {!loading && horarios.length === 0 && (
              <EmptyState message="No hay horarios registrados" />
            )}

            {!loading && horarios.length > 0 && (
              <ScrollView horizontal={!isNarrow} contentContainerStyle={styles.calendarScroll} showsHorizontalScrollIndicator={false}>
                {Object.keys(groupedHorarios).map((dia) => (
                  <View key={dia} style={[styles.dayColumn, isNarrow && styles.dayColumnNarrow]}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayHeaderTitle}>{dia}</Text>
                      <Text style={styles.dayHeaderCount}>{groupedHorarios[dia].length}</Text>
                    </View>

                    {groupedHorarios[dia].length === 0 ? (
                      <View style={styles.emptyDay}>
                        <Text style={styles.emptyDayText}>Sin clases</Text>
                      </View>
                    ) : (
                      groupedHorarios[dia].map((item) => (
                        <View key={item.id} style={[styles.scheduleCard, isMobile ? styles.cardMobile : styles.cardWeb]}> 
                          <View style={styles.cardHeaderRow}>
                            <View style={styles.timeBadge}> 
                              <Text style={styles.timeBadgeText}>{formatTimeHHMM(item.hora_inicio)}</Text>
                              <Text style={styles.timeBadgeSub}>{formatTimeHHMM(item.hora_fin)}</Text>
                            </View>

                            <View style={styles.cardBody}>
                              <Text style={styles.cardTitle}>{item.taller_nombre || `Taller ${item.taller_id}`}</Text>

                              <View style={styles.infoRow}> 
                                <Ionicons name="person" size={14} color={colors.text.tertiary} />
                                <Text style={styles.cardDetail} numberOfLines={1}>{item.profesor_nombre || '-'}</Text>
                              </View>

                              <View style={styles.infoRow}> 
                                <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
                                <Text style={styles.cardDetail}>{item.hora_inicio} - {item.hora_fin}</Text>
                              </View>

                              <View style={styles.infoRow}> 
                                <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
                                <Text style={styles.cardDetail} numberOfLines={1}>{item.ubicacion_nombre || '-'}</Text>
                              </View>
                            </View>

                            <View style={styles.cardActions}> 
                              {isAdmin && (
                                <TouchableOpacity style={styles.deleteSmall} onPress={() => eliminarHorario(item)}>
                                  <Text style={styles.deleteSmallText}>Eliminar</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
        </ScrollView>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, isWeb && styles.webModalOverlay]}>
          <SafeAreaView style={[styles.modalSafeArea, isWeb && styles.webModalSafeArea]} edges={isWeb ? [] : ['bottom']}>
            <View style={[styles.modalContent, isWeb && styles.webModalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Horario</Text>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Taller *</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                      {talleres.map((taller) => (
                        <TouchableOpacity
                          key={taller.id}
                          style={[
                            styles.pickerItem,
                            formData.taller_id === taller.id.toString() && styles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, taller_id: taller.id.toString() })}
                        >
                          <Text style={styles.pickerItemText}>{taller.nombre}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Día de la semana *</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                      {DIAS_SEMANA.map((dia) => (
                        <TouchableOpacity
                          key={dia.value}
                          style={[
                            styles.pickerItem,
                            formData.dia_semana === dia.value && styles.pickerItemSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, dia_semana: dia.value })}
                        >
                          <Text style={styles.pickerItemText}>{dia.label}</Text>
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

              <View style={styles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Crear"
                  variant="success"
                  onPress={crearHorario}
                  loading={loading}
                  style={styles.modalButton}
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
    backgroundColor: colors.background.secondary,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: '100%'
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  webContentWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerWeb: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...(shadows.md as any),
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardContent: {
    marginBottom: 12,
  },
  
  /* responsive schedule cards */
  cardWeb: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  cardMobile: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardActions: {
    marginLeft: spacing.sm,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  webModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSafeArea: {
    maxHeight: '90%',
  },
  webModalSafeArea: {
    maxHeight: undefined,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
  },
  webModalContent: {
    borderRadius: 12,
    width: 600,
    maxWidth: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: Platform.OS === 'web' ? 400 : undefined,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 150,
  },
  pickerScroll: {
    maxHeight: 150,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#333',
  },
  calendarScroll: {
    padding: 12,
    alignItems: 'flex-start',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  dayColumn: {
    flex: 1,
    minWidth: 220,
    minHeight: 200,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    padding: spacing.md,
    ...(shadows.md as any),
  },
  dayColumnNarrow: {
    width: '100%',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayHeaderCount: {
    backgroundColor: '#eef7ff',
    color: '#0077cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyDay: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayText: {
    color: '#888',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fbfbff',
    marginBottom: 8,
  },
  cardLeft: {
    marginRight: 8,
  },
  timeBadge: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 64,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  timeBadgeSub: {
    fontSize: 11,
    color: '#666',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  cardDetail: {
    fontSize: 12,
    color: '#666',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  deleteSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffecec',
    borderRadius: 8,
  },
  deleteSmallText: {
    color: '#c3302b',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default HorariosScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profesoresApi } from '../api/profesores';
import { talleresApi } from '../api/talleres';
import { Profesor } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import HeaderWithSearch from '../components/HeaderWithSearch';
import { useResponsive } from '../hooks/useResponsive';
import { sharedStyles } from '../theme/sharedStyles';

const colors = {
  primary: '#0066cc',
};

const spacing = {
  xl: 20,
};

const ProfesoresScreen = () => {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfesor, setCurrentProfesor] = useState<Profesor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    contrasena: '',
  });

  const { isWeb, isDesktop } = useResponsive();
  const shouldShowTable = isWeb && isDesktop;
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(shouldShowTable ? 'table' : 'cards');

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    cargarProfesores();
  }, []);

  const cargarProfesores = async () => {
    setLoading(true);
    try {
      // Fetch profesores and talleres in parallel so we can compute workshops per professor
      const [profesData, talleresData] = await Promise.all([profesoresApi.listar(), talleresApi.listar()]);

      // Build a map professorId -> taller names
      const profTalleresMap: Record<number, string[]> = {};
      talleresData.forEach((t) => {
        if (!t.profesores || !Array.isArray(t.profesores)) return;
        t.profesores.forEach((p) => {
          const pid = Number(p.id);
          if (!profTalleresMap[pid]) profTalleresMap[pid] = [];
          profTalleresMap[pid].push(t.nombre);
        });
      });

      // Attach talleres list to each profesor for display (non-destructive)
      const merged = profesData.map((prof) => ({
        ...prof,
        talleres: profTalleresMap[prof.id] || [],
      }));

      setProfesores(merged as any);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentProfesor(null);
    setFormData({ nombre: '', especialidad: '', email: '', contrasena: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (profesor: Profesor) => {
    setIsEditing(true);
    setCurrentProfesor(profesor);
    setFormData({
      nombre: profesor.nombre,
      especialidad: profesor.especialidad || '',
      email: profesor.email || '',
      contrasena: '',
    });
    setModalVisible(true);
  };

  const guardarProfesor = async () => {
    if (!formData.nombre || !formData.especialidad || !formData.email) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!isEditing && !formData.contrasena) {
      Alert.alert('Error', 'La contraseña es obligatoria para crear un profesor');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && currentProfesor) {
        await profesoresApi.actualizar({
          id: currentProfesor.id,
          nombre: formData.nombre,
          especialidad: formData.especialidad,
          email: formData.email,
        });
        Alert.alert('Éxito', 'Profesor actualizado correctamente');
      } else {
        await profesoresApi.crear(formData as any);
        Alert.alert('Éxito', 'Profesor creado correctamente');
      }
      setModalVisible(false);
      cargarProfesores();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarProfesor = (profesor: Profesor) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${profesor.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await profesoresApi.eliminar(profesor.id);
              Alert.alert('Éxito', 'Profesor eliminado correctamente');
              cargarProfesores();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderProfesor = ({ item }: { item: Profesor }) => (
    <View style={[styles.card, isWeb ? styles.cardWeb : styles.cardMobile]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <View style={styles.badgeContainer}>
          {((item as any).talleres || []).slice(0, 3).map((t: string, i: number) => (
            <View key={i} style={[styles.miniChip, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.miniChipText, { color: '#1E40AF' }]} numberOfLines={1}>{t}</Text>
            </View>
          ))}
          {((item as any).talleres || []).length > 3 && (
            <View style={[styles.miniChip, { backgroundColor: '#F1F5F9' }]}>
              <Text style={styles.miniChipText}>+{((item as any).talleres || []).length - 3}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardDetail}>Especialidad: {item.especialidad || '-'}</Text>
        <Text style={styles.cardDetail}>Teléfono: {item.telefono || '-'}</Text>
        <Text style={styles.cardDetail}>Email: {(item as any).email || (item as any).profesor_email || '-'}</Text>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionButton} onPress={() => abrirModalEditar(item)}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="pencil" size={16} color="#0F172A" />
          </View>
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <View style={styles.footerDivider} />

        <TouchableOpacity style={styles.actionButton} onPress={() => eliminarProfesor(item)}>
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="trash" size={16} color="#EF4444" />
          </View>
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const filteredProfesores = profesores.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.nombre || '').toString().toLowerCase().includes(q) ||
      (p.especialidad || '').toString().toLowerCase().includes(q) ||
      ((p as any).email || '').toString().toLowerCase().includes(q) ||
      (((p as any).talleres || []).join(', ') || '').toString().toLowerCase().includes(q)
    );
  });

  const displayedProfesores = React.useMemo(() => {
    const arr = [...filteredProfesores];
    if (!sortBy) return arr;

    arr.sort((a, b) => {
      let va: any = '';
      let vb: any = '';
      switch (sortBy) {
        case 'nombre':
          va = (a.nombre || '').toString().toLowerCase();
          vb = (b.nombre || '').toString().toLowerCase();
          break;
        case 'especialidad':
          va = (a.especialidad || '').toString().toLowerCase();
          vb = (b.especialidad || '').toString().toLowerCase();
          break;
        case 'telefono':
          va = ((a as any).telefono || '').toString().toLowerCase();
          vb = ((b as any).telefono ||  '').toString().toLowerCase();
          break;
        case 'email':
          va = ((a as any).email || '').toString().toLowerCase();
          vb = ((b as any).email || '').toString().toLowerCase();
          break;
        case 'talleres':
          va = (((a as any).talleres || []).join(', ') || '').toString().toLowerCase();
          vb = (((b as any).talleres || []).join(', ') || '').toString().toLowerCase();
          break;
        default:
          va = (a.nombre || '').toString().toLowerCase();
          vb = (b.nombre || '').toString().toLowerCase();
      }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filteredProfesores, sortBy, sortDir]);

  const renderTableRow = ({ item, index }: { item: Profesor; index: number }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => abrirModalEditar(item)} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven, isWeb && styles.tableRowWeb]}>
      <View style={[styles.tableCellNombre, isWeb && styles.tableCellNombreWeb]}>
        <Text style={styles.tableCellText}>{item.nombre}</Text>
      </View>

      <View style={[styles.tableCellEspecialidad, isWeb && styles.tableCellEspecialidadWeb]}>
        <Text style={styles.tableCellText}>{item.especialidad || '-'}</Text>
      </View>

      <View style={[styles.tableCellTelefono, styles.tableCellCenter, isWeb && styles.tableCellTelefonoWeb]}>
        <Text style={styles.tableCellText}>{(item as any).telefono || '-'}</Text>
      </View>

      <View style={[styles.tableCellEmail, isWeb && styles.tableCellEmailWeb]}>
        <Text style={styles.tableCellText} numberOfLines={1}>{((item as any).email || (item as any).profesor_email) || '-'}</Text>
      </View>

      <View style={[styles.tableCellTalleres, isWeb && styles.tableCellTalleresWeb]}>
        <Text style={styles.tableCellText} numberOfLines={1}>{(((item as any).talleres || []).length) ? ((item as any).talleres.join(', ')) : '-'}</Text>
      </View>

      <View style={[styles.tableCellAcciones, styles.tableCellActions, isWeb && styles.tableCellAccionesWeb]}>
        <TouchableOpacity style={styles.tableActionButton} onPress={() => abrirModalEditar(item)}>
          <Ionicons name="pencil" size={16} color="#0F172A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tableActionButton} onPress={() => eliminarProfesor(item)}>
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderTableContent = () => (
    <View style={[styles.table, isWeb && styles.tableWeb]}>
      <View style={[styles.tableHeader, isWeb && styles.tableHeaderWeb]}>
        <TouchableOpacity style={[styles.tableCellNombre, isWeb && styles.tableCellNombreWeb, styles.tableHeaderButton]} onPress={() => toggleSort('nombre')}>
          <Text style={styles.tableHeaderButtonText}>Nombre</Text>
          <Ionicons name={sortBy === 'nombre' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'} size={14} color={sortBy === 'nombre' ? '#3B82F6' : '#94A3B8'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tableCellEspecialidad, isWeb && styles.tableCellEspecialidadWeb, styles.tableHeaderButton]} onPress={() => toggleSort('especialidad')}>
          <Text style={styles.tableHeaderButtonText}>Especialidad</Text>
          <Ionicons name={sortBy === 'especialidad' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'} size={14} color={sortBy === 'especialidad' ? '#3B82F6' : '#94A3B8'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tableCellTelefono, styles.tableCellCenter, isWeb && styles.tableCellTelefonoWeb, styles.tableHeaderButton]} onPress={() => toggleSort('telefono')}>
          <Text style={styles.tableHeaderButtonText}>Teléfono</Text>
          <Ionicons name={sortBy === 'telefono' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'} size={14} color={sortBy === 'telefono' ? '#3B82F6' : '#94A3B8'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tableCellEmail, isWeb && styles.tableCellEmailWeb, styles.tableHeaderButton]} onPress={() => toggleSort('email')}>
          <Text style={styles.tableHeaderButtonText}>Email</Text>
          <Ionicons name={sortBy === 'email' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'} size={14} color={sortBy === 'email' ? '#3B82F6' : '#94A3B8'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tableCellTalleres, isWeb && styles.tableCellTalleresWeb, styles.tableHeaderButton]} onPress={() => toggleSort('talleres')}>
          <Text style={styles.tableHeaderButtonText}>Talleres</Text>
          <Ionicons name={sortBy === 'talleres' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'} size={14} color={sortBy === 'talleres' ? '#3B82F6' : '#94A3B8'} />
        </TouchableOpacity>

        <View style={[styles.tableCellAcciones, styles.tableCellCenter, isWeb && styles.tableCellAccionesWeb]}>
          <Text style={styles.tableHeaderButtonText}>Acciones</Text>
        </View>
      </View>

      {displayedProfesores.map((item, index) => (
        <React.Fragment key={item.id}>
          {renderTableRow({ item, index })}
        </React.Fragment>
      ))}
    </View>
  );

  // Se eliminó la representación en tabla. Usamos listas/ítems en tarjetas.

  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <HeaderWithSearch
          title="Profesores"
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          onAdd={abrirModalCrear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {isWeb ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
            <View style={{ paddingBottom: spacing.xl }}>
              {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

              {!loading && profesores.length === 0 && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                  <EmptyState message="No hay profesores registrados" icon={<Ionicons name="person" size={48} color={colors.primary || '#888'} />} />
                </View>
              )}

              {!loading && profesores.length > 0 && viewMode === 'cards' && (
                <FlatList
                  data={displayedProfesores}
                  renderItem={renderProfesor}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={sharedStyles.listContent}
                  scrollEnabled={false}
                  numColumns={isWeb && isDesktop ? 2 : 1}
                  columnWrapperStyle={isWeb && isDesktop ? styles.gridRow : undefined}
                />
              )}

              {!loading && profesores.length > 0 && viewMode === 'table' && (
                <View style={styles.tableContainer}>
                  {isWeb ? (
                    renderTableContent()
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableHorizontalContent}>
                      {renderTableContent()}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <>
            {loading && <ActivityIndicator size="large" color={colors.primary} style={sharedStyles.loader} />}

            {!loading && profesores.length === 0 && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                <EmptyState message="No hay profesores registrados" icon={<Ionicons name="person" size={48} color={colors.primary || '#888'} />} />
              </View>
            )}

            {!loading && profesores.length > 0 && viewMode === 'cards' && (
              <FlatList
                data={displayedProfesores}
                renderItem={renderProfesor}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={sharedStyles.listContent}
                numColumns={isWeb && isDesktop ? 2 : 1}
                columnWrapperStyle={isWeb && isDesktop ? styles.gridRow : undefined}
              />
            )}

            {!loading && profesores.length > 0 && viewMode === 'table' && (
              <View style={styles.tableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableHorizontalContent}>
                  {renderTableContent()}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>

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
                <Text style={sharedStyles.modalTitle}>
                  {isEditing ? 'Editar Profesor' : 'Nuevo Profesor'}
                </Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Input
                  label="Nombre"
                  required
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  placeholder="Nombre completo"
                />

                <Input
                  label="Especialidad"
                  required
                  value={formData.especialidad}
                  onChangeText={(text) => setFormData({ ...formData, especialidad: text })}
                  placeholder="Ej: Educación Física, Danza"
                />

                <Input
                  label="Email"
                  required
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {!isEditing && (
                  <Input
                    label="Contraseña"
                    required
                    value={formData.contrasena}
                    onChangeText={(text) => setFormData({ ...formData, contrasena: text })}
                    placeholder="Contraseña"
                    secureTextEntry
                  />
                )}
              </ScrollView>

              <View style={sharedStyles.modalFooter}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={sharedStyles.modalButton}
                />
                <Button
                  title={isEditing ? 'Actualizar' : 'Crear'}
                  variant="success"
                  onPress={guardarProfesor}
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

// Estilos locales para la pantalla de Profesores (cards + table view)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  listContent: {
    padding: 16,
  },

  // Table styles
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    overflow: 'hidden',
  },
  tableWeb: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#E8ECF2',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableHeaderWeb: {
    width: '100%',
  },
  tableHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableHeaderButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 56,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#FAFBFC',
  },
  tableRowWeb: {
    width: '100%',
  },
  tableCellNombre: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 220,
    flex: 2,
  },
  tableCellNombreWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellEspecialidad: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 160,
    flex: 1.5,
  },
  tableCellEspecialidadWeb: {
    flex: 1.5,
    minWidth: 0,
  },
  tableCellTelefono: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 120,
    flex: 1,
  },
  tableCellTelefonoWeb: {
    flex: 1,
    minWidth: 0,
  },
  tableCellEmail: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 180,
    flex: 2,
  },
  tableCellEmailWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellTalleres: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 200,
    flex: 2,
  },
  tableCellTalleresWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellAcciones: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 120,
    flex: 1,
  },
  tableCellAccionesWeb: {
    flex: 1,
    minWidth: 0,
  },
  tableCellCenter: {
    alignItems: 'center',
  },
  tableCellActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  tableCellText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  tableActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tableHorizontalContent: {
    paddingBottom: 8,
    minWidth: 760,
  },
  // Cards (cards view)
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    paddingBottom: 8,
  },
  cardWeb: {
    width: '48%',
    maxWidth: '48%',
  },
  cardMobile: {
    width: '100%',
  },
  cardHeader: {
    padding: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 22,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 8,
  },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  cardDetail: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  footerDivider: {
    width: 1,
    backgroundColor: '#E8ECF2',
    marginHorizontal: 8,
    height: 36,
  },
});

export default ProfesoresScreen;

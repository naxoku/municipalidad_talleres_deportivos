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

  const { isWeb, isDesktop, isMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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

  useEffect(() => {
    cargarProfesores();
  }, []);

  const cargarProfesores = async () => {
    setLoading(true);
    try {
      const [profesData, talleresData] = await Promise.all([profesoresApi.listar(), talleresApi.listar()]);

      const profTalleresMap: Record<number, string[]> = {};
      talleresData.forEach((t) => {
        if (!t.profesores || !Array.isArray(t.profesores)) return;
        t.profesores.forEach((p) => {
          const pid = Number(p.id);
          if (!profTalleresMap[pid]) profTalleresMap[pid] = [];
          profTalleresMap[pid].push(t.nombre);
        });
      });

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

  const renderProfesor = ({ item }: { item: Profesor }) => {
    const talleres = (item as any).talleres || [];
    const email = (item as any).email || (item as any).profesor_email || '-';
    const telefono = item.telefono || '-';
    
    return (
      <View style={[styles.card, isMobile ? styles.cardMobile : styles.cardWeb]}>
        {/* Header con nombre y especialidad */}
        <View style={styles.cardHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.profesorName}>{item.nombre}</Text>
            {item.especialidad && (
              <View style={styles.especialidadBadge}>
                <Text style={styles.especialidadText}>{item.especialidad}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Grid de información */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{telefono}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Talleres</Text>
            <Text style={styles.infoValue}>
              {talleres.length > 0 ? `${talleres.length} asignado${talleres.length > 1 ? 's' : ''}` : 'Sin asignar'}
            </Text>
          </View>
        </View>

        {/* Lista de talleres si existen */}
        {talleres.length > 0 && (
          <View style={styles.talleresSection}>
            <Text style={styles.talleresSectionTitle}>Talleres asignados:</Text>
            <View style={styles.talleresChips}>
              {talleres.slice(0, 3).map((taller: string, index: number) => (
                <View key={index} style={styles.tallerChip}>
                  <Text style={styles.tallerChipText} numberOfLines={1}>{taller}</Text>
                </View>
              ))}
              {talleres.length > 3 && (
                <View style={[styles.tallerChip, styles.tallerChipMore]}>
                  <Text style={styles.tallerChipText}>+{talleres.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => abrirModalEditar(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color="#64748B" />
            <Text style={styles.quickActionText}>Editar</Text>
          </TouchableOpacity>
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => eliminarProfesor(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredProfesores = profesores.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.especialidad && p.especialidad.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayedProfesores = React.useMemo(() => {
    const arr = [...filteredProfesores];
    if (!sortBy) return arr;

    arr.sort((a: Profesor, b: Profesor) => {
      let va: any = '';
      let vb: any = '';
      switch (sortBy) {
        case 'nombre':
          va = (a.nombre || '').toLowerCase();
          vb = (b.nombre || '').toLowerCase();
          break;
        case 'especialidad':
          va = (a.especialidad || '').toLowerCase();
          vb = (b.especialidad || '').toLowerCase();
          break;
        case 'email':
          va = ((a as any).email || '').toLowerCase();
          vb = ((b as any).email || '').toLowerCase();
          break;
        case 'telefono':
          va = (a.telefono || '').toLowerCase();
          vb = (b.telefono || '').toLowerCase();
          break;
        case 'talleres':
          va = (((a as any).talleres || []).join(', ') || '').toLowerCase();
          vb = (((b as any).talleres || []).join(', ') || '').toLowerCase();
          break;
        default:
          va = (a.nombre || '').toLowerCase();
          vb = (b.nombre || '').toLowerCase();
      }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filteredProfesores, sortBy, sortDir]);

  const renderProfesoresTable = () => (
    <View style={[styles.table, isWeb && styles.tableWeb]}>
      <View style={[styles.tableHeader, isWeb && styles.tableHeaderWeb]}>
        <TouchableOpacity
          style={[styles.tableCellNombre, isWeb && styles.tableCellNombreWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('nombre')}
        >
          <Text style={styles.tableHeaderButtonText}>Profesor</Text>
          <Ionicons
            name={sortBy === 'nombre' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'nombre' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellEspecialidad, isWeb && styles.tableCellEspecialidadWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('especialidad')}
        >
          <Text style={styles.tableHeaderButtonText}>Especialidad</Text>
          <Ionicons
            name={sortBy === 'especialidad' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'especialidad' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellEmail, styles.tableCellCenter, isWeb && styles.tableCellEmailWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('email')}
        >
          <Text style={styles.tableHeaderButtonText}>Email</Text>
          <Ionicons
            name={sortBy === 'email' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'email' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellTelefono, styles.tableCellCenter, isWeb && styles.tableCellTelefonoWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('telefono')}
        >
          <Text style={styles.tableHeaderButtonText}>Teléfono</Text>
          <Ionicons
            name={sortBy === 'telefono' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'telefono' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellTalleres, isWeb && styles.tableCellTalleresWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('talleres')}
        >
          <Text style={styles.tableHeaderButtonText}>Talleres</Text>
          <Ionicons
            name={sortBy === 'talleres' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'talleres' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <View style={[styles.tableCellAcciones, styles.tableCellCenter, isWeb && styles.tableCellAccionesWeb]}>
          <Text style={styles.tableHeaderText}>Acciones</Text>
        </View>
      </View>

      {displayedProfesores.map((item, index) => (
        <View key={item.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven, isWeb && styles.tableRowWeb]}>
          <View style={[styles.tableCellNombre, isWeb && styles.tableCellNombreWeb]}>
            <Text style={styles.tableCellText} numberOfLines={2}>{item.nombre}</Text>
          </View>

          <View style={[styles.tableCellEspecialidad, isWeb && styles.tableCellEspecialidadWeb]}>
            <Text style={styles.tableCellText}>{item.especialidad || '-'}</Text>
          </View>

          <View style={[styles.tableCellEmail, styles.tableCellCenter, isWeb && styles.tableCellEmailWeb]}>
            <Text style={styles.tableCellText} numberOfLines={1}>{(item as any).email || '-'}</Text>
          </View>

          <View style={[styles.tableCellTelefono, styles.tableCellCenter, isWeb && styles.tableCellTelefonoWeb]}>
            <Text style={styles.tableCellText}>{item.telefono || '-'}</Text>
          </View>

          <View style={[styles.tableCellTalleres, isWeb && styles.tableCellTalleresWeb]}>
            <Text style={styles.tableCellText} numberOfLines={2}>{((item as any).talleres || []).slice(0, 3).join(', ') || '-'}</Text>
          </View>

          <View style={[styles.tableCellAcciones, styles.tableCellActions, isWeb && styles.tableCellAccionesWeb]}>
            <TouchableOpacity
              style={styles.tableActionButton}
              onPress={() => Alert.alert(
                item.nombre,
                `Email: ${(item as any).email || '-'}\nTel: ${item.telefono || '-'}\nTalleres: ${(item as any).talleres && (item as any).talleres.length ? (item as any).talleres.join(', ') : '-'}`
              )}
            >
              <Ionicons name="information-circle" size={16} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableActionButton, { marginLeft: 8 }]}
              onPress={() => abrirModalEditar(item)}
            >
              <Ionicons name="create-outline" size={16} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tableActionButton, { marginLeft: 8 }]}
              onPress={() => eliminarProfesor(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

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

              {!loading && profesores.length > 0 && (
                viewMode === 'cards' ? (
                  <FlatList
                    data={filteredProfesores}
                    renderItem={renderProfesor}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={isMobile ? 1 : 2}
                    key={isMobile ? 'list' : 'grid'}
                    columnWrapperStyle={isMobile ? undefined : styles.gridRow}
                    contentContainerStyle={styles.listContent}
                    scrollEnabled={false}
                  />
                ) : (
                  <ScrollView style={styles.tableContainer} contentContainerStyle={styles.tableScrollContent} nestedScrollEnabled>
                    {isWeb ? (
                      renderProfesoresTable()
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={[styles.tableHorizontalContent, styles.tableHorizontalMinWidth]}>
                        {renderProfesoresTable()}
                      </ScrollView>
                    )}
                  </ScrollView>
                )
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

            {!loading && profesores.length > 0 && (
              <FlatList
                data={filteredProfesores}
                renderItem={renderProfesor}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
              />
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

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 16,
  },

  // Card minimalista
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardWeb: {
    flex: 1,
    maxWidth: '48.5%',
  },
  cardMobile: {
    width: '100%',
  },

  // Header limpio
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    gap: 8,
  },
  profesorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },
  especialidadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  especialidadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Info Grid
  infoGrid: {
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 70,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },

  // Sección de talleres
  talleresSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  talleresSectionTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  talleresChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tallerChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    maxWidth: '100%',
  },
  tallerChipMore: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  tallerChipText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Acciones rápidas
  quickActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFBFC',
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
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  // Table View styles
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tableScrollContent: {
    paddingBottom: 16,
  },
  tableHorizontalContent: {
    paddingBottom: 8,
  },
  tableHorizontalMinWidth: {
    minWidth: 900,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    overflow: 'hidden',
  },
  tableWeb: {
    width: '100%'
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
    width: '100%'
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  tableRowWeb: {
    width: '100%'
  },
  tableRowEven: {
    backgroundColor: '#FAFBFC'
  },
  tableCellNombre: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 200,
  },
  tableCellNombreWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellEspecialidad: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 140,
  },
  tableCellEspecialidadWeb: {
    flex: 1.5,
    minWidth: 0,
  },
  tableCellEmail: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 160,
  },
  tableCellEmailWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellTelefono: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 120,
  },
  tableCellTelefonoWeb: {
    flex: 1,
    minWidth: 0,
  },
  tableCellTalleres: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 180,
  },
  tableCellTalleresWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellAcciones: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 140,
  },
  tableCellAccionesWeb: {
    flex: 1.5,
    minWidth: 0,
  },
  tableCellCenter: {
    alignItems: 'center',
  },
  tableCellActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tableCellText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  tableActionButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
});

export default ProfesoresScreen;
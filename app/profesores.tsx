import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profesoresApi } from '../src/api/profesores';
import { talleresApi } from '../src/api/talleres';
import { Profesor } from '../src/types';
import { Input } from '../src/components/Input';
import { EmptyState } from '../src/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import HeaderWithSearch from '../src/components/HeaderWithSearch';
import Modal from '../src/components/Modal'; // Usando ElegantModal
import { useResponsive } from '../src/hooks/useResponsive';
import { useToast } from '../src/contexts/ToastContext';


// Extender el tipo Profesor para incluir los talleres asociados (traídos manualmente)
interface ProfesorEnriquecido extends Profesor {
    talleres?: string[];
}

const ProfesoresScreen = () => {
  const [profesores, setProfesores] = useState<ProfesorEnriquecido[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfesor, setCurrentProfesor] = useState<Profesor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    contrasena: '',
  });

  const { isWeb, isMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const { showToast } = useToast();

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const cargarProfesores = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar profesores y talleres en paralelo
      const [profesData, talleresData] = await Promise.all([profesoresApi.listar(), talleresApi.listar()]);

      // Mapear talleres a cada profesor
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

      setProfesores(merged as ProfesorEnriquecido[]);
    } catch {
      showToast('Error cargando profesores', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarProfesores();
  }, [cargarProfesores]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarProfesores();
    setRefreshing(false);
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
      showToast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (!isEditing && !formData.contrasena) {
      showToast('La contraseña es obligatoria para crear un profesor', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && currentProfesor) {
        await profesoresApi.actualizar({
          id: currentProfesor.id,
          nombre: formData.nombre,
          especialidad: formData.especialidad,
          email: formData.email,
        } as Profesor);
        showToast('Profesor actualizado correctamente', 'success');
      } else {
        await profesoresApi.crear(formData as any);
        showToast('Profesor creado correctamente', 'success');
      }
      setModalVisible(false);
      cargarProfesores();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminarProfesor = (profesor: ProfesorEnriquecido) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${profesor.nombre}? Esta acción es irreversible y desvinculará sus talleres.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await profesoresApi.eliminar(profesor.id);
              showToast('Profesor eliminado correctamente', 'success');
              cargarProfesores();
            } catch (error: any) {
              showToast(error.message, 'error');
            }
          },
        },
      ]
    );
  };

  const filteredProfesores = profesores.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.especialidad && p.especialidad.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.talleres && p.talleres.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const displayedProfesores = useMemo(() => {
    const arr = [...filteredProfesores];
    if (!sortBy) return arr;

    arr.sort((a, b) => {
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
          va = (a.email || '').toLowerCase();
          vb = (b.email || '').toLowerCase();
          break;
        case 'telefono':
          va = (a.telefono || '').toLowerCase();
          vb = (b.telefono || '').toLowerCase();
          break;
        case 'talleres':
          va = (a.talleres || []).length;
          vb = (b.talleres || []).length;
          break;
        default:
          va = (a.nombre || '').toLowerCase();
          vb = (b.nombre || '').toLowerCase();
      }

      if (typeof va === 'string' && typeof vb === 'string') {
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
      } else if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return 0;
    });

    return arr;
  }, [filteredProfesores, sortBy, sortDir]);

  const renderProfesorCard = ({ item }: { item: ProfesorEnriquecido }) => {
    const talleres = item.talleres || [];
    const email = item.email || '-';
    const telefono = item.telefono || '-';
    
    return (
      <View style={[styles.card, isMobile ? styles.cardMobile : styles.cardWeb]}>
        {/* Header con título */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nombre}
          </Text>
          
          {/* Badge de especialidad */}
          {item.especialidad && (
            <View style={styles.especialidadBadge}>
              <Text style={styles.especialidadText}>{item.especialidad}</Text>
            </View>
          )}
        </View>

        {/* Información principal - Grid simple */}
        <View style={styles.infoGrid}>
          {/* Email */}
          {email !== '-' && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {email}
              </Text>
            </View>
          )}

          {/* Teléfono */}
          {telefono !== '-' && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {telefono}
              </Text>
            </View>
          )}

          {/* Talleres */}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Talleres</Text>
            <Text style={[styles.infoValue, styles.cuposValue]}>
              {talleres.length > 0 ? (
                `${talleres.length} asignado${talleres.length !== 1 ? 's' : ''}`
              ) : (
                'Sin asignar'
              )}
            </Text>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={(e) => {
              e.stopPropagation();
              abrirModalEditar(item);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color="#64748B" />
            <Text style={styles.quickActionText}>Editar</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={(e) => {
              e.stopPropagation();
              eliminarProfesor(item);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProfesoresTableRow = ({ item, index }: { item: ProfesorEnriquecido; index: number }) => (
    <View 
      key={item.id} 
      style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven, isWeb && styles.tableWeb]}
    >
      <View style={[styles.tableCellNombre, isWeb && styles.tableCellNombreWeb]}>
        <Text style={styles.tableCellText} numberOfLines={2}>{item.nombre}</Text>
        {item.especialidad && (
             <Text style={[styles.tableCellText, styles.tableSubText]} numberOfLines={1}>
                {item.especialidad}
             </Text>
        )}
      </View>

      <View style={[styles.tableCellEmail, isWeb && styles.tableCellEmailWeb]}>
        <Text style={styles.tableCellText} numberOfLines={1}>{item.email || '-'}</Text>
      </View>

      <View style={[styles.tableCellTelefono, styles.tableCellCenter, isWeb && styles.tableCellTelefonoWeb]}>
        <Text style={styles.tableCellText}>{item.telefono || '-'}</Text>
      </View>

      <View style={[styles.tableCellTalleres, styles.tableCellCenter, isWeb && styles.tableCellTalleresWeb]}>
        <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>{item.talleres?.length || 0}</Text>
        </View>
      </View>

      <View style={[styles.tableCellAcciones, styles.tableCellActions, isWeb && styles.tableCellAccionesWeb]}>
        <TouchableOpacity
          style={styles.tableActionButton}
          onPress={() => abrirModalEditar(item)}
        >
          <Ionicons name="create-outline" size={18} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableActionButton]}
          onPress={() => eliminarProfesor(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfesoresTable = () => (
    <View style={[styles.table, isWeb && styles.tableWeb]}>
      <View style={[styles.tableHeader, isWeb && styles.tableHeader]}>
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
          style={[styles.tableCellEmail, isWeb && styles.tableCellEmailWeb, styles.tableHeaderButton]}
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
          style={[styles.tableCellTalleres, styles.tableCellCenter, isWeb && styles.tableCellTalleresWeb, styles.tableHeaderButton]}
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
          <Text style={styles.tableHeaderButtonText}>Acciones</Text>
        </View>
      </View>

      {displayedProfesores.map((item, index) => (
        <React.Fragment key={item.id}>
          {renderProfesoresTableRow({ item, index })}
        </React.Fragment>
      ))}
    </View>
  );

  const Container: any = isWeb ? View : SafeAreaView;

  return (
      <Container style={styles.container} edges={isWeb ? undefined : ['bottom']}>
        <View style={{ flex: 1 }}>
          <HeaderWithSearch
            title="Profesores"
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onAdd={abrirModalCrear}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              if (mode === 'cards' || mode === 'table') {
                setViewMode(mode);
              }
            }}
          />
          
          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
            }
          >
            <View style={{ flex: 1 }}>
              {loading && !refreshing && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              )}

              {!loading && profesores.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <EmptyState message="No hay profesores registrados" icon={<Ionicons name="people-outline" size={48} color="#94A3B8" />} />
                </View>
              )}

              {!loading && profesores.length > 0 && (
                viewMode === 'cards' ? (
                  <FlatList
                    data={displayedProfesores}
                    renderItem={renderProfesorCard}
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
        </View>

        {/* Modal - Usando el ElegantModal */}
        <Modal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={isEditing ? 'Editar Profesor' : 'Nuevo Profesor'}
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
                onPress={guardarProfesor}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#64748B" />
                ) : (
                  <Text style={styles.modalFooterButtonText}>
                    {isEditing ? 'Actualizar' : 'Crear'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        >
          <View style={styles.modalIntro}>
            <Text style={styles.modalIntroText}>
              {isEditing
                ? 'Modifica la información del profesor. Los cambios se aplicarán inmediatamente.'
                : 'Registra un nuevo profesor en el sistema. El profesor podrá acceder con su email y contraseña.'
              }
            </Text>
          </View>

          <Input
            label="Nombre Completo"
            required
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Ej: María González, Juan Carlos Rodríguez"
            maxLength={100}
          />

          <Input
            label="Especialidad"
            required
            value={formData.especialidad}
            onChangeText={(text) => setFormData({ ...formData, especialidad: text })}
            placeholder="Ej: Educación Física, Danza Moderna, Natación, Fútbol"
            maxLength={50}
          />

          <Input
            label="Correo Electrónico"
            required
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="profesor@municipalidad.cl"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
          />

          {!isEditing && (
            <>
              <Input
                label="Contraseña de Acceso"
                required
                value={formData.contrasena}
                onChangeText={(text) => setFormData({ ...formData, contrasena: text })}
                placeholder="Mínimo 8 caracteres, incluir números y letras"
                secureTextEntry
                maxLength={50}
              />
              <View style={styles.passwordHelper}>
                <Text style={styles.passwordHelperText}>
                  🔒 La contraseña debe tener al menos 8 caracteres e incluir números y letras mayúsculas/minúsculas.
                </Text>
              </View>
            </>
          )}

          {isEditing && (
            <View style={styles.editNote}>
              <Text style={styles.editNoteText}>
                📝 Para cambiar la contraseña, contacta al administrador del sistema.
              </Text>
            </View>
          )}
        </Modal>
      </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
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
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 16,
  },

  // Cards View - Diseño Minimalista
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

  // Header minimalista
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
    flex: 1,
    marginRight: 8,
  },
  especialidadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#DBEAFE',
  },
  especialidadText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // Info Grid - Diseño limpio y organizado
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
  cuposValue: {
    fontWeight: '600',
    color: '#111827',
  },

  // Acciones rápidas - Barra inferior limpia
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
  
  // Table View (mantiene el diseño original)
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
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 60,
  },
  tableRowEven: {
    backgroundColor: '#FAFBFC',
  },
  tableCellNombre: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 160,
  },
  tableCellNombreWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableSubText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  tableCellEmail: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 180,
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
    minWidth: 150,
  },
  tableCellTalleresWeb: {
    flex: 1.5,
    minWidth: 0,
  },
  tableCellAcciones: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 100,
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
    gap: 6,
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
  tableCellText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  tableActionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  tableBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  tableBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Modal footer buttons - estilo quick actions
  modalFooterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  modalFooterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  footerDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },

  // Modal content improvements
  modalIntro: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIntroText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  passwordHelper: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  passwordHelperText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  editNote: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  editNoteText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 16,
  },
});

export default ProfesoresScreen;
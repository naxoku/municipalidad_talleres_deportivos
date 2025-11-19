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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { talleresApi } from '../src/api/talleres';
import { horariosApi } from '../src/api/horarios';
import { profesoresApi } from '../src/api/profesores';
import { inscripcionesApi } from '../src/api/inscripciones';
import { Taller, Profesor, Horario } from '../src/types';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { Badge } from '../src/components/Badge';
import { useResponsive } from '../src/hooks/useResponsive';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/contexts/ToastContext';
import { colors, spacing, typography, borderRadius } from '../src/theme/colors';
import { sharedStyles } from '../src/theme/sharedStyles';
import Modal from '../src/components/Modal';
import { formatTimeHHMM } from '../src/utils/time';
import HeaderWithSearch from '../src/components/HeaderWithSearch';

interface TallerEnriquecido extends Taller {
  horario?: string;
  total_Alumnos?: number;
  cupos_maximos?: number;
  asistencia_promedio?: number;
}

const TalleresScreen = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [talleres, setTalleres] = useState<TallerEnriquecido[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaller, setCurrentTaller] = useState<Taller | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    profesorIds: [] as number[],
  });
  const [loadingGuardar, setLoadingGuardar] = useState(false);

  const { isWeb, isMobile } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const { showToast } = useToast();

  useEffect(() => {
    cargarTalleres();
    cargarProfesores();
  }, []);

  const cargarTalleres = async () => {
    setLoading(true);
    try {
      const [talleresData, horariosData] = await Promise.all([
        talleresApi.listar(),
        horariosApi.listar(),
      ]);

      const horarioMap: Record<number, Horario[]> = {};
      horariosData.forEach((h) => {
        if (!h.taller_id) return;
        const tid = Number(h.taller_id);
        if (!horarioMap[tid]) horarioMap[tid] = [];
        horarioMap[tid].push(h);
      });

      const enriched = await Promise.all(
        talleresData.map(async (t) => {
          const hs = horarioMap[t.id] || [];
          const horarioStr = hs.length
            ? hs
                .map((h) => `${h.dia_semana} ${formatTimeHHMM(h.hora_inicio)}-${formatTimeHHMM(h.hora_fin)}`)
                .join(', ')
            : '';

          let total_Alumnos = 0;
          try {
            const inscripciones = await inscripcionesApi.listar();
            total_Alumnos = inscripciones.filter((i) => i.taller_id === t.id).length;
          } catch (e) {
            console.error('Error loading inscriptions:', e);
          }

          return {
            ...t,
            horario: horarioStr,
            total_Alumnos,
            cupos_maximos: 30,
            asistencia_promedio: Math.floor(Math.random() * 30) + 70,
          };
        })
      );

      setTalleres(enriched);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarProfesores = async () => {
    try {
      const data = await profesoresApi.listar();
      setProfesores(data);
    } catch (error: any) {
      console.error('Error cargando profesores:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarTalleres();
    setRefreshing(false);
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentTaller(null);
    setFormData({ nombre: '', descripcion: '', profesorIds: [] });
    setModalVisible(true);
  };

  const abrirModalEditar = (taller: Taller) => {
    setIsEditing(true);
    setCurrentTaller(taller);
    setFormData({
      nombre: taller.nombre,
      descripcion: taller.descripcion || '',
      profesorIds: taller.profesores?.map((p) => p.id) || [],
    });
    setModalVisible(true);
  };

  const guardarTaller = async () => {
    if (!formData.nombre) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    setLoadingGuardar(true);
    try {
      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
      };

      if (isEditing && currentTaller) {
        await talleresApi.actualizar({ id: currentTaller.id, ...data } as Taller);
        showToast('Taller actualizado correctamente', 'success');
      } else {
        await talleresApi.crear(data);
        showToast('Taller creado correctamente', 'success');
      }
      setModalVisible(false);
      cargarTalleres();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoadingGuardar(false);
    }
  };

  const eliminarTaller = (taller: Taller) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar el taller "${taller.nombre}"?\n\n⚠️ Esto eliminará:\n• Todas las clases asociadas\n• Las inscripciones de Alumnos\n• El historial de asistencia`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await talleresApi.eliminar(taller.id);
              showToast('Taller eliminado correctamente', 'success');
              cargarTalleres();
            } catch (error: any) {
              showToast(error.message, 'error');
            }
          },
        },
      ]
    );
  };

  const getOccupancyStatus = (total: number, max: number): 'low' | 'medium' | 'high' | 'full' => {
    const percentage = (total / max) * 100;
    if (percentage >= 100) return 'full';
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  const renderTaller = ({ item }: { item: TallerEnriquecido }) => {
    const occupancyStatus = getOccupancyStatus(item.total_Alumnos || 0, item.cupos_maximos || 30);
    const occupancyPercentage = Math.round(((item.total_Alumnos || 0) / (item.cupos_maximos || 30)) * 100);

    return (
      <TouchableOpacity 
        style={[styles.card, isMobile ? styles.cardMobile : styles.cardWeb]}
        activeOpacity={0.95}
        onPress={() => router.push(`/alumnos?tallerId=${item.id}`)}
      >
        {/* Header con título */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nombre}
          </Text>
          
          {/* Status badge minimalista */}
          {occupancyStatus === 'full' && (
            <View style={[styles.statusBadge, styles.statusFull]}>
              <Text style={styles.statusText}>Completo</Text>
            </View>
          )}
          {occupancyStatus === 'high' && (
            <View style={[styles.statusBadge, styles.statusHigh]}>
              <Text style={styles.statusText}>Alta demanda</Text>
            </View>
          )}
        </View>

        {/* Información principal - Grid simple */}
        <View style={styles.infoGrid}>
          {/* Profesor */}
          {item.profesores && item.profesores.length > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Profesor</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.profesores.map((p: any) => p.nombre).join(', ')}
              </Text>
            </View>
          )}

          {/* Horario */}
          {item.horario && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Horario</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.horario.split(', ')[0]}
                {item.horario.split(', ').length > 1 && ` +${item.horario.split(', ').length - 1}`}
              </Text>
            </View>
          )}

          {/* Cupos */}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cupos</Text>
            <Text style={[styles.infoValue, styles.cuposValue]}>
              {item.total_Alumnos || 0}/{item.cupos_maximos || 30}
              <Text style={styles.percentageText}> ({occupancyPercentage}%)</Text>
            </Text>
          </View>

          {/* Ubicación */}
          {item.ubicacion && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.ubicacion}
              </Text>
            </View>
          )}
        </View>

        {/* Acciones rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={(e) => {
              e.stopPropagation();
              // Mostrar un modal rápido con detalles del taller
              Alert.alert(
                item.nombre,
                `${item.descripcion || 'Sin descripción'}\n\nProfesor(es): ${item.profesores && item.profesores.length > 0 ? item.profesores.map((p: any) => p.nombre).join(', ') : '—'}\nHorario: ${item.horario || '—'}\nUbicación: ${item.ubicacion || '—'}\nCupos: ${item.total_Alumnos || 0}/${item.cupos_maximos || 30}\nAsistencia: ${item.asistencia_promedio || 0}%`,
                [
                  { text: 'Cerrar', style: 'cancel' },
                  { text: 'Ver clases', onPress: () => router.push(`/clases?tallerId=${item.id}`) },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={18} color="#64748B" />
            <Text style={styles.quickActionText}>Detalles</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/clases?tallerId=${item.id}`);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color="#64748B" />
            <Text style={styles.quickActionText}>Clases</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/alumnos?tallerId=${item.id}`);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={18} color="#64748B" />
            <Text style={styles.quickActionText}>Alumnos</Text>
          </TouchableOpacity>

          {isAdmin && (
            <>
              <View style={styles.actionDivider} />
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
                  eliminarTaller(item);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Eliminar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTableRow = ({ item, index }: { item: TallerEnriquecido; index: number }) => {
    const asistenciaPromedio = item.asistencia_promedio || 0;
    const isFull = (item.total_Alumnos || 0) >= (item.cupos_maximos || 30);

    return (
      <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven, isWeb && styles.tableRowWeb]}>
        <View style={[styles.tableCellTaller, isWeb && styles.tableCellTallerWeb]}>
          <Text style={styles.tableCellText} numberOfLines={2}>{item.nombre}</Text>
          {isFull && (
            <View style={[styles.miniChip, { backgroundColor: '#FEF2F2', marginTop: 4 }]}>
              <Ionicons name="flame" size={10} color="#EF4444" />
              <Text style={[styles.miniChipText, { fontSize: 10, color: '#EF4444' }]}>Lleno</Text>
            </View>
          )}
        </View>
        
        <View style={[styles.tableCellProfesor, isWeb && styles.tableCellProfesorWeb]}>
          <Text style={styles.tableCellText} numberOfLines={2}>
            {item.profesores && item.profesores.length > 0 
              ? item.profesores.map((p: any) => p.nombre).join(', ')
              : '-'}
          </Text>
        </View>

        <View style={[styles.tableCellCupos, styles.tableCellCenter, isWeb && styles.tableCellCuposWeb]}>
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>{item.total_Alumnos || 0}/{item.cupos_maximos || 30}</Text>
          </View>
        </View>

        <View style={[styles.tableCellAsistencia, styles.tableCellCenter, isWeb && styles.tableCellAsistenciaWeb]}>
          <View style={[styles.tableBadge, { 
            backgroundColor: asistenciaPromedio >= 90 ? '#F0FDF4' : 
                           asistenciaPromedio >= 70 ? '#FEF3C7' : '#FEF2F2'
          }]}>
            <Text style={[styles.tableBadgeText, { 
              color: asistenciaPromedio >= 90 ? '#10B981' : 
                     asistenciaPromedio >= 70 ? '#F59E0B' : '#EF4444'
            }]}>
              {asistenciaPromedio}%
            </Text>
          </View>
        </View>

        <View style={[styles.tableCellHorario, styles.tableCellCenter, isWeb && styles.tableCellHorarioWeb]}>
          <Text style={[styles.tableCellText, { fontSize: 12 }]} numberOfLines={2}>
            {item.horario ? item.horario.split(', ')[0] : '-'}
            {item.horario && item.horario.split(', ').length > 1 && (
              <Text style={{ color: '#94A3B8' }}> +{item.horario.split(', ').length - 1}</Text>
            )}
          </Text>
        </View>

        <View style={[styles.tableCellAcciones, styles.tableCellActions, isWeb && styles.tableCellAccionesWeb]}>
          <TouchableOpacity
            style={styles.tableActionButton}
            onPress={() => Alert.alert(
              item.nombre,
              `${item.descripcion || 'Sin descripción'}\n\nProfesor(es): ${item.profesores && item.profesores.length > 0 ? item.profesores.map((p: any) => p.nombre).join(', ') : '—'}\nHorario: ${item.horario || '—'}\nUbicación: ${item.ubicacion || '—'}\nCupos: ${item.total_Alumnos || 0}/${item.cupos_maximos || 30}\nAsistencia: ${item.asistencia_promedio || 0}%`
            )}
          >
            <Ionicons name="information-circle" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tableActionButton, { marginLeft: 8 }]}
            onPress={() => router.push(`/clases?tallerId=${item.id}`)}
          >
            <Ionicons name="calendar" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tableActionButton, { marginLeft: 8 }]}
            onPress={() => router.push(`/alumnos?tallerId=${item.id}`)}
          >
            <Ionicons name="people" size={18} color="#3B82F6" />
          </TouchableOpacity>
          {isAdmin && (
            <>
              <TouchableOpacity
                style={styles.tableActionButton}
                onPress={() => abrirModalEditar(item)}
              >
                <Ionicons name="create-outline" size={18} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tableActionButton}
                onPress={() => eliminarTaller(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const filteredTalleres = talleres.filter((t) =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const displayedTalleres = React.useMemo(() => {
    const arr = [...filteredTalleres];
    if (!sortBy) return arr;

    arr.sort((a: TallerEnriquecido, b: TallerEnriquecido) => {
      let va: any = null;
      let vb: any = null;
      switch (sortBy) {
        case 'nombre':
          va = (a.nombre || '').toLowerCase();
          vb = (b.nombre || '').toLowerCase();
          break;
        case 'profesores':
          va = (a.profesores && a.profesores.map((p: any) => p.nombre).join(', ')) || '';
          vb = (b.profesores && b.profesores.map((p: any) => p.nombre).join(', ')) || '';
          va = va.toLowerCase();
          vb = vb.toLowerCase();
          break;
        case 'cupos':
          va = a.total_Alumnos || 0;
          vb = b.total_Alumnos || 0;
          break;
        case 'asistencia':
          va = a.asistencia_promedio || 0;
          vb = b.asistencia_promedio || 0;
          break;
        case 'horario':
          va = (a.horario || '').toLowerCase();
          vb = (b.horario || '').toLowerCase();
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
  }, [filteredTalleres, sortBy, sortDir]);

  const renderTableContent = () => (
    <View style={[styles.table, isWeb && styles.tableWeb]}>
      <View style={[styles.tableHeader, isWeb && styles.tableHeaderWeb]}>
        <TouchableOpacity
          style={[styles.tableCellTaller, isWeb && styles.tableCellTallerWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('nombre')}
        >
          <Text style={styles.tableHeaderButtonText}>Taller</Text>
          <Ionicons
            name={sortBy === 'nombre' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'nombre' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellProfesor, isWeb && styles.tableCellProfesorWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('profesores')}
        >
          <Text style={styles.tableHeaderButtonText}>Profesor(es)</Text>
          <Ionicons
            name={sortBy === 'profesores' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'profesores' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellCupos, styles.tableCellCenter, isWeb && styles.tableCellCuposWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('cupos')}
        >
          <Text style={styles.tableHeaderButtonText}>Cupos</Text>
          <Ionicons
            name={sortBy === 'cupos' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'cupos' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellAsistencia, styles.tableCellCenter, isWeb && styles.tableCellAsistenciaWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('asistencia')}
        >
          <Text style={styles.tableHeaderButtonText}>Asistencia</Text>
          <Ionicons
            name={sortBy === 'asistencia' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'asistencia' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellHorario, styles.tableCellCenter, isWeb && styles.tableCellHorarioWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('horario')}
        >
          <Text style={styles.tableHeaderButtonText}>Horario</Text>
          <Ionicons
            name={sortBy === 'horario' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'horario' ? '#3B82F6' : '#94A3B8'}
          />
        </TouchableOpacity>

        <View style={[styles.tableCellAcciones, styles.tableCellCenter, isWeb && styles.tableCellAccionesWeb]}>
          <Text style={styles.tableHeaderText}>Acciones</Text>
        </View>
      </View>

      {displayedTalleres.map((item, index) => (
        <React.Fragment key={item.id}>
          {renderTableRow({ item, index })}
        </React.Fragment>
      ))}
    </View>
  );

  const Container: any = SafeAreaView;

  return (
      <Container style={styles.container} edges={['bottom']}>
        <View style={{ flex: 1 }}>
          <HeaderWithSearch 
            title={isAdmin ? 'Talleres' : 'Mis talleres'}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onAdd={isAdmin ? abrirModalCrear : undefined}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {loading && !refreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          )}

          {!loading && talleres.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                message="No hay talleres registrados"
                icon={<Ionicons name="book" size={48} color="#94A3B8" />}
              />
            </View>
          )}

          {!loading && talleres.length > 0 && viewMode === 'cards' && (
            <FlatList
              data={filteredTalleres}
              renderItem={renderTaller}
              keyExtractor={(item) => item.id.toString()}
              numColumns={isMobile ? 1 : 2}
              key={isMobile ? 'list' : 'grid'}
              columnWrapperStyle={isMobile ? undefined : styles.gridRow}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          )}

          {!loading && talleres.length > 0 && viewMode === 'table' && (
            <ScrollView
              style={styles.tableContainer}
              contentContainerStyle={styles.tableScrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              nestedScrollEnabled={true}
            >
              {isWeb ? (
                renderTableContent()
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={[styles.tableHorizontalContent, styles.tableHorizontalMinWidth]}
                  nestedScrollEnabled={true}
                  directionalLockEnabled={true}
                >
                  {renderTableContent()}
                </ScrollView>
              )}
            </ScrollView>
          )}
        </View>

        {/* Modal */}
        <Modal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={isEditing ? 'Editar Taller' : 'Nuevo Taller'}
          maxWidth={isWeb ? 600 : undefined}
          dismissOnBackdropPress={true}
          footer={(
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalFooterButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={guardarTaller}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
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
          <Input
            label="Nombre"
            required
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            placeholder="Nombre del taller"
          />

          <Input
            label="Descripción"
            value={formData.descripcion}
            onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
            placeholder="Descripción del taller"
            multiline
            numberOfLines={3}
          />

          <View style={sharedStyles.inputContainer}>
            <Text style={sharedStyles.label}>Profesores Asignados</Text>
            <ScrollView style={sharedStyles.pickerScroll} showsVerticalScrollIndicator={false}>
              {profesores.map((profesor) => (
                <TouchableOpacity
                  key={profesor.id}
                  style={[
                    sharedStyles.pickerItem,
                    formData.profesorIds.includes(profesor.id) && sharedStyles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    const newIds = formData.profesorIds.includes(profesor.id)
                      ? formData.profesorIds.filter((id) => id !== profesor.id)
                      : [...formData.profesorIds, profesor.id];
                    setFormData({ ...formData, profesorIds: newIds });
                  }}
                >
                  <Text style={sharedStyles.pickerItemText}>
                    {formData.profesorIds.includes(profesor.id) ? '✓ ' : '○ '}
                    {profesor.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  // Cards View - Diseño Minimalista
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 16,
  },
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusFull: {
    backgroundColor: '#FEE2E2',
  },
  statusHigh: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
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
  percentageText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
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
  tableHeaderWeb: {
    width: '100%',
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
    minHeight: 60,
  },
  tableRowWeb: {
    width: '100%',
  },
  tableRowEven: {
    backgroundColor: '#FAFBFC',
  },
  tableCellTaller: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 200,
  },
  tableCellTallerWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellProfesor: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 180,
  },
  tableCellProfesorWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellCupos: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 120,
  },
  tableCellCuposWeb: {
    flex: 1,
    minWidth: 0,
  },
  tableCellAsistencia: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 100,
  },
  tableCellAsistenciaWeb: {
    flex: 1,
    minWidth: 0,
  },
  tableCellHorario: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 160,
  },
  tableCellHorarioWeb: {
    flex: 1.5,
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
});

export default TalleresScreen;

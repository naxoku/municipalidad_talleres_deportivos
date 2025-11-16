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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { talleresApi } from '../api/talleres';
import { horariosApi } from '../api/horarios';
import { profesoresApi } from '../api/profesores';
import { inscripcionesApi } from '../api/inscripciones';
import { Taller, Profesor, Horario } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import SearchBar from '../components/SearchBar';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius, shadows } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';
import { formatTimeHHMM } from '../utils/time';

interface TallerEnriquecido extends Taller {
  horario?: string;
  total_estudiantes?: number;
  cupos_maximos?: number;
  asistencia_promedio?: number;
}

const TalleresEnhancedScreen = ({ navigation }: any) => {
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

  const { isWeb, isMobile } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

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

      // Build horarios map
      const horarioMap: Record<number, Horario[]> = {};
      horariosData.forEach((h) => {
        if (!h.taller_id) return;
        const tid = Number(h.taller_id);
        if (!horarioMap[tid]) horarioMap[tid] = [];
        horarioMap[tid].push(h);
      });

      // Enrich talleres with additional data
      const enriched = await Promise.all(
        talleresData.map(async (t) => {
          const hs = horarioMap[t.id] || [];
          const horarioStr = hs.length
            ? hs
                .map((h) => `${h.dia_semana} ${formatTimeHHMM(h.hora_inicio)}-${formatTimeHHMM(h.hora_fin)}`)
                .join(', ')
            : '';

          // Get enrollment count
          let total_estudiantes = 0;
          try {
            const inscripciones = await inscripcionesApi.listar();
            total_estudiantes = inscripciones.filter((i) => i.taller_id === t.id).length;
          } catch (e) {
            console.error('Error loading inscriptions:', e);
          }

          return {
            ...t,
            horario: horarioStr,
            total_estudiantes,
            cupos_maximos: 30, // This should come from backend
            asistencia_promedio: Math.floor(Math.random() * 30) + 70, // Mock data
          };
        })
      );

      setTalleres(enriched);
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
      };

      if (isEditing && currentTaller) {
        await talleresApi.actualizar({ id: currentTaller.id, ...data } as Taller);
        Alert.alert('Éxito', 'Taller actualizado correctamente');
      } else {
        await talleresApi.crear(data);
        Alert.alert('Éxito', 'Taller creado correctamente');
      }
      setModalVisible(false);
      cargarTalleres();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarTaller = (taller: Taller) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar el taller "${taller.nombre}"?\n\n⚠️ Esto eliminará:\n• Todas las clases asociadas\n• Las inscripciones de estudiantes\n• El historial de asistencia`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await talleresApi.eliminar(taller.id);
              Alert.alert('Éxito', 'Taller eliminado correctamente');
              cargarTalleres();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getPopularityLevel = (total: number, max: number): number => {
    if (max === 0) return 0;
    return Math.round((total / max) * 10);
  };

  const renderTaller = ({ item }: { item: TallerEnriquecido }) => {
    const popularityLevel = getPopularityLevel(item.total_estudiantes || 0, item.cupos_maximos || 30);
    const isFull = (item.total_estudiantes || 0) >= (item.cupos_maximos || 30);
    const isPopular = popularityLevel >= 8;
    const isLowOccupancy = (item.total_estudiantes || 0) < ((item.cupos_maximos || 30) * 0.3);
    
    // Color dinámico para asistencia
    const asistenciaPromedio = item.asistencia_promedio || 0;
    const asistenciaColor = asistenciaPromedio >= 90 ? colors.success : 
                           asistenciaPromedio >= 70 ? colors.warning : colors.error;
    const asistenciaLightColor = asistenciaPromedio >= 90 ? colors.successLight : 
                                asistenciaPromedio >= 70 ? colors.warningLight : colors.errorLight;

    return (
      <View
        style={[
          styles.card,
          isMobile ? styles.cardMobile : styles.cardWeb,
        ]}
      >
        {/* Title and badges integrados */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: isAdmin ? 80 : spacing.sm }}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.nombre}
            </Text>
            <View style={styles.badgeContainer}>
              {isFull && (
                <View style={[styles.miniChip, { backgroundColor: colors.errorLight }]}>
                  <Ionicons name="flame" size={12} color={colors.error} />
                  <Text style={[styles.miniChipText, { color: colors.error }]}>Completo</Text>
                </View>
              )}
              {isPopular && !isFull && (
                <View style={[styles.miniChip, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="star" size={12} color={colors.warning} />
                  <Text style={[styles.miniChipText, { color: colors.warning }]}>Popular</Text>
                </View>
              )}
              {isLowOccupancy && (
                <View style={[styles.miniChip, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="information-circle" size={12} color={colors.info} />
                  <Text style={[styles.miniChipText, { color: colors.info }]}>Cupos disponibles</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats destacadas con colores dinámicos */}
        <View style={styles.statsHighlight}>
          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="people" size={28} color={colors.primary} />
            </View>
            <Text style={styles.statBoxValue}>{item.total_estudiantes || 0}</Text>
            <Text style={styles.statBoxLabel}>de {item.cupos_maximos || 30} cupos</Text>
          </View>
          
          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: asistenciaLightColor }]}>
              <Ionicons name="checkmark-done" size={28} color={asistenciaColor} />
            </View>
            <Text style={[styles.statBoxValue, { color: asistenciaColor }]}>
              {asistenciaPromedio}%
            </Text>
            <Text style={styles.statBoxLabel}>asistencia</Text>
          </View>
        </View>

        {/* Progress bar más visible */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Ocupación</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(((item.total_estudiantes || 0) / (item.cupos_maximos || 30)) * 100)}%
            </Text>
          </View>
          <ProgressBar
            current={item.total_estudiantes || 0}
            total={item.cupos_maximos || 30}
            height={10}
            showLabel={false}
          />
        </View>

        {/* Info compacta con iconos coloreados */}
        <View style={styles.infoSection}>
          {item.profesores && item.profesores.length > 0 && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {item.profesores.map((p: any) => p.nombre).join(', ')}
              </Text>
            </View>
          )}
          {item.horario && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="time" size={16} color={colors.blue.main} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {item.horario.split(', ')[0]}
                {item.horario.split(', ').length > 1 && ' +' + (item.horario.split(', ').length - 1)}
              </Text>
            </View>
          )}
          {item.ubicacion && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={16} color={colors.success} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {item.ubicacion}
              </Text>
            </View>
          )}
        </View>

        {/* Actions con hover effect visual */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Asistencia', { tallerId: item.id })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkbox" size={20} color={colors.success} />
            </View>
            <Text style={styles.actionButtonText}>Asistencia</Text>
          </TouchableOpacity>
          <View style={styles.footerDivider} />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Estudiantes', { tallerId: item.id })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="people" size={20} color={colors.info} />
            </View>
            <Text style={styles.actionButtonText}>Estudiantes</Text>
          </TouchableOpacity>
        </View>

        {/* Admin actions menu */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity 
              style={[styles.adminButton, { backgroundColor: colors.blue.light }]} 
              onPress={() => abrirModalEditar(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color={colors.blue.main} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.adminButton, { backgroundColor: colors.errorLight }]} 
              onPress={() => eliminarTaller(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTableRow = ({ item, index }: { item: TallerEnriquecido; index: number }) => {
    const asistenciaPromedio = item.asistencia_promedio || 0;
    const asistenciaColor = asistenciaPromedio >= 90 ? colors.success : 
                           asistenciaPromedio >= 70 ? colors.warning : colors.error;
    const ocupacionPorcentaje = Math.round(((item.total_estudiantes || 0) / (item.cupos_maximos || 30)) * 100);
    const isFull = (item.total_estudiantes || 0) >= (item.cupos_maximos || 30);

    return (
      <View
        style={[
          styles.tableRow,
          index % 2 === 0 && styles.tableRowEven,
          isWeb && styles.tableRowWeb,
        ]}
      >
        <View style={[styles.tableCellTaller, isWeb && styles.tableCellTallerWeb]}>
          <Text style={styles.tableCellText} numberOfLines={2}>{item.nombre}</Text>
          {isFull && (
            <View style={[styles.miniChip, { backgroundColor: colors.errorLight, marginTop: 4 }]}>
              <Ionicons name="flame" size={10} color={colors.error} />
              <Text style={[styles.miniChipText, { fontSize: 10, color: colors.error }]}>Lleno</Text>
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

        <View
          style={[
            styles.tableCellCupos,
            styles.tableCellCenter,
            isWeb && styles.tableCellCuposWeb,
          ]}
        >
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>{item.total_estudiantes || 0}/{item.cupos_maximos || 30}</Text>
          </View>
          <View style={styles.miniProgressBar}>
            <View 
              style={[
                styles.miniProgressFill, 
                { 
                  width: `${ocupacionPorcentaje}%`,
                  backgroundColor: ocupacionPorcentaje >= 90 ? colors.error : 
                                  ocupacionPorcentaje >= 70 ? colors.warning : colors.success
                }
              ]} 
            />
          </View>
        </View>

        <View
          style={[
            styles.tableCellAsistencia,
            styles.tableCellCenter,
            isWeb && styles.tableCellAsistenciaWeb,
          ]}
        >
          <View style={[styles.tableBadge, { backgroundColor: asistenciaColor + '20' }]}>
            <Text style={[styles.tableBadgeText, { color: asistenciaColor }]}>
              {asistenciaPromedio}%
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.tableCellHorario,
            styles.tableCellCenter,
            isWeb && styles.tableCellHorarioWeb,
          ]}
        >
          <Text style={[styles.tableCellText, { fontSize: typography.sizes.xs }]} numberOfLines={2}>
            {item.horario ? item.horario.split(', ')[0] : '-'}
            {item.horario && item.horario.split(', ').length > 1 && (
              <Text style={{ color: colors.text.tertiary }}> +{item.horario.split(', ').length - 1}</Text>
            )}
          </Text>
        </View>

        <View
          style={[
            styles.tableCellAcciones,
            styles.tableCellActions,
            isWeb && styles.tableCellAccionesWeb,
          ]}
        >
          <TouchableOpacity
            style={styles.tableActionButton}
            onPress={() => navigation.navigate('Asistencia', { tallerId: item.id })}
          >
            <Ionicons name="checkbox" size={18} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tableActionButton}
            onPress={() => navigation.navigate('Estudiantes', { tallerId: item.id })}
          >
            <Ionicons name="people" size={18} color={colors.info} />
          </TouchableOpacity>
          {isAdmin && (
            <>
              <TouchableOpacity
                style={styles.tableActionButton}
                onPress={() => abrirModalEditar(item)}
              >
                <Ionicons name="create-outline" size={18} color={colors.blue.main} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tableActionButton}
                onPress={() => eliminarTaller(item)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
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
          va = a.total_estudiantes || 0;
          vb = b.total_estudiantes || 0;
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
    <View style={[styles.table, isWeb ? styles.tableWeb : styles.tableMobile]}>
      <View
        style={[
          styles.tableHeader,
          isWeb && styles.tableRowWeb,
        ]}
      >
        <TouchableOpacity
          style={[styles.tableCellTaller, isWeb && styles.tableCellTallerWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('nombre')}
        >
          <Text style={styles.tableHeaderButtonText}>Taller</Text>
          <Ionicons
            name={sortBy === 'nombre' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'nombre' ? colors.primary : colors.text.tertiary}
            style={styles.sortIcon}
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
            color={sortBy === 'profesores' ? colors.primary : colors.text.tertiary}
            style={styles.sortIcon}
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
            color={sortBy === 'cupos' ? colors.primary : colors.text.tertiary}
            style={styles.sortIcon}
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
            color={sortBy === 'asistencia' ? colors.primary : colors.text.tertiary}
            style={styles.sortIcon}
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
            color={sortBy === 'horario' ? colors.primary : colors.text.tertiary}
            style={styles.sortIcon}
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

  const Container: any = isWeb ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📚 {isAdmin ? 'Talleres' : 'Mis Talleres'}</Text>
          <View style={styles.headerActions}>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === 'cards' && styles.viewToggleButtonActive]}
                onPress={() => setViewMode('cards')}
              >
                <Ionicons 
                  name="grid" 
                  size={20} 
                  color={viewMode === 'cards' ? colors.primary : colors.text.tertiary} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === 'table' && styles.viewToggleButtonActive]}
                onPress={() => setViewMode('table')}
              >
                <Ionicons 
                  name="list" 
                  size={20} 
                  color={viewMode === 'table' ? colors.primary : colors.text.tertiary} 
                />
              </TouchableOpacity>
            </View>
            {isAdmin && (
              <TouchableOpacity style={styles.addButton} onPress={abrirModalCrear}>
                <Ionicons name="add" size={24} color={colors.text.light} />
                <Text style={styles.addButtonText}>Nuevo Taller</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar talleres..."
            onClear={() => setSearchTerm('')}
          />
        </View>

        {loading && !refreshing && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}

        {!loading && talleres.length === 0 && <EmptyState message="No hay talleres registrados" icon="📚" />}

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
            nestedScrollEnabled
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {isWeb ? (
              renderTableContent()
            ) : (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator
                contentContainerStyle={styles.tableHorizontalContent}
              >
                {renderTableContent()}
              </ScrollView>
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal for create/edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
          <SafeAreaView
            style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]}
            edges={isWeb ? [] : ['bottom']}
          >
            <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent]}>
              <View style={sharedStyles.modalHeader}>
                <Text style={sharedStyles.modalTitle}>{isEditing ? '✏️ Editar Taller' : '➕ Nuevo Taller'}</Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
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
                  onPress={guardarTaller}
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
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: 2,
    gap: 2,
  },
  viewToggleButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
  },
  viewToggleButtonActive: {
    backgroundColor: colors.background.primary,
    ...(shadows.sm as any),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.text.light,
    fontWeight: '600',
    fontSize: typography.sizes.md,
    marginLeft: spacing.xs,
  },
  searchContainer: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  loader: {
    marginTop: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    width: '100%',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...(shadows.md as any),
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardWeb: {
    width: '48%',
    maxWidth: '48%',
    marginHorizontal: spacing.xs,
    flexGrow: 0,
  },
  cardMobile: {
    width: '100%',
    alignSelf: 'stretch',
  },
  cardHeader: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  miniChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  statsHighlight: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statBoxValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  statBoxLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  progressSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  infoSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.background.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    flex: 1,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footerDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  adminActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...(shadows.sm as any),
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  // Table styles
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
  },
  tableWeb: {
    width: '100%',
  },
  tableMobile: {
    minWidth: 720,
    alignSelf: 'flex-start',
  },
  tableHorizontalContent: {
    paddingBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tableRowWeb: {
    width: '100%',
  },
  tableHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xs,
  },
  tableHeaderButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  sortIcon: {
    marginLeft: spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 60,
  },
  tableRowEven: {
    backgroundColor: colors.background.secondary,
  },
  tableCellTaller: {
    width: 180,
    minWidth: 180,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tableCellTallerWeb: {
    width: 'auto',
    flex: 2,
  },
  tableCellProfesor: {
    width: 160,
    minWidth: 160,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tableCellProfesorWeb: {
    width: 'auto',
    flex: 2,
  },
  tableCellCupos: {
    width: 110,
    minWidth: 110,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tableCellCuposWeb: {
    width: 'auto',
    flex: 1,
  },
  tableCellAsistencia: {
    width: 100,
    minWidth: 100,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tableCellAsistenciaWeb: {
    width: 'auto',
    flex: 1,
  },
  tableCellHorario: {
    width: 140,
    minWidth: 140,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tableCellHorarioWeb: {
    width: 'auto',
    flex: 1,
  },
  tableCellAcciones: {
    width: 160,
    minWidth: 160,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tableCellAccionesWeb: {
    width: 'auto',
    flex: 1.2,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tableCellCenter: {
    alignItems: 'center',
  },
  tableCellActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tableCellText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '500',
  },
  tableBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  tableBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.text.primary,
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  tableActionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TalleresEnhancedScreen;

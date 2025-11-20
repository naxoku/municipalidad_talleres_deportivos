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
import { alumnosApi } from '../src/api/alumnos';
import { Estudiante } from '../src/types';
import { Input } from '../src/components/Input';
import { EmptyState } from '../src/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuth } from '../src/contexts/AuthContext';
import HeaderWithSearch from '../src/components/HeaderWithSearch';
import Modal from '../src/components/Modal'; // Usando ElegantModal
import { useToast } from '../src/contexts/ToastContext';
import { Select } from '../src/components/Select';

// Importar solo los estilos del tema necesarios
import { colors, spacing } from '../src/theme/colors';
import { inscripcionesApi } from '@/api/inscripciones';

// Extender el tipo Estudiante para datos de UI
interface EstudianteEnriquecido extends Estudiante {
  total_talleres?: number;
}

const AlumnosScreen = () => {
  const [Alumnos, setAlumnos] = useState<EstudianteEnriquecido[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEstudiante, setCurrentEstudiante] = useState<Estudiante | null>(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    inscripcion: '',
    sexo: '',
    fecha_nacimiento: '',
    telefono: '',
    correo_electronico: '',
    direccion: '',
    curso: '',
    colegio: '',
    tutor_nombre: '',
    tutor_rut: '',
    tutor_telefono: '',
    tutor_correo: '',
    profesion: '',
    notificaciones_movil: false,
    autorizo_imagenes: false,
    edad: '',
  });

  const { isWeb, isMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [dateError, setDateError] = useState('');

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const convertDateFromISO = (dateString: string) => {
    if (!dateString || !dateString.includes('-')) return dateString;
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // Si está en formato YYYY-MM-DD, convertir a DD-MM-YYYY
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      // Si ya está en formato DD-MM-YYYY, devolver como está
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return dateString;
      }
    }
    return dateString;
  };

  const convertDateToISO = (dateString: string) => {
    if (!dateString || !dateString.includes('-')) return dateString;
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // Si ya está en formato DD-MM-YYYY, convertir a YYYY-MM-DD
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      // Si ya está en formato YYYY-MM-DD, devolver como está
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return dateString;
      }
    }
    return dateString;
  };

  const validateDate = (dateString: string) => {
    if (!dateString || dateString.length !== 10 || !dateString.includes('-')) return false;
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // Validar rangos básicos
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Validar días por mes
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return false;
    
    return true;
  };

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString || birthDateString.length !== 10 || !birthDateString.includes('-')) return '';
    
    // Validar que la fecha sea correcta antes de calcular
    if (!validateDate(birthDateString)) return '';
    
    try {
      // Convertir la fecha de nacimiento al formato YYYY-MM-DD para crear el objeto Date
      const isoDate = convertDateToISO(birthDateString);
      const birthDate = new Date(isoDate);
      
      // Validar que la fecha sea válida
      if (isNaN(birthDate.getTime())) return '';
      
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Si aún no ha cumplido años este año, restar 1
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= 0 ? age.toString() : '';
    } catch {
      return '';
    }
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const formatDateInput = (text: string) => {
    // Remover todos los caracteres no numéricos
    let cleaned = text.replace(/\D/g, '');

    // Limitar a 8 dígitos (DDMMYYYY)
    cleaned = cleaned.substring(0, 8);

    // Formatear como DD-MM-YYYY
    let formatted = cleaned;
    if (cleaned.length >= 5) {
      formatted = cleaned.substring(0, 2) + '-' + cleaned.substring(2, 4) + '-' + cleaned.substring(4);
    } else if (cleaned.length >= 3) {
      formatted = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
    }

    return formatted;
  };

  const cargarAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const [alumnosData, inscripcionesData] = await Promise.all([
        alumnosApi.listar(),
        // Usamos inscripciones para calcular el total de talleres por alumno
        inscripcionesApi.listar(),
      ]);

      const inscripcionMap: Record<number, Set<number>> = {};
      inscripcionesData.forEach(i => {
        if (!inscripcionMap[i.estudiante_id]) {
          inscripcionMap[i.estudiante_id] = new Set();
        }
        inscripcionMap[i.estudiante_id].add(i.taller_id);
      });

      const enriched = alumnosData.map(e => ({
        ...e,
        total_talleres: inscripcionMap[e.id]?.size || 0
      }));

      setAlumnos(enriched);
    } catch {
      showToast('Error cargando alumnos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  
  useEffect(() => {
    cargarAlumnos();
  }, [cargarAlumnos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarAlumnos();
    setRefreshing(false);
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentEstudiante(null);
    setDateError('');
    setFormData({
      nombres: '',
      apellidos: '',
      rut: '',
      inscripcion: (() => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}-${month}-${year}`;
      })(),
      sexo: '',
      fecha_nacimiento: '',
      telefono: '',
      correo_electronico: '',
      direccion: '',
      curso: '',
      colegio: '',
      tutor_nombre: '',
      tutor_rut: '',
      tutor_telefono: '',
      tutor_correo: '',
      profesion: '',
      notificaciones_movil: false,
      autorizo_imagenes: false,
      edad: '',
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (estudiante: Estudiante) => {
    setIsEditing(true);
    setCurrentEstudiante(estudiante);
    setDateError('');
    // Dividir nombre en nombres y apellidos si es necesario
    const nombreParts = (estudiante as any).nombre ? (estudiante as any).nombre.split(' ') : ['', ''];
    
    const fechaNacimiento = (estudiante as any).fecha_nacimiento ? convertDateFromISO((estudiante as any).fecha_nacimiento) : '';
    // Solo calcular edad si la fecha está completa y es válida
    const edadCalculada = fechaNacimiento.length === 10 && validateDate(fechaNacimiento) ? calculateAge(fechaNacimiento) : '';
    
    setFormData({
      nombres: (estudiante as any).nombres || nombreParts[0] || '',
      apellidos: (estudiante as any).apellidos || nombreParts.slice(1).join(' ') || '',
      rut: (estudiante as any).rut || '',
      inscripcion: (estudiante as any).inscripcion ? convertDateFromISO((estudiante as any).inscripcion) : '',
      sexo: (estudiante as any).sexo || '',
      fecha_nacimiento: fechaNacimiento,
      telefono: (estudiante as any).telefono || '',
      correo_electronico: (estudiante as any).correo_electronico || (estudiante as any).contacto || '',
      direccion: (estudiante as any).direccion || '',
      curso: (estudiante as any).curso || '',
      colegio: (estudiante as any).colegio || '',
      tutor_nombre: (estudiante as any).tutor_nombre || '',
      tutor_rut: (estudiante as any).tutor_rut || '',
      tutor_telefono: (estudiante as any).tutor_telefono || '',
      tutor_correo: (estudiante as any).tutor_correo || '',
      profesion: (estudiante as any).profesion || '',
      notificaciones_movil: (estudiante as any).notificaciones_movil || false,
      autorizo_imagenes: (estudiante as any).autorizo_imagenes || false,
      edad: edadCalculada,
    });
    setModalVisible(true);
  };

  const guardarEstudiante = async () => {
    if (!formData.nombres || !formData.apellidos) {
      showToast('Los nombres y apellidos son obligatorios', 'error');
      return;
    }

    if (!formData.sexo) {
      showToast('El sexo es obligatorio', 'error');
      return;
    }

    if (!formData.fecha_nacimiento) {
      showToast('La fecha de nacimiento es obligatoria', 'error');
      return;
    }

    // Validar que la fecha sea completa y válida
    if (formData.fecha_nacimiento.length === 10 && !validateDate(formData.fecha_nacimiento)) {
      setDateError('La fecha de nacimiento no es válida. Verifique el día, mes y año.');
      showToast('La fecha de nacimiento no es válida. Verifique el día, mes y año.', 'error');
      return;
    }

    // Validaciones específicas por edad
    const edad = parseInt(formData.edad);
    if (edad < 18) {
      if (!formData.curso || !formData.colegio) {
        showToast('Para alumnos menores de edad, el curso y colegio son obligatorios', 'error');
        return;
      }
      if (!formData.tutor_nombre) {
        showToast('Para alumnos menores de edad, el nombre del tutor es obligatorio', 'error');
        return;
      }
    } else {
      if (!formData.profesion) {
        showToast('Para alumnos adultos, la profesión es obligatoria', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const data = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        rut: formData.rut || undefined,
        inscripcion: convertDateToISO(formData.inscripcion),
        sexo: formData.sexo || undefined,
        fecha_nacimiento: convertDateToISO(formData.fecha_nacimiento) || undefined,
        telefono: formData.telefono || undefined,
        correo_electronico: formData.correo_electronico || undefined,
        direccion: formData.direccion || undefined,
        curso: formData.curso || undefined,
        colegio: formData.colegio || undefined,
        tutor_nombre: formData.tutor_nombre || undefined,
        tutor_rut: formData.tutor_rut || undefined,
        tutor_telefono: formData.tutor_telefono || undefined,
        tutor_correo: formData.tutor_correo || undefined,
        profesion: formData.profesion || undefined,
        notificaciones_movil: formData.notificaciones_movil,
        autorizo_imagenes: formData.autorizo_imagenes,
        edad: formData.edad ? parseInt(formData.edad) : undefined,
      };

      if (isEditing && currentEstudiante) {
        await alumnosApi.actualizar({ id: currentEstudiante.id, ...data } as Estudiante);
        showToast('Estudiante actualizado correctamente', 'success');
      } else {
        await alumnosApi.crear(data);
        showToast('Estudiante creado correctamente', 'success');
      }
      setModalVisible(false);
      cargarAlumnos();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminarEstudiante = (estudiante: Estudiante) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar a ${estudiante.nombres} ${estudiante.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await alumnosApi.eliminar(estudiante.id);
              showToast('Estudiante eliminado correctamente', 'success');
              cargarAlumnos();
            } catch (error: any) {
              showToast(error.message, 'error');
            }
          },
        },
      ]
    );
  };

  const filteredAlumnos = Alumnos.filter((e) =>
    `${e.nombres} ${e.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.telefono || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.correo_electronico || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.edad && e.edad.toString().includes(searchTerm))
  );

  const displayedAlumnos = useMemo(() => {
    const arr = [...filteredAlumnos];
    if (!sortBy) return arr;

    arr.sort((a: EstudianteEnriquecido, b: EstudianteEnriquecido) => {
      let va: any = '';
      let vb: any = '';
      switch (sortBy) {
        case 'nombres':
          va = `${(a.nombres || '')} ${(a.apellidos || '')}`.toLowerCase();
          vb = `${(b.nombres || '')} ${(b.apellidos || '')}`.toLowerCase();
          break;
        case 'edad':
          va = a.edad || 0;
          vb = b.edad || 0;
          break;
        case 'contacto':
          va = (a.telefono || a.correo_electronico || '').toLowerCase();
          vb = (b.telefono || b.correo_electronico || '').toLowerCase();
          break;
        case 'talleres':
          va = a.total_talleres || 0;
          vb = b.total_talleres || 0;
          break;
        default:
          va = `${(a.nombres || '')} ${(a.apellidos || '')}`.toLowerCase();
          vb = `${(b.nombres || '')} ${(b.apellidos || '')}`.toLowerCase();
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
  }, [filteredAlumnos, sortBy, sortDir]);

  const renderEstudianteCard = ({ item }: { item: EstudianteEnriquecido }) => (
    <View style={[styles.card, isMobile ? styles.cardMobile : styles.cardWeb]}>
      {/* Header con título */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {`${item.nombres} ${item.apellidos}`}
        </Text>
      </View>

      {/* Información principal - Grid simple */}
      <View style={styles.infoGrid}>
        {/* Edad */}
        {item.edad && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Edad</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.edad} años
            </Text>
          </View>
        )}

        {/* Contacto */}
        {(item.telefono || item.correo_electronico) && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Contacto</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.telefono || item.correo_electronico}
            </Text>
          </View>
        )}

        {/* Talleres */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Talleres</Text>
          <Text style={[styles.infoValue, styles.cuposValue]}>
            {item.total_talleres || 0} inscritos
          </Text>
        </View>
      </View>

      {/* Acciones rápidas */}
      {isAdmin && (
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
              eliminarEstudiante(item);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEstudianteTableRow = ({ item, index }: { item: EstudianteEnriquecido; index: number }) => (
    <View 
      key={item.id} 
      style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven, isWeb && styles.tableWeb]}
    >
      <View style={[styles.tableCellNombre, isWeb && styles.tableCellNombreWeb]}>
        <Text style={styles.tableCellText} numberOfLines={2}>{`${item.nombres} ${item.apellidos}`}</Text>
      </View>
      <View style={[styles.tableCellEdad, styles.tableCellCenter, isWeb && styles.tableCellEdadWeb]}>
        <Text style={styles.tableCellText}>{item.edad || '-'}</Text>
      </View>
      <View style={[styles.tableCellContacto, isWeb && styles.tableCellContactoWeb]}>
        <Text style={styles.tableCellText} numberOfLines={2}>{item.telefono || item.correo_electronico || '-'}</Text>
      </View>
      
      <View style={[styles.tableCellTalleres, styles.tableCellCenter, isWeb && styles.tableCellTalleresWeb]}>
        <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>{item.total_talleres || 0}</Text>
        </View>
      </View>
      
      {isAdmin && (
        <View style={[styles.tableCellAcciones, styles.tableCellActions, isWeb && styles.tableCellAccionesWeb]}>
          <TouchableOpacity
            style={styles.tableActionButton}
            onPress={() => abrirModalEditar(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={colors.blue.main} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tableActionButton}
            onPress={() => eliminarEstudiante(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTableContent = () => (
    <View style={[styles.table, isWeb && styles.tableWeb]}>
      <View style={[styles.tableHeader, isWeb && styles.tableHeader]}>
        <TouchableOpacity
          style={[styles.tableCellNombre, isWeb && styles.tableCellNombreWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('nombres')}
        >
          <Text style={styles.tableHeaderButtonText}>Nombre</Text>
          <Ionicons
            name={sortBy === 'nombres' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'nombres' ? colors.blue.main : colors.text.tertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellEdad, styles.tableCellCenter, isWeb && styles.tableCellEdadWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('edad')}
        >
          <Text style={styles.tableHeaderButtonText}>Edad</Text>
          <Ionicons
            name={sortBy === 'edad' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'edad' ? colors.blue.main : colors.text.tertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tableCellContacto, isWeb && styles.tableCellContactoWeb, styles.tableHeaderButton]}
          onPress={() => toggleSort('contacto')}
        >
          <Text style={styles.tableHeaderButtonText}>Contacto</Text>
          <Ionicons
            name={sortBy === 'contacto' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'contacto' ? colors.blue.main : colors.text.tertiary}
          />
        </TouchableOpacity>
        
        {/* Columna extra para talleres */}
        <TouchableOpacity
            style={[styles.tableCellTalleres, styles.tableCellCenter, isWeb && styles.tableCellTalleresWeb, styles.tableHeaderButton]}
            onPress={() => toggleSort('talleres')}
        >
          <Text style={styles.tableHeaderButtonText}>Talleres</Text>
          <Ionicons
            name={sortBy === 'talleres' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'caret-down'}
            size={14}
            color={sortBy === 'talleres' ? colors.blue.main : colors.text.tertiary}
          />
        </TouchableOpacity>

        {isAdmin && (
            <View style={[styles.tableCellAcciones, styles.tableCellCenter, isWeb && styles.tableCellAccionesWeb]}>
              <Text style={styles.tableHeaderButtonText}>Acciones</Text>
            </View>
          )}
      </View>

      {displayedAlumnos.map((item, index) => (
        <React.Fragment key={item.id}>
          {renderEstudianteTableRow({ item, index })}
        </React.Fragment>
      ))}
    </View>
  );

  const Container: any = isWeb ? View : SafeAreaView;

  return (
      <Container style={styles.container} edges={isWeb ? undefined : ['bottom']}>
        <View style={{ flex: 1 }}>
          <HeaderWithSearch 
            title={isAdmin ? 'Alumnos' : 'Mis Alumnos'} 
            searchTerm={searchTerm} 
            onSearch={setSearchTerm} 
            onAdd={isAdmin ? abrirModalCrear : undefined}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              if (mode === 'cards' || mode === 'table') {
                setViewMode(mode);
              }
            }}
          />

          {loading && !refreshing && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

          {!loading && Alumnos.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <EmptyState message="No hay Alumnos registrados" icon={<Ionicons name="people-outline" size={48} color={colors.text.tertiary} />} />
            </View>
          )}
          
          {!loading && displayedAlumnos.length > 0 && (
            viewMode === 'cards' ? (
                <FlatList
                    data={displayedAlumnos}
                    renderItem={renderEstudianteCard}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={isMobile ? 1 : 2}
                    key={isMobile ? 'list' : 'grid'}
                    columnWrapperStyle={isMobile ? undefined : styles.gridRow}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            ) : (
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
                          contentContainerStyle={styles.tableHorizontalMinWidth}
                          nestedScrollEnabled={true}
                          directionalLockEnabled={true}
                        >
                          {renderTableContent()}
                        </ScrollView>
                    )}
                </ScrollView>
            )
          )}
        </View>

        {/* Modal - Usando el ElegantModal */}
        <Modal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={isEditing ? `Editar Estudiante: ${currentEstudiante?.nombres} ${currentEstudiante?.apellidos}` : 'Registrar nuevo estudiante'}
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
                onPress={guardarEstudiante}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.text.secondary} />
                ) : (
                  <Text style={styles.modalFooterButtonText}>
                    {isEditing ? 'Guardar Cambios' : 'Registrar Estudiante'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        >
          <ScrollView style={{ maxHeight: isWeb ? 600 : 400 }}>

            {/* SECCIÓN: INFORMACIÓN PERSONAL BÁSICA */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Información Personal Básica</Text>
              </View>
              <View style={styles.sectionContent}>
                <Input
                  label="Nombres"
                  required
                  value={formData.nombres}
                  onChangeText={(text) => setFormData({ ...formData, nombres: text })}
                  placeholder="Ej: María José"
                  maxLength={100}
                />

                <Input
                  label="Apellidos"
                  required
                  value={formData.apellidos}
                  onChangeText={(text) => setFormData({ ...formData, apellidos: text })}
                  placeholder="Ej: González Pérez"
                  maxLength={100}
                />

                {/* Date picker para fecha de nacimiento */}
                <Input
                  label="Fecha de nacimiento"
                  required
                  value={formData.fecha_nacimiento}
                  onChangeText={(text) => {
                    const formattedDate = formatDateInput(text);
                    // Solo calcular edad cuando la fecha esté completa (10 caracteres: DD-MM-YYYY)
                    const calculatedAge = formattedDate.length === 10 ? calculateAge(formattedDate) : '';
                    
                    // Validar fecha si está completa
                    if (formattedDate.length === 10 && !validateDate(formattedDate)) {
                      setDateError('Fecha inválida. Verifique el día, mes y año.');
                      setFormData({ 
                        ...formData, 
                        fecha_nacimiento: formattedDate,
                        edad: ''
                      });
                    } else {
                      setDateError('');
                      setFormData({ 
                        ...formData, 
                        fecha_nacimiento: formattedDate,
                        edad: calculatedAge
                      });
                    }
                  }}
                  placeholder="DD-MM-YYYY"
                  keyboardType="numeric"
                  maxLength={10}
                  error={dateError}
                />

                <Input
                  label="Edad"
                  value={formData.edad}
                  placeholder="Se calcula automáticamente"
                  keyboardType="numeric"
                  maxLength={3}
                  editable={false}
                />

                {/* Selector de sexo */}
                <Select
                  label="Sexo"
                  required
                  value={formData.sexo}
                  onValueChange={(value) => setFormData({ ...formData, sexo: value as string })}
                  items={[
                    { label: 'Masculino', value: 'M' },
                    { label: 'Femenino', value: 'F' },
                  ]}
                />

                <Input
                  label="RUT"
                  value={formData.rut}
                  onChangeText={(text) => setFormData({ ...formData, rut: text })}
                  placeholder="Ej: 12345678-9"
                  maxLength={12}
                />

                {/* Fecha de inscripción automática */}
                <Input
                  label="Fecha de inscripción"
                  value={(() => {
                    const today = new Date();
                    const day = String(today.getDate()).padStart(2, '0');
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const year = today.getFullYear();
                    return `${day}-${month}-${year}`;
                  })()}
                  editable={false}
                  placeholder="Se detecta automáticamente"
                />
              </View>
            </View>

            {/* SECCIÓN: INFORMACIÓN DE CONTACTO */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Información de Contacto</Text>
              </View>
              <View style={styles.sectionContent}>
                <Input
                  label="Teléfono"
                  value={formData.telefono}
                  onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                  placeholder="+56912345678"
                  keyboardType="phone-pad"
                />

                <Input
                  label="Correo electrónico"
                  value={formData.correo_electronico}
                  onChangeText={(text) => setFormData({ ...formData, correo_electronico: text })}
                  placeholder="estudiante@email.com"
                  keyboardType="email-address"
                />

                <Input
                  label="Dirección"
                  value={formData.direccion}
                  onChangeText={(text) => setFormData({ ...formData, direccion: text })}
                  placeholder="Dirección completa"
                />
              </View>
            </View>

            {/* SECCIÓN: INFORMACIÓN ACADÉMICA (solo para menores) */}
            {parseInt(formData.edad) < 18 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="school-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Información Académica</Text>
                </View>
                <View style={styles.sectionContent}>
                  <Input
                    label="Curso"
                    value={formData.curso}
                    onChangeText={(text) => setFormData({ ...formData, curso: text })}
                    placeholder="Ej: 8° Básico"
                  />

                  <Input
                    label="Colegio"
                    value={formData.colegio}
                    onChangeText={(text) => setFormData({ ...formData, colegio: text })}
                    placeholder="Nombre del colegio"
                  />
                </View>
              </View>
            )}

            {/* SECCIÓN: INFORMACIÓN DEL TUTOR (solo para menores) */}
            {parseInt(formData.edad) < 18 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Información del Tutor</Text>
                </View>
                <View style={styles.sectionContent}>
                  <Input
                    label="Nombre del tutor"
                    value={formData.tutor_nombre}
                    onChangeText={(text) => setFormData({ ...formData, tutor_nombre: text })}
                    placeholder="Nombre completo del tutor"
                  />

                  <Input
                    label="RUT del tutor"
                    value={formData.tutor_rut}
                    onChangeText={(text) => setFormData({ ...formData, tutor_rut: text })}
                    placeholder="Ej: 12345678-9"
                  />

                  <Input
                    label="Teléfono del tutor"
                    value={formData.tutor_telefono}
                    onChangeText={(text) => setFormData({ ...formData, tutor_telefono: text })}
                    placeholder="+56912345678"
                    keyboardType="phone-pad"
                  />

                  <Input
                    label="Correo del tutor"
                    value={formData.tutor_correo}
                    onChangeText={(text) => setFormData({ ...formData, tutor_correo: text })}
                    placeholder="tutor@email.com"
                    keyboardType="email-address"
                  />
                </View>
              </View>
            )}

            {/* SECCIÓN: INFORMACIÓN PROFESIONAL (solo para adultos) */}
            {parseInt(formData.edad) >= 18 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Información Profesional</Text>
                </View>
                <View style={styles.sectionContent}>
                  <Input
                    label="Profesión"
                    value={formData.profesion}
                    onChangeText={(text) => setFormData({ ...formData, profesion: text })}
                    placeholder="Profesión u ocupación"
                  />
                </View>
              </View>
            )}

            {/* SECCIÓN: PREFERENCIAS Y AUTORIZACIONES */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Preferencias y Autorizaciones</Text>
              </View>
              <View style={styles.sectionContent}>
                {/* Checkboxes para booleanos */}
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setFormData({ ...formData, notificaciones_movil: !formData.notificaciones_movil })}
                  >
                    <Ionicons
                      name={formData.notificaciones_movil ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={formData.notificaciones_movil ? colors.primary : colors.text.tertiary}
                    />
                    <Text style={styles.checkboxText}>Deseo recibir notificaciones móviles</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setFormData({ ...formData, autorizo_imagenes: !formData.autorizo_imagenes })}
                  >
                    <Ionicons
                      name={formData.autorizo_imagenes ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={formData.autorizo_imagenes ? colors.primary : colors.text.tertiary}
                    />
                    <Text style={styles.checkboxText}>Autorizo publicación de imágenes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </Modal>
      </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
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
  tableHorizontalMinWidth: {
    minWidth: 800,
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
    minWidth: 200,
    flex: 2,
  },
  tableCellNombreWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellEdad: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 80,
    flex: 0.8,
  },
  tableCellEdadWeb: {
    flex: 0.8,
    minWidth: 0,
  },
  tableCellContacto: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 200,
    flex: 2,
  },
  tableCellContactoWeb: {
    flex: 2,
    minWidth: 0,
  },
  tableCellTalleres: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 100,
    flex: 1,
  },
  tableCellTalleresWeb: {
    flex: 1,
    minWidth: 0,
  },
  tableCellAcciones: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 100,
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
  contactHelper: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  contactHelperText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 16,
  },
  checkboxContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },

  // Estilos para secciones del modal
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionContent: {
    padding: 16,
    gap: 12,
  },
});

export default AlumnosScreen;
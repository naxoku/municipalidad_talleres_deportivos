import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollView, View, Text, ActivityIndicator, TouchableOpacity, RefreshControl, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../src/api/config';
import { Badge } from '../src/components/Badge';
import { CardSkeleton } from '../src/components/LoadingSkeleton';
import { useResponsive } from '../src/hooks/useResponsive';
import { sharedStyles } from '../src/theme/sharedStyles';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, colors, borderRadius } from '../src/theme/colors'; // Aseguramos importar todas las constantes
import { Input } from '../src/components/Input';
import Modal from '../src/components/Modal'; // Usando ElegantModal (el mejorado)
import { Select } from '../src/components/Select';
import { QuickActionsMenu, QuickAction } from '../src/components/QuickActionsMenu';
import { alumnosApi } from '../src/api/alumnos';
import { talleresApi } from '../src/api/talleres';
import { inscripcionesApi } from '../src/api/inscripciones';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../src/contexts/ToastContext';
import { useRouter } from 'expo-router';

// Replicamos la función de formato de hora para usarla localmente
const formatTimeHHMM = (timeString: string | undefined): string => {
  if (!timeString) return '-';
  try {
    // Intenta formatear HH:MM (o HH:MM:SS) a un formato de 12h o 24h limpio
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  } catch {
    // Fallback si el formato es inválido
  }
  return timeString;
};


export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>({
    total_talleres: 0,
    total_alumnos: 0,
    total_profesores: 0,
    clases_hoy: [], // Esto se llenará con la lógica de abajo si la API principal falla
    asistencia_semanal: [],
  });

  const { isWeb, isMobile } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';
  const { showToast } = useToast();
  const router = useRouter();

  // Estados para modales
  const [modalNuevoAlumnoVisible, setModalNuevoAlumnoVisible] = useState(false);
  const [modalNuevaInscripcionVisible, setModalNuevaInscripcionVisible] = useState(false);
  const [modalNuevoTallerVisible, setModalNuevoTallerVisible] = useState(false);
  const [modalAccionesRapidasVisible, setModalAccionesRapidasVisible] = useState(false);
  const [modalDetalleClaseVisible, setModalDetalleClaseVisible] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] = useState<any>(null);

  // Estados para listas de datos
  const [listaAlumnos, setListaAlumnos] = useState<any[]>([]);
  const [listaTalleres, setListaTalleres] = useState<any[]>([]);

  // Estados para formularios
  const [formNuevoAlumno, setFormNuevoAlumno] = useState({
    nombres: '',
    edad: '',
    contacto: '',
  });
  const [formNuevaInscripcion, setFormNuevaInscripcion] = useState({
    estudiante_id: '',
    taller_id: '',
  });
  const [formNuevoTaller, setFormNuevoTaller] = useState({
    nombre: '',
    descripcion: '',
  });

  // Estados de loading para formularios
  const [loadingNuevoAlumno, setLoadingNuevoAlumno] = useState(false);
  const [loadingNuevaInscripcion, setLoadingNuevaInscripcion] = useState(false);
  const [loadingNuevoTaller, setLoadingNuevoTaller] = useState(false);
  const [loadingListas, setLoadingListas] = useState(false);

  const parseDateTime = (fecha: string | undefined, time: string | undefined) => {
    if (!fecha || !time) return null;
    const t = String(time).trim();
    const parts = t.split(':');
    if (parts.length < 2) return null;
    const hhmm = parts.slice(0, 2).join(':');
    try {
      // Intentamos crear una fecha en la zona horaria local o de la API
      // Nota: Si la API no usa ISO 8601 ni incluye Z, la interpretación puede variar.
      return new Date(fecha + 'T' + hhmm + ':00');
    } catch {
      return null;
    }
  };

  const cargar = async () => {
    setLoading(true);
    try {
      // Tu lógica de fetch de métricas (manteniendo la API original)
      const res = await fetch(`${API_URL}/api/dashboard.php`);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.datos);
      } else {
        console.warn('Dashboard error', json.mensaje);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cargarClasesSemana = async () => {
    try {
      // --- Cálculo de la semana y mapeo de días (Lógica Original) ---
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = ((day + 6) % 7);

      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const inicio = monday.toISOString().slice(0, 10);
      const fin = sunday.toISOString().slice(0, 10);

      const resH = await fetch(`${API_URL}/api/horarios.php?action=listar`);
      const jsonH = await resH.json();
      const horarios = (jsonH.status === 'success' && Array.isArray(jsonH.datos)) ? jsonH.datos : [];

      const resT = await fetch(`${API_URL}/api/talleres.php?action=listar`);
      const jsonT = await resT.json();
      let talleresMap: Record<string, any> = {};
      if (jsonT.status === 'success' && Array.isArray(jsonT.datos)) {
        jsonT.datos.forEach((t: any) => {
          talleresMap[String(t.id)] = t;
        });
      }
      
      const normalize = (s: string) => String(s || '').toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
        .replace(/ü/g, 'u').replace(/ñ/g, 'n').trim();

      const dayNamesOrder = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const start = new Date(inicio);
      const end = new Date(fin);
      const dateMap: Record<string, string[]> = {};
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const iso = `${year}-${month}-${day}`;
        const idx = d.getDay();
        const rawName = dayNamesOrder[idx];
        const name = normalize(rawName);
        if (!dateMap[name]) dateMap[name] = [];
        dateMap[name].push(iso);
      }

      const resolveDays = (raw: any) => {
        if (raw === null || raw === undefined) return [];
        const s = String(raw).trim();
        if (!s) return [];
        const parts = s.split(/[,;\/\s]+/).map((p) => p.trim()).filter(Boolean);
        const res: string[] = [];
        for (const p of parts) {
          if (/^\d+$/.test(p)) {
            const n = parseInt(p, 10);
            if (n >= 0 && n <= 6) res.push(dayNamesOrder[n]);
            else if (n >= 1 && n <= 7) res.push(dayNamesOrder[(n % 7)]);
            continue;
          }

          const low = normalize(p);
          for (const dn of dayNamesOrder) {
            const normDn = normalize(dn);
            if (dn === low || normDn === low || dn.startsWith(low) || normDn.startsWith(low) || low.startsWith(dn) || normDn.startsWith(low) ) {
              res.push(dn);
            }
          }
        }
        return Array.from(new Set(res));
      };

      const synthesized: any[] = [];
      horarios.forEach((h: any) => {
        const raw = h.dia_semana ?? h.dia ?? '';
        const dias = resolveDays(raw);
        if (!dias || dias.length === 0) return;
        dias.forEach((diaName: string) => {
          const dates = dateMap[normalize(diaName)] || []; // Usamos normalize aquí también
          dates.forEach((fecha) => {
            synthesized.push({
              id: `horario-${h.id}-${fecha}`,
              horario_id: h.id,
              taller_id: h.taller_id,
              taller_nombre: h.taller_nombre || h.nombre || talleresMap[String(h.taller_id)]?.nombre || '',
              fecha,
              hora_inicio: h.hora_inicio,
              hora_fin: h.hora_fin,
              profesor_nombre: h.profesor_nombre || h.profesor || '',
              ubicacion_nombre: h.ubicacion_nombre || h.ubicacion || '',
              cupos_max: h.cupos_max || null,
              presentes: 0,
              total_asistentes: h.cupos_max || 0,
            });
          });
        });
      });

      setData((prev: any) => ({ ...prev, clases_semana: synthesized, talleres_map: talleresMap }));
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    await cargarClasesSemana();
    setRefreshing(false);
  };

  const getClasesForToday = useCallback(() => {
    // Preferimos usar clases_semana si está disponible (procesada en cargarClasesSemana)
    const allClases = data.clases_semana || []; 
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Filtrar por clases que realmente caen hoy
    return allClases.filter((c: any) => c.fecha === todayStr)
      .map((c: any) => {
        const start = parseDateTime(c.fecha, c.hora_inicio);
        const end = parseDateTime(c.fecha, c.hora_fin);
        return { 
          ...c, 
          __start: start, 
          __end: end,
          hora_inicio_f: formatTimeHHMM(c.hora_inicio),
          hora_fin_f: formatTimeHHMM(c.hora_fin),
        };
      });
  }, [data.clases_semana]);

  useEffect(() => {
    (async () => {
      // Carga paralela inicial
      await Promise.all([cargar(), cargarClasesSemana()]);
    })();
  }, []);
  
  // --- Procesamiento de Clases (Optimizado con useMemo) ---
  const { clasesActuales, clasesProximas } = useMemo(() => {
    const now = new Date();
    const todayClases = getClasesForToday();

    const actual = todayClases.filter((c: any) => {
      if (!c.__start || !c.__end) return false;
      return c.__start <= now && now < c.__end;
    });

    const proximas = todayClases
      .filter((c: any) => c.__start && c.__start > now)
      .sort((a: any, b: any) => (a.__start as Date).getTime() - (b.__start as Date).getTime())
      .slice(0, 3); // Limitar a las 3 próximas

    return { clasesActuales: actual, clasesProximas: proximas };
  }, [getClasesForToday]);
  
  // --- Funciones de Modales (Mantienen la lógica original) ---

  const abrirModalNuevoEstudiante = () => {
    setFormNuevoAlumno({ nombres: '', edad: '', contacto: '' });
    setModalNuevoAlumnoVisible(true);
  };

  const abrirModalNuevaInscripcion = async () => {
    setFormNuevaInscripcion({ estudiante_id: '', taller_id: '' });
    setLoadingListas(true);
    
    try {
      const [alumnosData, talleresData] = await Promise.all([
        alumnosApi.listar(),
        talleresApi.listar(),
      ]);
      setListaAlumnos(alumnosData.map((a: any) => ({ label: a.nombre, value: String(a.id) })));
      setListaTalleres(talleresData.map((t: any) => ({ label: t.nombre, value: String(t.id) })));
    } catch (error) {
      console.error('Error cargando listas:', error);
      showToast('Error al cargar las listas', 'error');
    } finally {
      setLoadingListas(false);
    }
    
    setModalNuevaInscripcionVisible(true);
  };

  const abrirModalNuevoTaller = () => {
    setFormNuevoTaller({ nombre: '', descripcion: '' });
    setModalNuevoTallerVisible(true);
  };

  const crearNuevoAlumno = async () => {
    if (!formNuevoAlumno.nombres) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    setLoadingNuevoAlumno(true);
    try {
      await alumnosApi.crear({
        nombres: formNuevoAlumno.nombres,
        apellidos: '',
        edad: parseInt(formNuevoAlumno.edad) || undefined,
        telefono: formNuevoAlumno.contacto || undefined,
      });
      showToast('Alumno creado correctamente', 'success');
      setModalNuevoAlumnoVisible(false);
      await cargar();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoadingNuevoAlumno(false);
    }
  };

  const crearNuevaInscripcion = async () => {
    if (!formNuevaInscripcion.estudiante_id || !formNuevaInscripcion.taller_id) {
      showToast('Todos los campos son obligatorios', 'error');
      return;
    }

    setLoadingNuevaInscripcion(true);
    try {
      await inscripcionesApi.crear({
        estudiante_id: parseInt(formNuevaInscripcion.estudiante_id),
        taller_id: parseInt(formNuevaInscripcion.taller_id),
      });
      showToast('Inscripción creada correctamente', 'success');
      setModalNuevaInscripcionVisible(false);
      await cargar();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoadingNuevaInscripcion(false);
    }
  };

  const crearNuevoTaller = async () => {
    if (!formNuevoTaller.nombre) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    setLoadingNuevoTaller(true);
    try {
      await talleresApi.crear({
        nombre: formNuevoTaller.nombre,
        descripcion: formNuevoTaller.descripcion || undefined,
      });
      showToast('Taller creado correctamente', 'success');
      setModalNuevoTallerVisible(false);
      await cargar();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoadingNuevoTaller(false);
    }
  };

  // Preparar acciones rápidas y badges
  const clasesHoyCount = clasesActuales.length + clasesProximas.length;
  const talleresArray = data.talleres || data.talleres_list || [];
  const lowCapacityCount = (Array.isArray(talleresArray) ? talleresArray.filter((t: any) => {
    const total = Number(t.total_alumnos || t.total_asistentes || 0);
    const max = Number(t.cupos_maximos || t.cupos_max || t.cupo || 30);
    if (!max) return false;
    return (total / max) >= 0.8;
  }).length : 0);

  const quickActions: QuickAction[] = [
    { 
      id: 'nuevo_estudiante', 
      label: 'Nuevo estudiante', 
      icon: 'person-add-outline', 
      onPress: abrirModalNuevoEstudiante,
      variant: 'primary',
    },
    { 
      id: 'nueva_inscripcion', 
      label: 'Nueva inscripción', 
      icon: 'add-circle-outline', 
      onPress: abrirModalNuevaInscripcion,
      variant: 'secondary',
    },
    { 
      id: 'marcar_asistencia', 
      label: 'Marcar asistencia', 
      icon: 'checkmark-circle-outline', 
      onPress: () => router.push('/asistencia'),
      variant: 'success',
    },
    { 
      id: 'ver_clases', 
      label: 'Ver clases del día', 
      icon: 'calendar-outline', 
      onPress: () => router.push('/horarios'),
      variant: 'warning',
    },
  ];

  if (isAdmin) {
    quickActions.push({ 
      id: 'nuevo_taller', 
      label: 'Nuevo taller', 
      icon: 'book-outline', 
      onPress: abrirModalNuevoTaller,
      variant: 'primary',
    });
    quickActions.push({ 
      id: 'ver_reportes', 
      label: 'Ver reportes', 
      icon: 'stats-chart-outline', 
      onPress: () => router.push('/reportes'),
      variant: 'secondary',
    });
  }

  const actions: any[] = [
    { key: 'clases_hoy', icon: 'calendar-outline', title: 'Clases de hoy', badge: clasesHoyCount, onPress: () => router.push('/horarios') },
    { key: 'nuevo_estudiante', icon: 'person-add-outline', title: 'Nuevo estudiante', onPress: abrirModalNuevoEstudiante },
    { key: 'nueva_inscripcion', icon: 'add-circle-outline', title: 'Nueva inscripción', onPress: abrirModalNuevaInscripcion },
  ];

  if (lowCapacityCount > 0) {
    actions.splice(1, 0, { key: 'talleres_criticos', icon: 'warning-outline', title: 'Talleres críticos', badge: lowCapacityCount, onPress: () => router.push('/talleres?filter=low_capacity') });
  }

  if (isAdmin) {
    actions.push({ key: 'ver_asistencias', icon: 'eye-outline', title: 'Ver asistencias', onPress: () => router.push('/asistencia') });
    actions.push({ key: 'nuevo_taller', icon: 'book-outline', title: 'Nuevo taller', onPress: abrirModalNuevoTaller });
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, padding: spacing.md, backgroundColor: colors.background.tertiary }}>
        <Text style={{ fontSize: typography.sizes.xxl, fontWeight: '700', marginBottom: spacing.lg, color: colors.text.primary }}>
          Dashboard
        </Text>
        <View style={styles.metricsGrid}>
          <CardSkeleton count={4} isWeb={isWeb} />
        </View>
      </SafeAreaView>
    );
  }

  const Container: any = isWeb ? View : SafeAreaView;
  const totalClasesSemana = data.clases_semana?.length || 0;
  
  // --- Componente de Tarjeta de Clase (Estilo minimalista unificado) ---
  const renderClassCard = (clase: any, status: 'current' | 'upcoming') => {
    const accentColor = status === 'current' ? colors.success : colors.info;
    const accentSoft = status === 'current' ? colors.successLight : colors.infoLight;
    const accentDark = status === 'current' ? colors.success : colors.blue.dark;

    return (
      <TouchableOpacity
        key={clase.id}
        style={[styles.classCard, { borderLeftColor: accentColor }]}
        onPress={() => {
          setClaseSeleccionada(clase);
          setModalDetalleClaseVisible(true);
        }}
        activeOpacity={0.7}
      >
        {/* Bloque de Tiempo */}
        <View style={[styles.cardTimeBlock, { backgroundColor: accentSoft }]}>
          <Text style={[styles.cardTimeText, { color: accentDark }]}>{formatTimeHHMM(clase.hora_inicio)}</Text>
          <Text style={[styles.cardTimeDivider, { color: accentColor }]}>-</Text>
          <Text style={[styles.cardTimeText, { color: accentDark }]}>{formatTimeHHMM(clase.hora_fin)}</Text>
        </View>

        {/* Información Principal */}
        <View style={styles.cardInfo}>

          <Text style={styles.cardTallerName} numberOfLines={1}>{clase.taller_nombre}</Text>

          {clase.profesor_nombre && (
            <View style={styles.cardDetailRow}>
              <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.cardDetailText} numberOfLines={1}>
                {clase.profesor_nombre}
              </Text>
            </View>
          )}

          {clase.ubicacion_nombre && (
            <View style={styles.cardDetailRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.cardDetailText} numberOfLines={1}>
                {clase.ubicacion_nombre}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Container style={[sharedStyles.container, { backgroundColor: colors.background.tertiary }]} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl * 1.5 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>

          {/* Cards KPI (Usando el estilo unificado) */}
          <View style={styles.metricsGrid}>
            {(() => {
              const metrics = [
                { key: 'talleres', title: 'Talleres', value: data.total_talleres || 0, icon: 'book-outline', accent: colors.warning, onPress: () => router.push('/talleres') },
                { key: 'Alumnos', title: 'Alumnos', value: data.total_alumnos || 0, icon: 'people-outline', accent: colors.primary, onPress: () => router.push('/alumnos') },
                { key: 'profesores', title: 'Profesores', value: data.total_profesores || 0, icon: 'person-outline', accent: colors.success, onPress: () => router.push('/profesores') },
                { key: 'clases_totales', title: 'Clases Semana', value: totalClasesSemana || 0, icon: 'calendar-outline', accent: colors.info, onPress: () => router.push('/horarios') },
              ];

              return metrics.map((m) => (
                <TouchableOpacity 
                  key={m.key} 
                  style={[styles.metricCard, { borderLeftColor: m.accent, flex: 1, minWidth: isMobile ? '48%' : '23%' }]}
                  onPress={m.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.metricIcon, { backgroundColor: m.accent + '20' }]}>
                    <Ionicons name={m.icon as any} size={20} color={m.accent} />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{m.value}</Text>
                    <Text style={styles.metricLabel}>{m.title}</Text>
                  </View>
                </TouchableOpacity>
              ));
            })()}
          </View>

          {/* Acciones rápidas */}
          <View style={styles.quickActionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Acciones rápidas</Text>
              <TouchableOpacity
                style={styles.verTodasButton}
                onPress={() => setModalAccionesRapidasVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.verTodasText}>Ver todas</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.quickActionsGrid}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.quickActionButton}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={action.icon as any} size={18} color={colors.text.secondary} />
                  <Text style={styles.quickActionText}>{action.title}</Text>
                  {action.badge > 0 && (
                    <View style={{ marginLeft: spacing.xs }}>
                      <Badge label={String(action.badge)} variant={action.key === 'talleres_criticos' ? 'error' : 'info'} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Clases actuales y próximas */}
          <Text style={styles.sectionTitle}>Clases de hoy</Text>
          
          {/* Clases en curso */}
          {clasesActuales && clasesActuales.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Clases en curso ({clasesActuales.length})</Text>
              <View style={styles.currentClassesContainer}>
                {clasesActuales.map((c: any) => renderClassCard(c, 'current'))}
              </View>
            </>
          )}

          {/* No hay clases en curso actualmente */}
          {clasesActuales.length === 0 && clasesProximas.length > 0 && (
            <View style={styles.noCurrentClasses}>
              <Ionicons name="time-outline" size={24} color={colors.info} style={{ marginBottom: spacing.xs }} />
              <Text style={styles.noCurrentClassesText}>No hay clases en curso en este momento</Text>
              <Text style={styles.noCurrentClassesSubtext}>Las próximas clases comenzarán pronto</Text>
            </View>
          )}

          {/* Próximas clases */}
          {clasesProximas && clasesProximas.length > 0 && (
            <View>
              <Text style={styles.subsectionTitle}>Próximas clases ({clasesProximas.length})</Text>
              <View style={styles.currentClassesContainer}>
                {clasesProximas.map((c: any) => renderClassCard(c, 'upcoming'))}
              </View>
            </View>
          )}

          {/* No hay clases hoy */}
          {clasesActuales.length === 0 && clasesProximas.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="sunny-outline" size={32} color={colors.text.tertiary} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.emptyStateText}>No hay clases programadas para hoy.</Text>
            </View>
          )}
        </ScrollView>

        {/* Modales (Usando ElegantModal) */}
        <Modal
          visible={modalNuevoAlumnoVisible}
          onClose={() => setModalNuevoAlumnoVisible(false)}
          title="Nuevo Alumno"
          maxWidth={isWeb ? 600 : undefined}
          footer={
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalNuevoAlumnoVisible(false)}
                activeOpacity={0.7}
                disabled={loadingNuevoAlumno}
              >
                <Text style={styles.modalFooterButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={[styles.modalFooterButton, { backgroundColor: loadingNuevoAlumno ? colors.background.secondary : colors.primarySoft }]}
                onPress={crearNuevoAlumno}
                activeOpacity={0.7}
                disabled={loadingNuevoAlumno}
              >
                {loadingNuevoAlumno ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Text style={[styles.modalFooterButtonText, { color: colors.primary }]}>Crear</Text>
                )}
              </TouchableOpacity>
            </>
          }
        >
          <Input
            label="Nombre"
            required
            value={formNuevoAlumno.nombres}
            onChangeText={(text) => setFormNuevoAlumno({ ...formNuevoAlumno, nombres: text })}
            placeholder="Nombre completo"
          />
          <Input
            label="Edad"
            value={formNuevoAlumno.edad}
            onChangeText={(text) => setFormNuevoAlumno({ ...formNuevoAlumno, edad: text.replace(/[^0-9]/g, '') })}
            placeholder="Edad (opcional)"
            keyboardType="numeric"
          />
          <Input
            label="Contacto"
            value={formNuevoAlumno.contacto}
            onChangeText={(text) => setFormNuevoAlumno({ ...formNuevoAlumno, contacto: text })}
            placeholder="Teléfono o email (opcional)"
          />
        </Modal>

        <Modal
          visible={modalNuevaInscripcionVisible}
          onClose={() => setModalNuevaInscripcionVisible(false)}
          title="Nueva Inscripción"
          maxWidth={isWeb ? 600 : undefined}
          footer={
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalNuevaInscripcionVisible(false)}
                activeOpacity={0.7}
                disabled={loadingNuevaInscripcion || loadingListas}
              >
                <Text style={styles.modalFooterButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={[styles.modalFooterButton, { backgroundColor: loadingNuevaInscripcion || loadingListas ? colors.background.secondary : colors.primarySoft }]}
                onPress={crearNuevaInscripcion}
                activeOpacity={0.7}
                disabled={loadingNuevaInscripcion || loadingListas}
              >
                {loadingNuevaInscripcion || loadingListas ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Text style={[styles.modalFooterButtonText, { color: colors.primary }]}>Crear</Text>
                )}
              </TouchableOpacity>
            </>
          }
        >
          {loadingListas ? (
            <View style={{ alignItems: 'center', padding: spacing.lg }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: spacing.md, color: colors.text.secondary }}>Cargando listas...</Text>
            </View>
          ) : (
            <>
              <View style={sharedStyles.inputContainer}>
                <Text style={sharedStyles.label}>Estudiante *</Text>
                <Select
                  label=""
                  value={formNuevaInscripcion.estudiante_id}
                  onValueChange={(value) => setFormNuevaInscripcion({ ...formNuevaInscripcion, estudiante_id: String(value) })}
                  items={listaAlumnos}
                />
              </View>
              <View style={sharedStyles.inputContainer}>
                <Text style={sharedStyles.label}>Taller *</Text>
                <Select
                  label=""
                  value={formNuevaInscripcion.taller_id}
                  onValueChange={(value) => setFormNuevaInscripcion({ ...formNuevaInscripcion, taller_id: String(value) })}
                  items={listaTalleres}
                />
              </View>
            </>
          )}
        </Modal>

        <Modal
          visible={modalNuevoTallerVisible}
          onClose={() => setModalNuevoTallerVisible(false)}
          title="Nuevo Taller"
          maxWidth={isWeb ? 600 : undefined}
          footer={
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalNuevoTallerVisible(false)}
                activeOpacity={0.7}
                disabled={loadingNuevoTaller}
              >
                <Text style={styles.modalFooterButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={[styles.modalFooterButton, { backgroundColor: loadingNuevoTaller ? colors.background.secondary : colors.primarySoft }]}
                onPress={crearNuevoTaller}
                activeOpacity={0.7}
                disabled={loadingNuevoTaller}
              >
                {loadingNuevoTaller ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Text style={[styles.modalFooterButtonText, { color: colors.primary }]}>Crear</Text>
                )}
              </TouchableOpacity>
            </>
          }
        >
          <Input
            label="Nombre"
            required
            value={formNuevoTaller.nombre}
            onChangeText={(text) => setFormNuevoTaller({ ...formNuevoTaller, nombre: text })}
            placeholder="Nombre del taller"
          />
          <Input
            label="Descripción"
            value={formNuevoTaller.descripcion}
            onChangeText={(text) => setFormNuevoTaller({ ...formNuevoTaller, descripcion: text })}
            placeholder="Descripción del taller (opcional)"
            multiline
            numberOfLines={3}
          />
        </Modal>

        {/* Modal de Acciones Rápidas */}
        <Modal
          visible={modalAccionesRapidasVisible}
          onClose={() => setModalAccionesRapidasVisible(false)}
          title="Acciones rápidas"
          maxWidth={isWeb ? 700 : undefined}
        >
          <QuickActionsMenu actions={quickActions} />
        </Modal>

        {/* Modal de Detalle de Clase */}
        <Modal
          visible={modalDetalleClaseVisible}
          onClose={() => setModalDetalleClaseVisible(false)}
          title="Detalle de clase"
          maxWidth={isWeb ? 600 : undefined}
        >
          {claseSeleccionada && (
            <View style={{ gap: spacing.lg }}>
              <View>
                <Text style={styles.detalleLabel}>Taller</Text>
                <Text style={styles.detalleValue}>{claseSeleccionada.taller_nombre}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detalleLabel}>Hora inicio</Text>
                  <Text style={styles.detalleValue}>{formatTimeHHMM(claseSeleccionada.hora_inicio)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detalleLabel}>Hora fin</Text>
                  <Text style={styles.detalleValue}>{formatTimeHHMM(claseSeleccionada.hora_fin)}</Text>
                </View>
              </View>

              {claseSeleccionada.profesor_nombre && (
                <View>
                  <Text style={styles.detalleLabel}>Profesor</Text>
                  <Text style={styles.detalleValue}>{claseSeleccionada.profesor_nombre}</Text>
                </View>
              )}

              {claseSeleccionada.ubicacion_nombre && (
                <View>
                  <Text style={styles.detalleLabel}>Ubicación</Text>
                  <Text style={styles.detalleValue}>{claseSeleccionada.ubicacion_nombre}</Text>
                </View>
              )}

              {claseSeleccionada.cupos_max && (
                <View>
                  <Text style={styles.detalleLabel}>Capacidad</Text>
                  <Text style={styles.detalleValue}>
                    {claseSeleccionada.total_asistentes || 0} / {claseSeleccionada.cupos_max} alumnos
                  </Text>
                </View>
              )}

              <View style={styles.detalleActions}>
                <TouchableOpacity
                  style={[styles.detalleButton, { backgroundColor: colors.primarySoft }]}
                  onPress={() => {
                    setModalDetalleClaseVisible(false);
                    router.push('/asistencia');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  <Text style={[styles.detalleButtonText, { color: colors.primary }]}>Marcar asistencia</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.detalleButton, { backgroundColor: colors.background.secondary }]}
                  onPress={() => {
                    setModalDetalleClaseVisible(false);
                    router.push('/horarios');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.text.primary} />
                  <Text style={styles.detalleButtonText}>Ver horario</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    textTransform: 'capitalize',
  },

  // Métricas
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 4, // Borde de acento
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    // Sombra sutil minimalista
    ...(Platform.OS === 'web' && { 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },

  // Acciones rápidas
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verTodasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verTodasText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flex: 1,
    minWidth: '48%',
    // Sombra sutil minimalista
    ...(Platform.OS === 'web' && { 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  quickActionText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },

  // Sección de clases
  classesSection: {
    marginBottom: spacing.xl,
    // Estilo de tarjeta grande para envolver
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...(Platform.OS === 'web' && { 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }),
  },
  subsectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.xs,
  },

  // Clases en curso y próximas (unificadas en estilo)
  currentClassesContainer: {
    gap: spacing.sm,
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 4, 
  },
  cardTimeBlock: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  cardTimeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  cardTimeDivider: {
    fontSize: typography.sizes.sm,
  },
  cardInfo: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  cardTallerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDetailText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  currentClassBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
  },
  currentClassBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  // Empty State
  emptyState: {
    backgroundColor: colors.background.secondary,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weights.medium,
  },

  // No current classes state
  noCurrentClasses: {
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.info,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  noCurrentClassesText: {
    fontSize: typography.sizes.sm,
    color: colors.info,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  noCurrentClassesSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },

  // Modal footer buttons - estilo unificado
  modalFooterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: colors.background.primary,
    // Aseguramos que el texto del botón sea legible y el color de fondo cambie en los principales
  },
  modalFooterButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary, // Color base
  },
  footerDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },

  // Estilos para modal de detalle de clase
  detalleLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detalleValue: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  detalleActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detalleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  detalleButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});
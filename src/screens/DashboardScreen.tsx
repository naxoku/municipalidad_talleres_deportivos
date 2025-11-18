import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Alert, Platform, RefreshControl, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, handleApiResponse, getHeaders } from '../api/config';
import MetricCard from '../components/MetricCard';
import QuickActions from '../components/QuickActions';
import { ProgressBar } from '../components/ProgressBar';
import { Badge } from '../components/Badge';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useResponsive } from '../hooks/useResponsive';
import { sharedStyles } from '../theme/sharedStyles';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { estudiantesApi } from '../api/estudiantes';
import { talleresApi } from '../api/talleres';
import { inscripcionesApi } from '../api/inscripciones';
import { asistenciaApi } from '../api/asistencia';
import { useAuth } from '../contexts/AuthContext';



export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>({
    total_talleres: 0,
    total_estudiantes: 0,
    total_profesores: 0,
    clases_hoy: [],
    asistencia_semanal: [],
  });
  const { isWeb, isDesktop, isMobile, width } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  const cargar = async () => {
    setLoading(true);
    try {
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

      const synthesized: any[] = [];

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

      horarios.forEach((h: any) => {
        const raw = h.dia_semana ?? h.dia ?? '';
        const dias = resolveDays(raw);
        if (!dias || dias.length === 0) return;
        dias.forEach((diaName: string) => {
          const dates = dateMap[diaName] || [];
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
    setRefreshing(false);
  };

  // Quick-action modal states
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ nombre: '', email: '', telefono: '' });
  const [showNewInscriptionModal, setShowNewInscriptionModal] = useState(false);
  const [inscriptionForm, setInscriptionForm] = useState({ estudianteId: '', tallerId: '' });
  const [estudiantesList, setEstudiantesList] = useState<any[]>([]);
  const [talleresList, setTalleresList] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showNewTallerModal, setShowNewTallerModal] = useState(false);
  const [tallerForm, setTallerForm] = useState({ nombre: '', descripcion: '' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [estudianteSearch, setEstudianteSearch] = useState('');
  const [tallerSearch, setTallerSearch] = useState('');

  useEffect(() => {
    (async () => {
      await cargar();
      await cargarClasesSemana();
    })();
  }, []);

  const abrirModalNuevoEstudiante = () => {
    setStudentForm({ nombre: '', email: '', telefono: '' });
    setShowNewStudentModal(true);
  };

  const submitNuevoEstudiante = async () => {
    if (!studentForm.nombre) { Alert.alert('Nombre requerido'); return; }
    try {
      setActionLoading(true);
      // API expects Estudiante shape (nombre, edad?, contacto?)
      const contacto = studentForm.telefono || studentForm.email || '';
      const resp = await estudiantesApi.crear({ nombre: studentForm.nombre, contacto });
      if (resp.status === 'success') {
        Alert.alert('Éxito', 'Estudiante creado');
        setShowNewStudentModal(false);
        await cargar();
      } else {
        Alert.alert('Error', resp.mensaje || 'No se pudo crear');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || String(e));
    } finally { setActionLoading(false); }
  };

  const abrirModalNuevaInscripcion = async () => {
    setInscriptionForm({ estudianteId: '', tallerId: '' });
    try {
      setActionLoading(true);
      const [ests, talls] = await Promise.all([estudiantesApi.listar(), talleresApi.listar()]);
      setEstudiantesList(ests || []);
      setTalleresList(talls || []);
      setShowNewInscriptionModal(true);
    } catch (e) {
      console.error(e);
      Alert.alert('Error cargando datos');
    } finally { setActionLoading(false); }
  };

  const submitNuevaInscripcion = async () => {
    if (!inscriptionForm.estudianteId || !inscriptionForm.tallerId) { Alert.alert('Selecciona estudiante y taller'); return; }
    try {
      setActionLoading(true);
      const resp = await inscripcionesApi.crear({ estudiante_id: Number(inscriptionForm.estudianteId), taller_id: Number(inscriptionForm.tallerId) });
      if (resp.status === 'success') {
        Alert.alert('Éxito', 'Inscripción creada');
        setShowNewInscriptionModal(false);
        await cargar();
      } else {
        Alert.alert('Error', resp.mensaje || 'No se pudo crear la inscripción');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || String(e));
    } finally { setActionLoading(false); }
  };

  const abrirModalNuevoTaller = () => {
    setTallerForm({ nombre: '', descripcion: '' });
    setShowNewTallerModal(true);
  };

  const submitNuevoTaller = async () => {
    if (!tallerForm.nombre) { Alert.alert('Nombre requerido'); return; }
    try {
      setActionLoading(true);
      const resp = await talleresApi.crear({ nombre: tallerForm.nombre, descripcion: tallerForm.descripcion });
      if (resp.status === 'success') {
        Alert.alert('Éxito', 'Taller creado');
        setShowNewTallerModal(false);
        await cargar();
      } else {
        Alert.alert('Error', resp.mensaje || 'No se pudo crear el taller');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || String(e));
    } finally { setActionLoading(false); }
  };

  const getClasesForToday = (d: any) => {
    if (Array.isArray(d.clases_hoy) && d.clases_hoy.length > 0) return d.clases_hoy;

    const talleres = d.talleres || d.talleres_list || [];
    if (!Array.isArray(talleres) || talleres.length === 0) return [];

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const todayName = dayNames[today.getDay()];
    const dayNum = today.getDay();

    const clases: any[] = [];

    talleres.forEach((t: any) => {
      const horarios = t.horarios || t.horario || t.horas || [];
      if (!Array.isArray(horarios)) return;

      horarios.forEach((h: any) => {
        let match = false;

        if (h.fecha) {
          try {
            if (new Date(h.fecha).toISOString().slice(0, 10) === todayStr) match = true;
          } catch (e) {}
        }

        if (!match && (h.dia_semana || h.dia || h.weekday || h.diaSemana)) {
          const v = h.dia_semana ?? h.dia ?? h.weekday ?? h.diaSemana;
          const num = parseInt(String(v));
          if (!isNaN(num)) {
            if (num === dayNum || num === dayNum + 1 || (num === 7 && dayNum === 0)) match = true;
          } else {
            const name = String(v).toLowerCase();
            if (name.includes(todayName) || (todayName === 'miércoles' && name.includes('miercoles'))) match = true;
          }
        }

        if (!match && Array.isArray(h.dias)) {
          const lower = h.dias.map((x: any) => String(x).toLowerCase());
          if (lower.includes(todayName) || lower.includes(String(dayNum))) match = true;
        }

        if (!match && Array.isArray(h.dias_semana)) {
          const lower = h.dias_semana.map((x: any) => String(x).toLowerCase());
          if (lower.includes(todayName) || lower.includes(String(dayNum))) match = true;
        }

        if (match) {
          clases.push({
            id: `${t.id ?? t.taller_id ?? t.key ?? Math.random()}` + (h.id ? `-${h.id}` : ''),
            taller_nombre: t.nombre || t.taller_nombre || t.title || 'Taller',
            hora_inicio: h.hora_inicio || h.hora || h.start_time || h.horaInicio || '',
            hora_fin: h.hora_fin || h.hora_fin_hasta || h.end_time || h.horaFin || '',
            presentes: h.presentes ?? h.asistentes_presentes ?? 0,
            total_asistentes: h.total_asistentes ?? h.cupo ?? h.capacity ?? 0,
          });
        }
      });
    });

    return clases;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, padding: spacing.md, backgroundColor: '#F8FAFB' }}>
        <Text style={{ fontSize: typography.sizes.xxl, fontWeight: '700', marginBottom: spacing.lg }}>
          Dashboard
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  const Container: any = isWeb ? View : SafeAreaView;

  const parseDateTime = (fecha: string | undefined, time: string | undefined) => {
    if (!fecha || !time) return null;
    const t = String(time).trim();
    const parts = t.split(':');
    if (parts.length < 2) return null;
    const hhmm = parts.slice(0, 2).join(':');
    try {
      return new Date(fecha + 'T' + hhmm + ':00');
    } catch (e) {
      return null;
    }
  };

  const clasesSemana = (data.clases_semana || []).map((c: any) => {
    const start = parseDateTime(c.fecha, c.hora_inicio);
    const end = parseDateTime(c.fecha, c.hora_fin);
    return { ...c, __start: start, __end: end };
  });

  const now = new Date();
  
  const clasesActuales = clasesSemana.filter((c: any) => {
    if (!c.__start || !c.__end) return false;
    return c.__start <= now && now < c.__end;
  });

  const clasesProximas = clasesSemana
    .filter((c: any) => c.__start && c.__start > now)
    .sort((a: any, b: any) => (a.__start as Date).getTime() - (b.__start as Date).getTime())
    .slice(0, 3);

  // Prepare quick actions and badges
  const clasesHoyCount = getClasesForToday(data).length;
  const talleresArray = data.talleres || data.talleres_list || [];
  const lowCapacityCount = (Array.isArray(talleresArray) ? talleresArray.filter((t: any) => {
    const total = Number(t.total_estudiantes || t.total_asistentes || 0);
    const max = Number(t.cupos_maximos || t.cupos_max || t.cupo || 30);
    if (!max) return false;
    return (total / max) >= 0.8;
  }).length : 0);

  const actions: any[] = [
    { key: 'clases_hoy', icon: 'calendar-outline', title: 'Clases Hoy', badge: clasesHoyCount, onPress: () => navigation.navigate('Horarios') },
    { key: 'nuevo_estudiante', icon: 'person-add-outline', title: 'Nuevo Estudiante', onPress: abrirModalNuevoEstudiante },
    { key: 'nueva_inscripcion', icon: 'add-circle-outline', title: 'Nueva Inscripción', onPress: abrirModalNuevaInscripcion },
  ];

  // Talleres críticos / alta demanda
  if (lowCapacityCount > 0) {
    actions.splice(1, 0, { key: 'talleres_criticos', icon: 'warning-outline', title: 'Talleres Críticos', badge: lowCapacityCount, onPress: () => navigation.navigate('Talleres', { filter: 'low_capacity' }) });
  }

  if (isAdmin) {
    // Admin-specific quick actions
    actions.push({ key: 'ver_asistencias', icon: 'eye-outline', title: 'Ver Asistencias', onPress: () => navigation.navigate('Asistencia') });
    actions.push({ key: 'nuevo_taller', icon: 'book-outline', title: 'Nuevo Taller', onPress: abrirModalNuevoTaller });
    actions.push({ key: 'export_csv', icon: 'download-outline', title: 'Exportar CSV', onPress: () => setShowExportModal(true) });
  }

  return (
    <Container style={[sharedStyles.container, { backgroundColor: '#F8FAFB' }]} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
          }
        >
          {/* Header minimalista */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>

          {/* KPI Cards minimalistas */}
          <View style={styles.metricsGrid}>
            {(() => {
              const clasesHoy = getClasesForToday(data);
              const totalClases = data.total_clases || (Array.isArray(data.clases_semana) ? data.clases_semana.length : clasesSemana.length);
              const metrics = [
                { key: 'talleres', title: 'Talleres', value: data.total_talleres || 0, icon: 'book-outline', onPress: () => navigation.navigate('Talleres') },
                { key: 'estudiantes', title: 'Estudiantes', value: data.total_estudiantes || 0, icon: 'people-outline', onPress: () => navigation.navigate('Estudiantes') },
                { key: 'profesores', title: 'Profesores', value: data.total_profesores || 0, icon: 'person-outline', onPress: () => navigation.navigate('Profesores') },
                { key: 'clases_totales', title: 'Clases Totales', value: totalClases || 0, icon: 'calendar-outline', onPress: () => navigation.navigate('Horarios') },
              ];

              return metrics.map((m) => (
                <TouchableOpacity 
                  key={m.key} 
                  style={[styles.metricCard, isMobile && { flex: 1, minWidth: '48%' }]}
                  onPress={m.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Ionicons name={m.icon as any} size={20} color="#6B7280" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{m.value}</Text>
                    <Text style={styles.metricLabel}>{m.title}</Text>
                  </View>
                </TouchableOpacity>
              ));
            })()}
          </View>

          {/* Quick Actions minimalistas */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Acciones rápidas</Text>
            <View style={styles.quickActionsGrid}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.quickActionButton}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={action.icon as any} size={18} color="#6B7280" />
                  <Text style={styles.quickActionText}>{action.title}</Text>
                  {action.badge > 0 && (
                    <View style={{ marginLeft: 8 }}>
                      <Badge label={String(action.badge)} variant={action.badge > 0 ? 'info' : 'default'} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Clases actuales y próximas */}
          <View style={styles.classesSection}>
            <Text style={styles.sectionTitle}>Clases de hoy</Text>

            {/* Current classes */}
            {clasesActuales && clasesActuales.length > 0 ? (
              <View style={styles.currentClassesContainer}>
                {clasesActuales.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.currentClassCard}
                    onPress={() => navigation.navigate('Horarios')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.currentClassBadge}>
                      <Text style={styles.currentClassBadgeText}>EN CURSO</Text>
                    </View>
                    
                    <Text style={styles.classTime}>
                      {c.hora_inicio} - {c.hora_fin}
                    </Text>
                    
                    <Text style={styles.className}>{c.taller_nombre}</Text>
                    
                    <View style={styles.classInfo}>
                      {c.profesor_nombre && (
                        <View style={styles.classInfoRow}>
                          <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                          <Text style={styles.classInfoText}>{c.profesor_nombre}</Text>
                        </View>
                      )}
                      {c.ubicacion_nombre && (
                        <View style={styles.classInfoRow}>
                          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                          <Text style={styles.classInfoText}>{c.ubicacion_nombre}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay clases en este momento</Text>
              </View>
            )}

            {/* Upcoming classes */}
            {clasesProximas && clasesProximas.length > 0 && (
              <View style={styles.upcomingSection}>
                <Text style={styles.subsectionTitle}>Próximas clases</Text>
                {clasesProximas.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.upcomingClassCard}
                    onPress={() => navigation.navigate('Horarios')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.upcomingClassTime}>
                      {c.hora_inicio} - {c.hora_fin}
                    </Text>
                    
                    <Text style={styles.upcomingClassName}>{c.taller_nombre}</Text>
                    
                    <View style={styles.upcomingClassInfo}>
                      {c.profesor_nombre && (
                        <Text style={styles.upcomingInfoText}>
                          <Ionicons name="person-outline" size={12} color="#9CA3AF" /> {c.profesor_nombre}
                        </Text>
                      )}
                      {c.ubicacion_nombre && (
                        <Text style={styles.upcomingInfoText}>
                          <Ionicons name="location-outline" size={12} color="#9CA3AF" /> {c.ubicacion_nombre}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

        </ScrollView>

        {/* New Student Modal */}
        <Modal
          visible={showNewStudentModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNewStudentModal(false)}
        >
          <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
            <SafeAreaView
              style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]}
              edges={isWeb ? [] : ['bottom']}
            >
              <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent, { maxHeight: isWeb ? 700 : '85%', width: isWeb ? 760 : undefined }]}>
                <View style={sharedStyles.modalHeader}>
                  <Text style={sharedStyles.modalTitle}>Nuevo Estudiante</Text>
                </View>

                <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                  <Input
                    label="Nombre"
                    required
                    value={studentForm.nombre}
                    onChangeText={(text) => setStudentForm({ ...studentForm, nombre: text })}
                    placeholder="Nombre del estudiante"
                  />

                  <Input
                    label="Teléfono"
                    value={studentForm.telefono}
                    onChangeText={(text) => setStudentForm({ ...studentForm, telefono: text })}
                    placeholder="Teléfono"
                  />

                  <Input
                    label="Email"
                    value={studentForm.email}
                    onChangeText={(text) => setStudentForm({ ...studentForm, email: text })}
                    placeholder="Correo electrónico"
                  />
                </ScrollView>

                <View style={sharedStyles.modalFooter}>
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    onPress={() => setShowNewStudentModal(false)}
                    style={sharedStyles.modalButton}
                  />
                  <Button
                    title="Crear"
                    variant="success"
                    onPress={submitNuevoEstudiante}
                    loading={actionLoading}
                    style={sharedStyles.modalButton}
                  />
                </View>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* New Taller Modal */}
        <Modal
          visible={showNewTallerModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNewTallerModal(false)}
        >
          <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
            <SafeAreaView
              style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]}
              edges={isWeb ? [] : ['bottom']}
            >
              <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent, { maxHeight: isWeb ? 700 : '85%', width: isWeb ? 760 : undefined }]}>
                <View style={sharedStyles.modalHeader}>
                  <Text style={sharedStyles.modalTitle}>Nuevo Taller</Text>
                </View>

                <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                  <Input
                    label="Nombre"
                    required
                    value={tallerForm.nombre}
                    onChangeText={(text) => setTallerForm({ ...tallerForm, nombre: text })}
                    placeholder="Nombre del taller"
                  />

                  <Input
                    label="Descripción"
                    value={tallerForm.descripcion}
                    onChangeText={(text) => setTallerForm({ ...tallerForm, descripcion: text })}
                    placeholder="Descripción (opcional)"
                    multiline
                    numberOfLines={3}
                  />
                </ScrollView>

                <View style={sharedStyles.modalFooter}>
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    onPress={() => setShowNewTallerModal(false)}
                    style={sharedStyles.modalButton}
                  />
                  <Button
                    title="Crear Taller"
                    variant="success"
                    onPress={submitNuevoTaller}
                    loading={actionLoading}
                    style={sharedStyles.modalButton}
                  />
                </View>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* New Inscription Modal */}
        <Modal
          visible={showNewInscriptionModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNewInscriptionModal(false)}
        >
          <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
            <SafeAreaView
              style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]}
              edges={isWeb ? [] : ['bottom']}
            >
              <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent, { maxHeight: isWeb ? 700 : '85%', width: isWeb ? 760 : undefined }]}>
                <View style={sharedStyles.modalHeader}>
                  <Text style={sharedStyles.modalTitle}>Nueva Inscripción</Text>
                </View>

                <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={sharedStyles.inputContainer}>
                    <Text style={sharedStyles.label}>Estudiante</Text>
                      <Select
                        label="Estudiante"
                        value={inscriptionForm.estudianteId || ''}
                        onValueChange={(v: any) => setInscriptionForm({ ...inscriptionForm, estudianteId: String(v) })}
                        items={(estudiantesList || []).map((e: any) => ({ label: e.nombre, value: e.id }))}
                      />
                  </View>

                  <View style={sharedStyles.inputContainer}>
                    <Text style={sharedStyles.label}>Taller</Text>
                    <Select
                      label="Taller"
                      value={inscriptionForm.tallerId || ''}
                      onValueChange={(v: any) => setInscriptionForm({ ...inscriptionForm, tallerId: String(v) })}
                      items={(talleresList || []).map((t: any) => ({ label: t.nombre, value: t.id }))}
                    />
                  </View>
                </ScrollView>

                <View style={sharedStyles.modalFooter}>
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    onPress={() => setShowNewInscriptionModal(false)}
                    style={sharedStyles.modalButton}
                  />
                  <Button
                    title="Crear Inscripción"
                    variant="success"
                    onPress={submitNuevaInscripcion}
                    loading={actionLoading}
                    style={sharedStyles.modalButton}
                  />
                </View>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

      </View>

      {/* Export Modal (admin) */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={[sharedStyles.modalOverlay, isWeb && sharedStyles.webModalOverlay]}>
          <SafeAreaView style={[sharedStyles.modalSafeArea, isWeb && sharedStyles.webModalSafeArea]} edges={isWeb ? [] : ['bottom']}>
            <View style={[sharedStyles.modalContent, isWeb && sharedStyles.webModalContent, { maxHeight: isWeb ? 700 : '85%', width: isWeb ? 760 : undefined }]}>
              <View style={sharedStyles.modalHeader}>
                <Text style={sharedStyles.modalTitle}>Exportar CSV</Text>
              </View>

              <ScrollView style={sharedStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={{ marginBottom: 8 }}>Elige el conjunto de datos a exportar:</Text>
                {['estudiantes','inscripciones','clases','talleres'].map((ds) => (
                  <TouchableOpacity key={ds} style={[sharedStyles.pickerItem, { marginBottom: 8 }]} onPress={async () => {
                    try {
                      setExportLoading(true);
                      const url = `${API_URL}/api/reportes.php?action=exportar_csv&dataset=${ds}`;
                      if (Platform.OS === 'web') {
                        window.open(url, '_blank');
                      } else {
                        Alert.alert('Exportar', `Se generó el CSV. URL: ${url}`);
                      }
                    } catch (e) {
                      Alert.alert('Error', 'No se pudo generar el archivo');
                    } finally { setExportLoading(false); setShowExportModal(false); }
                  }}>
                    <Text style={sharedStyles.pickerItemText}>{ds}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={sharedStyles.modalFooter}>
                <Button title="Cerrar" variant="secondary" onPress={() => setShowExportModal(false)} style={sharedStyles.modalButton} />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    minWidth: '48%',
  },
  quickActionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },

  // Classes Section
  classesSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 20,
  },

  // Current Classes
  currentClassesContainer: {
    gap: 12,
  },
  currentClassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
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
  },
  currentClassBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  currentClassBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  classTime: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    lineHeight: 20,
  },
  classInfo: {
    gap: 6,
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Upcoming Classes
  upcomingSection: {
    marginTop: 8,
  },
  upcomingClassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  upcomingClassTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 6,
  },
  upcomingClassName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  upcomingClassInfo: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  upcomingInfoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    backgroundColor: '#FAFBFC',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
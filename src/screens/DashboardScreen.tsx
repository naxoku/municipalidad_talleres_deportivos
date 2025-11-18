import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Alert, Platform, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, handleApiResponse, getHeaders } from '../api/config';
import MetricCard from '../components/MetricCard';
import QuickActions from '../components/QuickActions';
import { Badge } from '../components/Badge';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useResponsive } from '../hooks/useResponsive';
import { sharedStyles } from '../theme/sharedStyles';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, colors } from '../theme/colors';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import Modal from '../components/Modal';
import { Select } from '../components/Select';
import { alumnosApi } from '../api/alumnos';
import { talleresApi } from '../api/talleres';
import { inscripcionesApi } from '../api/inscripciones';
import { asistenciaApi } from '../api/asistencia';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>({
    total_talleres: 0,
    total_alumnos: 0,
    total_profesores: 0,
    clases_hoy: [],
    asistencia_semanal: [],
  });
  const { isWeb, isDesktop, isMobile, width } = useResponsive();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'administrador';

  // Estados para modales
  const [modalNuevoAlumnoVisible, setModalNuevoAlumnoVisible] = useState(false);
  const [modalNuevaInscripcionVisible, setModalNuevaInscripcionVisible] = useState(false);
  const [modalNuevoTallerVisible, setModalNuevoTallerVisible] = useState(false);

  // Estados para listas de datos
  const [listaAlumnos, setListaAlumnos] = useState<any[]>([]);
  const [listaTalleres, setListaTalleres] = useState<any[]>([]);

  // Estados para formularios
  const [formNuevoAlumno, setFormNuevoAlumno] = useState({
    nombre: '',
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

  const getClasesForToday = (d: any) => {
    if (!d) return [];
    if (Array.isArray(d.clases_semana) && d.clases_semana.length > 0) return d.clases_semana;
    const talleres = d.talleres || d.talleres_list || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const result: any[] = [];
    talleres.forEach((t: any) => {
      const horarios = t.horarios || t.horario || t.horas || [];
      horarios.forEach((h: any) => {
        if (h && h.fecha && String(h.fecha).startsWith(todayStr)) {
          result.push({ ...h, taller_nombre: t.nombre || t.taller_nombre || '' });
        }
      });
    });
    return result;
  };

  const router = useRouter();

  useEffect(() => {
    (async () => {
      await cargar();
      await cargarClasesSemana();
    })();
  }, []);

  const abrirModalNuevoEstudiante = () => {
    setFormNuevoAlumno({ nombre: '', edad: '', contacto: '' });
    setModalNuevoAlumnoVisible(true);
  };

  const abrirModalNuevaInscripcion = async () => {
    setFormNuevaInscripcion({ estudiante_id: '', taller_id: '' });
    
    // Cargar listas para los selects
    try {
      const [alumnosData, talleresData] = await Promise.all([
        alumnosApi.listar(),
        talleresApi.listar(),
      ]);
      setListaAlumnos(alumnosData.map((a: any) => ({ label: a.nombre, value: String(a.id) })));
      setListaTalleres(talleresData.map((t: any) => ({ label: t.nombre, value: String(t.id) })));
    } catch (error) {
      console.error('Error cargando listas:', error);
    }
    
    setModalNuevaInscripcionVisible(true);
  };

  const abrirModalNuevoTaller = () => {
    setFormNuevoTaller({ nombre: '', descripcion: '' });
    setModalNuevoTallerVisible(true);
  };

  // Funciones para manejar formularios
  const crearNuevoAlumno = async () => {
    if (!formNuevoAlumno.nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      await alumnosApi.crear({
        nombre: formNuevoAlumno.nombre,
        edad: parseInt(formNuevoAlumno.edad) || undefined,
        contacto: formNuevoAlumno.contacto || undefined,
      });
      Alert.alert('Éxito', 'Alumno creado correctamente');
      setModalNuevoAlumnoVisible(false);
      await cargar(); // Recargar datos del dashboard
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const crearNuevaInscripcion = async () => {
    if (!formNuevaInscripcion.estudiante_id || !formNuevaInscripcion.taller_id) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      await inscripcionesApi.crear({
        estudiante_id: parseInt(formNuevaInscripcion.estudiante_id),
        taller_id: parseInt(formNuevaInscripcion.taller_id),
      });
      Alert.alert('Éxito', 'Inscripción creada correctamente');
      setModalNuevaInscripcionVisible(false);
      await cargar(); // Recargar datos del dashboard
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const crearNuevoTaller = async () => {
    if (!formNuevoTaller.nombre) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      await talleresApi.crear({
        nombre: formNuevoTaller.nombre,
        descripcion: formNuevoTaller.descripcion || undefined,
      });
      Alert.alert('Éxito', 'Taller creado correctamente');
      setModalNuevoTallerVisible(false);
      await cargar(); // Recargar datos del dashboard
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
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

  // Preparar acciones rápidas y badges
  const clasesHoyCount = getClasesForToday(data).length;
  const talleresArray = data.talleres || data.talleres_list || [];
  const lowCapacityCount = (Array.isArray(talleresArray) ? talleresArray.filter((t: any) => {
    const total = Number(t.total_alumnos || t.total_asistentes || 0);
    const max = Number(t.cupos_maximos || t.cupos_max || t.cupo || 30);
    if (!max) return false;
    return (total / max) >= 0.8;
  }).length : 0);

  const actions: any[] = [
    { key: 'clases_hoy', icon: 'calendar-outline', title: 'Clases de hoy', badge: clasesHoyCount, onPress: () => router.push('/horarios') },
    { key: 'nuevo_estudiante', icon: 'person-add-outline', title: 'Nuevo estudiante', onPress: abrirModalNuevoEstudiante },
    { key: 'nueva_inscripcion', icon: 'add-circle-outline', title: 'Nueva inscripción', onPress: abrirModalNuevaInscripcion },
  ];

  // Talleres críticos / alta demanda
  if (lowCapacityCount > 0) {
    actions.splice(1, 0, { key: 'talleres_criticos', icon: 'warning-outline', title: 'Talleres críticos', badge: lowCapacityCount, onPress: () => router.push('/talleres?filter=low_capacity') });
  }

  if (isAdmin) {
    // Acciones rápidas específicas para admin
    actions.push({ key: 'ver_asistencias', icon: 'eye-outline', title: 'Ver asistencias', onPress: () => router.push('/asistencia') });
    actions.push({ key: 'nuevo_taller', icon: 'book-outline', title: 'Nuevo taller', onPress: abrirModalNuevoTaller });
    // TODO: Implementar funcionalidad de exportar
    // actions.push({ key: 'export_csv', icon: 'download-outline', title: 'Exportar CSV', onPress: () => router.push('/(modals)/exportar') });
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>

          {/* Cards KPI */}
          <View style={styles.metricsGrid}>
            {(() => {
              const clasesHoy = getClasesForToday(data);
              const totalClases = data.total_clases || (Array.isArray(data.clases_semana) ? data.clases_semana.length : clasesSemana.length);
                const metrics = [
                { key: 'talleres', title: 'Talleres', value: data.total_talleres || 0, icon: 'book-outline', onPress: () => router.push('/talleres') },
                { key: 'Alumnos', title: 'Alumnos', value: data.total_alumnos || 0, icon: 'people-outline', onPress: () => router.push('/alumnos') },
                { key: 'profesores', title: 'Profesores', value: data.total_profesores || 0, icon: 'person-outline', onPress: () => router.push('/profesores') },
                { key: 'clases_totales', title: 'Clases totales', value: totalClases || 0, icon: 'calendar-outline', onPress: () => router.push('/horarios') },
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

          {/* Acciones rápidas */}
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
            <Text style={styles.subsectionTitle}>Clases en curso</Text>

            {/* Current classes */}
            {clasesActuales && clasesActuales.length > 0 ? (
              <View style={styles.currentClassesContainer}>
                {clasesActuales.map((c: any) => (
                  <TouchableOpacity
                      key={c.id}
                      style={styles.currentClassCard}
                      onPress={() => router.push('/horarios')}
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

            {/* Próximas clases */}
            {clasesProximas && clasesProximas.length > 0 && (
              <View style={styles.upcomingSection}>
                <Text style={styles.subsectionTitle}>Próximas clases</Text>
                {clasesProximas.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.upcomingClassCard}
                    onPress={() => router.push('/horarios')}
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

        {/* Modales */}
        <Modal
          visible={modalNuevoAlumnoVisible}
          onClose={() => setModalNuevoAlumnoVisible(false)}
          title="Nuevo Alumno"
          footer={
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalNuevoAlumnoVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalFooterButtonText, { color: '#2563EB' }]}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={crearNuevoAlumno}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalFooterButtonText, { color: '#059669' }]}>Crear</Text>
              </TouchableOpacity>
            </>
          }
        >
          <Input
            label="Nombre"
            required
            value={formNuevoAlumno.nombre}
            onChangeText={(text) => setFormNuevoAlumno({ ...formNuevoAlumno, nombre: text })}
            placeholder="Nombre completo"
          />
          <Input
            label="Edad"
            value={formNuevoAlumno.edad}
            onChangeText={(text) => setFormNuevoAlumno({ ...formNuevoAlumno, edad: text })}
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
          footer={
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalNuevaInscripcionVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalFooterButtonText, { color: '#2563EB' }]}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={crearNuevaInscripcion}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalFooterButtonText, { color: '#059669' }]}>Crear</Text>
              </TouchableOpacity>
            </>
          }
        >
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
        </Modal>

        <Modal
          visible={modalNuevoTallerVisible}
          onClose={() => setModalNuevoTallerVisible(false)}
          title="Nuevo Taller"
          footer={
            <>
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={() => setModalNuevoTallerVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalFooterButtonText, { color: '#2563EB' }]}>Cancelar</Text>
              </TouchableOpacity>
              <View style={styles.footerDivider} />
              <TouchableOpacity
                style={styles.modalFooterButton}
                onPress={crearNuevoTaller}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalFooterButtonText, { color: '#059669' }]}>Crear</Text>
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
      </View>
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

  // Métricas
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

  // Acciones rápidas
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

  // Sección de clases
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

  // Clases en curso
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

  // Próximas clases
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
    fontSize: 14,
    fontWeight: '600',
  },
  footerDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
});
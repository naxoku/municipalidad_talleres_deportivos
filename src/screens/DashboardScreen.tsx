import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Alert, Platform, RefreshControl } from 'react-native';
import { API_URL, handleApiResponse, getHeaders } from '../api/config';
import MetricCard from '../components/MetricCard';
import QuickActions from '../components/QuickActions';
import SimpleBarChart from '../components/SimpleBarChart';
import { ProgressBar } from '../components/ProgressBar';
import { Badge } from '../components/Badge';
import { CardSkeleton } from '../components/LoadingSkeleton';
import WeekCalendar from '../components/WeekCalendar';
import { useResponsive } from '../hooks/useResponsive';
import { sharedStyles } from '../theme/sharedStyles';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, colors } from '../theme/colors';

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

  // fetch classes for the current week to display in calendar
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

      // Prefer horarios as source of truth for scheduled talleres
      const resH = await fetch(`${API_URL}/api/horarios.php?action=listar`);
      const jsonH = await resH.json();
      const horarios = (jsonH.status === 'success' && Array.isArray(jsonH.datos)) ? jsonH.datos : [];

      // fetch talleres to enrich info
      const resT = await fetch(`${API_URL}/api/talleres.php?action=listar`);
      const jsonT = await resT.json();
      let talleresMap: Record<string, any> = {};
      if (jsonT.status === 'success' && Array.isArray(jsonT.datos)) {
        jsonT.datos.forEach((t: any) => {
          talleresMap[String(t.id)] = t;
        });
      }

      // build map of normalized day names to dates in range
      const normalize = (s: string) => String(s || '').toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
        .replace(/ü/g, 'u').replace(/ñ/g, 'n').trim();

      const dayNamesOrder = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const start = new Date(inicio);
      const end = new Date(fin);
      const dateMap: Record<string, string[]> = {};
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = new Date(d).toISOString().slice(0, 10);
        const idx = new Date(d).getDay(); // 0..6
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
        // split common separators
        const parts = s.split(/[,;\/\s]+/).map((p) => p.trim()).filter(Boolean);
        const res: string[] = [];
        for (const p of parts) {
          // numeric day
          if (/^\d+$/.test(p)) {
            const n = parseInt(p, 10);
            if (n >= 0 && n <= 6) res.push(dayNamesOrder[n]);
            else if (n >= 1 && n <= 7) res.push(dayNamesOrder[(n % 7)]);
            continue;
          }

          const low = normalize(p);
          // try full match or startsWith
          for (const dn of dayNamesOrder) {
            const normDn = normalize(dn);
            if (dn === low || normDn === low || dn.startsWith(low) || normDn.startsWith(low) || low.startsWith(dn) || normDn.startsWith(low) ) {
              res.push(dn);
            }
          }
        }
        // unique
        return Array.from(new Set(res));
      };

      horarios.forEach((h: any) => {
        const raw = h.dia_semana ?? h.dia ?? '';
        const dias = resolveDays(raw);
        // if no días resolved, skip
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

  useEffect(() => {
    (async () => {
      await cargar();
      await cargarClasesSemana();
    })();
  }, []);

  const getClasesForToday = (d: any) => {
    // If API already provides clases_hoy, prefer it
    if (Array.isArray(d.clases_hoy) && d.clases_hoy.length > 0) return d.clases_hoy;

    const talleres = d.talleres || d.talleres_list || [];
    if (!Array.isArray(talleres) || talleres.length === 0) return [];

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const todayName = dayNames[today.getDay()];
    const dayNum = today.getDay(); // 0 (domingo) - 6 (sábado)

    const clases: any[] = [];

    talleres.forEach((t: any) => {
      const horarios = t.horarios || t.horario || t.horas || [];
      if (!Array.isArray(horarios)) return;

      horarios.forEach((h: any) => {
        let match = false;

        // Exact date match
        if (h.fecha) {
          try {
            if (new Date(h.fecha).toISOString().slice(0, 10) === todayStr) match = true;
          } catch (e) {}
        }

        // Single day indicator (numeric or string)
        if (!match && (h.dia_semana || h.dia || h.weekday || h.diaSemana)) {
          const v = h.dia_semana ?? h.dia ?? h.weekday ?? h.diaSemana;
          const num = parseInt(String(v));
          if (!isNaN(num)) {
            // Accept 0-6 or 1-7 (1=lunes)
            if (num === dayNum || num === dayNum + 1 || (num === 7 && dayNum === 0)) match = true;
          } else {
            const name = String(v).toLowerCase();
            if (name.includes(todayName) || (todayName === 'miércoles' && name.includes('miercoles'))) match = true;
          }
        }

        // Array of days
        if (!match && Array.isArray(h.dias)) {
          const lower = h.dias.map((x: any) => String(x).toLowerCase());
          if (lower.includes(todayName) || lower.includes(String(dayNum))) match = true;
        }

        if (!match && Array.isArray(h.dias_semana)) {
          const lower = h.dias_semana.map((x: any) => String(x).toLowerCase());
          if (lower.includes(todayName) || lower.includes(String(dayNum))) match = true;
        }

        // If matched, push normalized class object
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
      <SafeAreaView style={{ flex: 1, padding: spacing.md }}>
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

  // Helpers to compute current and next classes
  const parseDateTime = (fecha: string | undefined, time: string | undefined) => {
    if (!fecha || !time) return null;
    // Normalize time to HH:MM:SS
    const t = String(time).trim();
    const hhmm = t.length === 5 ? t : t.split(':').slice(0,2).join(':');
    try {
      // Construct ISO-like string (local timezone)
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
  const clasesActuales = clasesSemana.filter((c: any) => c.__start && c.__end && c.__start <= now && now < c.__end);
  const clasesProximas = clasesSemana
    .filter((c: any) => c.__start && c.__start > now)
    .sort((a: any, b: any) => (a.__start as Date).getTime() - (b.__start as Date).getTime())
    .slice(0, 3);

  return (
    <Container style={sharedStyles.container} edges={isWeb ? undefined : ['bottom']}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Header with date */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: typography.sizes.xxxl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs }}>
              Dashboard
            </Text>
            <Text style={{ fontSize: typography.sizes.md, color: colors.text.secondary }}>
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          {/* KPI cards: on mobile show as 2 columns, on web keep flexible row */}
          <View style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {
                // prepare metrics array to render responsively
              }
              {(() => {
                const clasesHoy = getClasesForToday(data);

                const metrics = [
                  { key: 'talleres', title: 'Talleres', value: data.total_talleres || (data.talleres ? data.talleres.length : 0), icon: <Ionicons name="book" size={28} color="#666" />, color: undefined, onPress: () => navigation.navigate('Talleres') },
                  { key: 'estudiantes', title: 'Estudiantes', value: data.total_estudiantes, icon: <Ionicons name="school" size={28} color="#666" />, color: '#1e88e5', onPress: () => navigation.navigate('Estudiantes') },
                  { key: 'profesores', title: 'Profesores', value: data.total_profesores, icon: <Ionicons name="person" size={28} color="#666" />, color: '#7c4dff', onPress: () => navigation.navigate('Profesores') },
                  { key: 'clases_hoy', title: 'Clases Hoy', value: clasesHoy.length, icon: <Ionicons name="calendar" size={28} color="#666" />, color: '#00b894', onPress: () => navigation.navigate('Clases') },
                ];

                if (isMobile) {
                  const padding = spacing.md * 2; // left+right padding
                  const cardMargin = spacing.sm * 2; // approximate margins
                  const available = Math.max(width - padding - cardMargin, 280);
                  // if very small screen, reduce min width
                  const isVerySmall = width < 360;
                  const minCard = isVerySmall ? 120 : 140;
                  const cardWidth = Math.max(Math.floor(available / 2) - 8, minCard);

                  return metrics.map((m) => (
                    <View key={m.key} style={{ width: cardWidth }}>
                      <TouchableOpacity onPress={m.onPress}>
                        <MetricCard title={m.title} value={m.value} icon={m.icon} color={m.color} />
                      </TouchableOpacity>
                    </View>
                  ));
                }

                return metrics.map((m) => (
                  <View key={m.key} style={{ flex: 1, minWidth: 160 }}>
                    <TouchableOpacity onPress={m.onPress}>
                      <MetricCard title={m.title} value={m.value} icon={m.icon} color={m.color} />
                    </TouchableOpacity>
                  </View>
                ));
              })()}
            </View>
          </View>

        {(() => {
          const actions = [
            { icon: 'create', title: 'Registrar Asistencia', onPress: () => navigation.navigate('Asistencia') },
            { icon: 'add', title: 'Nueva Inscripción', onPress: () => navigation.navigate('Inscripciones') },
            { icon: 'person-add', title: 'Nuevo Estudiante', onPress: () => navigation.navigate('Estudiantes') },
            { icon: 'book', title: 'Nuevo Taller', onPress: () => navigation.navigate('Talleres', { mode: 'create' }) },
          ];

          if (isMobile) {
            // render grid 2 columns compact
            const padding = spacing.md * 2;
            const cardMargin = spacing.sm * 2;
            const available = Math.max(width - padding - cardMargin, 280);
            const isVerySmall = width < 360;
            const btnWidth = Math.max(Math.floor(available / 2) - 12, isVerySmall ? 120 : 140);

            return (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.sm }}>
                {actions.map((a, i) => (
                  <TouchableOpacity key={i} onPress={a.onPress} style={{ width: btnWidth, padding: isVerySmall ? spacing.sm * 0.8 : spacing.sm, marginRight: spacing.sm, marginBottom: spacing.sm, backgroundColor: '#e8f5ee', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={a.icon as any} size={isVerySmall ? 16 : 18} color="#00a86b" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#074f3f', fontSize: isVerySmall ? 13 : 15 }}>{a.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          }

          return (
            <QuickActions
              actions={actions}
            />
          );
        })()}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => {
              const url = `${API_URL}/api/reportes.php?action=exportar_csv`;
              if (Platform.OS === 'web') {
                window.open(url, '_blank');
              } else {
                Alert.alert('Exportar CSV', 'En móvil la exportación requiere configuración adicional. Abra: ' + url);
              }
            }}
            style={{ padding: 8 }}
          >
            <Text style={{ color: '#007bff' }}>Exportar CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: '600', marginBottom: spacing.sm, color: colors.text.primary }}>
            Clases ahora y próximas
          </Text>

          {/* Current classes */}
          <View style={{ marginBottom: spacing.sm }}>
            {clasesActuales && clasesActuales.length > 0 ? (
              clasesActuales.map((c: any) => (
                <View key={c.id} style={[sharedStyles.card, { borderLeftWidth: 6, borderLeftColor: colors.success, marginBottom: spacing.sm }]}> 
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[sharedStyles.cardTitle, { fontSize: typography.sizes.md }]}>{c.taller_nombre}</Text>
                      <Text style={sharedStyles.cardDetail}>{c.hora_inicio} - {c.hora_fin} · {c.profesor_nombre || ''}</Text>
                      <Text style={sharedStyles.cardDetail}>{c.ubicacion_nombre || ''}</Text>
                    </View>
                    <View style={{ marginLeft: spacing.md }}>
                      {String(c.id).match(/^\d+$/) ? (
                        <TouchableOpacity onPress={() => navigation.navigate('Asistencia', { claseId: c.id })} style={[sharedStyles.actionButton, { backgroundColor: colors.primary, paddingHorizontal: spacing.md }]}> 
                          <Text style={{ color: '#fff', fontWeight: '600' }}>Pasar lista</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => navigation.navigate('Horarios')} style={[sharedStyles.actionButton, { backgroundColor: '#eef7ff', paddingHorizontal: spacing.md }]}> 
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>Ver horario</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: 12 }}>
                <Text style={{ color: colors.text.secondary }}>No hay clases en este momento</Text>
              </View>
            )}
          </View>

          {/* Upcoming classes */}
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.primary, marginBottom: spacing.xs }}>Próximas clases</Text>
            {clasesProximas && clasesProximas.length > 0 ? (
              clasesProximas.map((c: any) => (
                <View key={c.id} style={[sharedStyles.card, { borderLeftWidth: 6, borderLeftColor: colors.primary, marginBottom: spacing.sm }]}> 
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[sharedStyles.cardTitle, { fontSize: typography.sizes.md }]}>{c.taller_nombre}</Text>
                      <Text style={sharedStyles.cardDetail}>{c.fecha} · {c.hora_inicio} - {c.hora_fin}</Text>
                      <Text style={sharedStyles.cardDetail}>{c.profesor_nombre || ''} {c.ubicacion_nombre ? '· ' + c.ubicacion_nombre : ''}</Text>
                    </View>
                    <View style={{ marginLeft: spacing.md }}>
                      <TouchableOpacity onPress={() => navigation.navigate('Horarios')} style={[sharedStyles.actionButton, { backgroundColor: '#eef7ff', paddingHorizontal: spacing.md }]}> 
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Ver</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.text.secondary }}>No hay próximas clases esta semana</Text>
            )}
          </View>

          <Text style={{ fontSize: typography.sizes.lg, fontWeight: '600', marginBottom: spacing.sm, color: colors.text.primary }}>
            Calendario semanal
          </Text>
          <View>
            {/* Week calendar component */}
            {data.clases_semana ? (
              // Lazy-load the calendar component to keep bundle small
              <React.Suspense fallback={<Text>Cargando calendario...</Text>}>
                <WeekCalendar
                  clases={data.clases_semana}
                  talleresMap={data.talleres_map}
                  onOpenClase={(c: any) => navigation.navigate('Asistencia', { claseId: c.id })}
                />
              </React.Suspense>
            ) : (
              <View style={{ padding: spacing.xl, backgroundColor: colors.background.secondary, borderRadius: 12, alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} style={{ marginBottom: spacing.sm }} />
                <Text style={{ color: colors.text.secondary, fontSize: typography.sizes.md }}>Cargando calendario...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Text style={{ fontSize: typography.sizes.lg, fontWeight: '600', marginBottom: spacing.sm }}>Asistencia semanal</Text>
          <SimpleBarChart data={(data.asistencia_semanal || []).map((d: any) => ({ label: d.fecha, value: parseInt(d.presentes || 0) }))} />
        </View>
        </ScrollView>
      </View>
    </Container>
  );
}

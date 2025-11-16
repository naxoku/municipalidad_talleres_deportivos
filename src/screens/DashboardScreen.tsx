import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Alert, Platform, RefreshControl } from 'react-native';
import { API_URL, handleApiResponse, getHeaders } from '../api/config';
import MetricCard from '../components/MetricCard';
import QuickActions from '../components/QuickActions';
import SimpleBarChart from '../components/SimpleBarChart';
import { ProgressBar } from '../components/ProgressBar';
import { Badge } from '../components/Badge';
import { CardSkeleton } from '../components/LoadingSkeleton';
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

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  useEffect(() => {
    cargar();
  }, []);

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
                const metrics = [
                  { key: 'talleres', title: 'Talleres', value: data.total_talleres, icon: <Ionicons name="book" size={28} color="#666" />, color: undefined, onPress: () => navigation.navigate('Talleres') },
                  { key: 'estudiantes', title: 'Estudiantes', value: data.total_estudiantes, icon: <Ionicons name="school" size={28} color="#666" />, color: '#1e88e5', onPress: () => navigation.navigate('Estudiantes') },
                  { key: 'profesores', title: 'Profesores', value: data.total_profesores, icon: <Ionicons name="person" size={28} color="#666" />, color: '#7c4dff', onPress: () => navigation.navigate('Profesores') },
                  { key: 'clases_hoy', title: 'Clases Hoy', value: data.clases_hoy ? data.clases_hoy.length : 0, icon: <Ionicons name="calendar" size={28} color="#666" />, color: '#00b894', onPress: () => navigation.navigate('Clases') },
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
            📅 Clases de Hoy
          </Text>
          {(!data.clases_hoy || data.clases_hoy.length === 0) ? (
            <View style={{ padding: spacing.xl, backgroundColor: colors.background.secondary, borderRadius: 12, alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} style={{ marginBottom: spacing.sm }} />
              <Text style={{ color: colors.text.secondary, fontSize: typography.sizes.md }}>No hay clases programadas para hoy</Text>
            </View>
          ) : (
            data.clases_hoy.map((c: any) => {
              const presentes = parseInt(c.presentes || 0);
              const total = parseInt(c.total_asistentes || 0);
              const isCompleted = presentes >= total && total > 0;
              const isPending = presentes < total || total === 0;

              return (
                <View key={c.id} style={[sharedStyles.card, { borderLeftWidth: 4, borderLeftColor: isCompleted ? colors.success : colors.warning }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                      <Text style={[sharedStyles.cardTitle, { flex: 1 }]}>{c.taller_nombre}</Text>
                      {isCompleted && <Badge label="✅ Completo" variant="success" size="small" />}
                      {isPending && <Badge label="⚠️ Pendiente" variant="warning" size="small" />}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                      <Ionicons name="time-outline" size={16} color={colors.text.secondary} style={{ marginRight: 4 }} />
                      <Text style={sharedStyles.cardDetail}>{c.hora_inicio} - {c.hora_fin}</Text>
                    </View>
                    {total > 0 && (
                      <View style={{ marginTop: spacing.sm }}>
                        <ProgressBar current={presentes} total={total} height={6} showLabel={true} />
                      </View>
                    )}
                  </View>
                  <View style={{ marginLeft: spacing.md, flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Asistencia', { claseId: c.id })} 
                      style={[sharedStyles.actionButton, { backgroundColor: colors.primary, paddingHorizontal: spacing.md }]}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>📝 Pasar Lista</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
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

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, colors } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';

type Clase = {
  id: string | number;
  taller_nombre: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio?: string;
  hora_fin?: string;
  taller_id?: string | number;
  tallerId?: string | number;
  // allow other backend fields
  [k: string]: any;
};

function formatDateLabel(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });
  } catch (e) {
    return dateStr;
  }
}

export default function WeekCalendar({ clases = [], onOpenClase, talleresMap = {} }: { clases: Clase[]; onOpenClase?: (c: any) => void; talleresMap?: Record<string, any> }) {
  // Build days for current week (Mon - Sun)
  const today = new Date();
  // get Monday as start
  const day = today.getDay();
  const diffToMonday = ((day + 6) % 7); // 0 => Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  const days: { date: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const iso = dt.toISOString().slice(0, 10);
    days.push({ date: iso, label: formatDateLabel(iso) });
  }

  // group clases by fecha
  const map: Record<string, Clase[]> = {};
  clases.forEach((c: any) => {
    const f = c.fecha ? String(c.fecha).slice(0, 10) : '';
    if (!map[f]) map[f] = [];
    map[f].push(c);
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
      <View style={{ flexDirection: 'row' }}>
        {days.map((d) => (
          <View key={d.date} style={{ width: 240, marginRight: spacing.xs }}>
            <View style={[sharedStyles.card, { padding: spacing.sm / 1.1, minHeight: 120, borderLeftWidth: 6, borderLeftColor: colors.primary, backgroundColor: '#fff' }]}> 
              <Text style={{ fontWeight: '700', marginBottom: spacing.xs, fontSize: typography.sizes.sm, color: colors.text.primary }}>{d.label}</Text>
              {(!map[d.date] || map[d.date].length === 0) ? (
                <Text style={{ color: colors.text.secondary, fontSize: typography.sizes.xs }}>Sin clases</Text>
              ) : (
                map[d.date].map((c) => {
                  const taller = talleresMap && talleresMap[String(c.taller_id || c.tallerId || '')];
                  const profs = c.profesor_nombre || (taller && Array.isArray(taller.profesores) ? taller.profesores.map((p: any) => p.nombre).join(', ') : '');
                  const ubic = c.ubicacion_nombre || (taller && (taller.ubicacion || taller.ubicacion_nombre) ? (taller.ubicacion || taller.ubicacion_nombre) : '');

                  return (
                    <TouchableOpacity key={c.id} onPress={() => onOpenClase && onOpenClase(c)} style={{ paddingVertical: 8, borderRadius: 8, marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontWeight: '700', fontSize: typography.sizes.sm, color: colors.text.primary }}>{c.hora_inicio ? c.hora_inicio + ' · ' : ''}{c.taller_nombre}</Text>
                        <Text style={{ color: colors.text.secondary, fontSize: typography.sizes.xs }}>{c.hora_fin}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                        {profs ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="person-outline" size={14} color={colors.text.tertiary} style={{ marginRight: 6 }} />
                            <Text style={{ color: colors.text.tertiary, fontSize: typography.sizes.xs }}>{profs}</Text>
                          </View>
                        ) : null}
                        {ubic ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="location-outline" size={14} color={colors.text.tertiary} style={{ marginRight: 6 }} />
                            <Text style={{ color: colors.text.tertiary, fontSize: typography.sizes.xs }}>{ubic}</Text>
                          </View>
                        ) : null}
                        {c.cupos_max ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="people-outline" size={14} color={colors.text.tertiary} style={{ marginRight: 6 }} />
                            <Text style={{ color: colors.text.tertiary, fontSize: typography.sizes.xs }}>Cupos: {c.cupos_max}</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============= TIPOS Y CONSTANTES =============

export type CalendarEvent = {
  id: string | number;
  title: string;
  subtitle?: string;
  day: string;
  start: string;
  end: string;
  color?: string;
  profesor_nombre?: string;
  ubicacion_nombre?: string;
  [key: string]: any;
};

interface WeekCalendarProps {
  events: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
  startHour?: number;
  endHour?: number;
}

const DAYS = [
  { id: 'lunes', label: 'Lunes', short: 'Lun' },
  { id: 'martes', label: 'Martes', short: 'Mar' },
  { id: 'miercoles', label: 'Miércoles', short: 'Mié' },
  { id: 'jueves', label: 'Jueves', short: 'Jue' },
  { id: 'viernes', label: 'Viernes', short: 'Vie' },
  { id: 'sabado', label: 'Sábado', short: 'Sáb' },
  { id: 'domingo', label: 'Domingo', short: 'Dom' },
];

// CONFIGURACIÓN DE GANTT
const HOUR_WIDTH = 100; // Ancho en pixeles de cada hora
const SIDEBAR_WIDTH = 80; // Ancho de la columna de días
const EVENT_HEIGHT = 45; // Altura de cada tarjeta de evento
const EVENT_GAP = 4; // Espacio vertical entre eventos superpuestos
const ROW_PADDING = 10; // Padding arriba y abajo dentro de cada fila de día

// Paleta de colores
const COLOR_THEMES = [
  { bg: '#4F46E5', border: '#3730A3', text: '#FFFFFF', subtext: '#E0E7FF' }, // Indigo
  { bg: '#059669', border: '#065F46', text: '#FFFFFF', subtext: '#D1FAE5' }, // Emerald
  { bg: '#D97706', border: '#92400E', text: '#FFFFFF', subtext: '#FEF3C7' }, // Amber
  { bg: '#DB2777', border: '#9D174D', text: '#FFFFFF', subtext: '#FCE7F3' }, // Pink
  { bg: '#2563EB', border: '#1E40AF', text: '#FFFFFF', subtext: '#DBEAFE' }, // Blue
  { bg: '#7C3AED', border: '#5B21B6', text: '#FFFFFF', subtext: '#EDE9FE' }, // Violet
  { bg: '#DC2626', border: '#991B1B', text: '#FFFFFF', subtext: '#FEE2E2' }, // Red
  { bg: '#0D9488', border: '#115E59', text: '#FFFFFF', subtext: '#CCFBF1' }, // Teal
];

// ============= HELPERS =============

const normalizeKey = (str: string) =>
  str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const getMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m}`;
};

// Algoritmo de Layout Horizontal (Gantt)
const calculateGanttLayout = (events: CalendarEvent[], startHour: number) => {
  // 1. Ordenar eventos por hora de inicio y duración
  const items = events.map(e => ({
    ...e,
    startMin: getMinutes(e.start),
    endMin: getMinutes(e.end),
    lane: 0, // Nivel vertical dentro de la misma fila
  })).sort((a, b) => a.startMin - b.startMin || (b.endMin - a.endMin));

  // 2. Calcular "Lanes" (Si se superponen, bajan de nivel)
  const lanes: number[] = []; // Guarda el minuto final del último evento en cada carril

  items.forEach(item => {
    let placed = false;
    // Buscar un carril libre
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] <= item.startMin) {
        item.lane = i;
        lanes[i] = item.endMin;
        placed = true;
        break;
      }
    }
    // Si no hay carril libre, crear uno nuevo
    if (!placed) {
      item.lane = lanes.length;
      lanes.push(item.endMin);
    }
  });

  const maxLanes = lanes.length > 0 ? lanes.length : 1;

  // 3. Calcular posiciones absolutas (Left y Width)
  return {
    items: items.map(item => {
      const startOffset = item.startMin - (startHour * 60);
      const duration = item.endMin - item.startMin;

      return {
        ...item,
        left: (startOffset / 60) * HOUR_WIDTH,
        width: (duration / 60) * HOUR_WIDTH,
        top: ROW_PADDING + (item.lane * (EVENT_HEIGHT + EVENT_GAP)),
      };
    }),
    rowHeight: (maxLanes * (EVENT_HEIGHT + EVENT_GAP)) + (ROW_PADDING * 2)
  };
};

const getEventTheme = (title: string) => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLOR_THEMES[hash % COLOR_THEMES.length];
};

// ============= COMPONENTE PRINCIPAL =============

export default function WeekCalendar({
  events = [],
  onEventPress,
  startHour = 8,
  endHour = 22
}: WeekCalendarProps) {
  
  const [pressedEvent, setPressedEvent] = useState<string | number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Generar etiquetas de tiempo (Columnas)
  const timeLabels = useMemo(() => {
    const times = [];
    for (let h = startHour; h <= endHour; h++) {
      times.push(h);
    }
    return times;
  }, [startHour, endHour]);

  // Procesar eventos por día y calcular layout
  const rowsData = useMemo(() => {
    return DAYS.map(day => {
      const dayEvents = events.filter(e => normalizeKey(e.day) === normalizeKey(day.id));
      const layout = calculateGanttLayout(dayEvents, startHour);
      return {
        day,
        events: layout.items,
        height: Math.max(layout.rowHeight, 80) // Altura mínima de fila
      };
    });
  }, [events, startHour]);

  // Indicador de hora actual
  const currentTimeX = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < startHour || h > endHour) return null;
    const diffMinutes = (h * 60 + m) - (startHour * 60);
    return (diffMinutes / 60) * HOUR_WIDTH;
  }, [startHour, endHour]);

  return (
    <View style={styles.container}>
      {/* Estructura: Scroll Vertical (Filas) -> Scroll Horizontal (Timeline) */}
      <ScrollView 
        style={styles.mainScroll} 
        showsVerticalScrollIndicator={false}
      >
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <View style={styles.ganttContainer}>
                
                {/* 1. HEADER (Horas) */}
                <View style={styles.headerRow}>
                    {/* Esquina superior izquierda vacía (espacio del sidebar) */}
                    <View style={styles.cornerHeader}>
                        <Text style={styles.cornerText}>Día / Hora</Text>
                    </View>
                    
                    {/* Columnas de Hora */}
                    <View style={styles.timeHeaderContainer}>
                        {timeLabels.map((h, index) => (
                            <View key={h} style={styles.timeHeaderCell}>
                                <Text style={styles.timeHeaderText}>{h}:00</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 2. CUERPO (Filas de Días) */}
                <View style={styles.bodyContainer}>
                    
                    {/* Grid de Fondo (Líneas Verticales) */}
                    <View style={styles.gridBackground}>
                        <View style={{ width: SIDEBAR_WIDTH }} />
                        {timeLabels.map((h) => (
                            <View key={`line-${h}`} style={styles.gridVerticalLine} />
                        ))}
                         {/* Línea de Hora Actual */}
                        {currentTimeX !== null && (
                            <View style={[styles.currentTimeLine, { left: SIDEBAR_WIDTH + currentTimeX }]}>
                                <View style={styles.currentTimeDot} />
                            </View>
                        )}
                    </View>

                    {/* Filas de Datos */}
                    {rowsData.map((row, index) => {
                         const isLast = index === rowsData.length - 1;
                         
                         return (
                            <View key={row.day.id} style={[styles.rowContainer, { height: row.height, borderBottomWidth: isLast ? 0 : 1 }]}>
                                
                                {/* Columna Izquierda (Sticky visual) */}
                                <View style={styles.rowLabel}>
                                    <Text style={styles.rowLabelText}>{row.day.label}</Text>
                                    <Text style={styles.rowLabelSub}>{row.events.length} clases</Text>
                                </View>

                                {/* Área de Eventos */}
                                <View style={styles.rowEventsContainer}>
                                    {row.events.map((event) => {
                                        const theme = getEventTheme(event.title);
                                        const isPressed = pressedEvent === event.id;

                                        return (
                                            <TouchableOpacity
                                                key={event.id}
                                                activeOpacity={0.9}
                                                onPress={() => setSelectedEvent(event)}
                                                onPressIn={() => setPressedEvent(event.id)}
                                                onPressOut={() => setPressedEvent(null)}
                                                style={[
                                                    styles.eventCard,
                                                    {
                                                        left: event.left,
                                                        width: event.width - 2, // -2 para margen visual
                                                        top: event.top,
                                                        height: EVENT_HEIGHT,
                                                        backgroundColor: theme.bg,
                                                        borderColor: theme.border,
                                                    },
                                                    isPressed && styles.eventCardPressed
                                                ]}
                                            >
                                                <View style={styles.eventContent}>
                                                    <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>
                                                        {event.title}
                                                    </Text>
                                                    <Text style={[styles.eventTime, { color: theme.subtext }]}>
                                                        {formatTime(event.start)} - {formatTime(event.end)}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                         );
                    })}
                </View>
            </View>
        </ScrollView>
      </ScrollView>

      {/* ========== MODAL DETALLE (Igual que antes) ========== */}
      {selectedEvent && (
        <Modal
          transparent
          visible={!!selectedEvent}
          animationType="fade"
          onRequestClose={() => setSelectedEvent(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedEvent(null)}
          >
            <View style={styles.tooltipCard}>
              <View style={[styles.tooltipHeader, { backgroundColor: getEventTheme(selectedEvent.title).bg }]}>
                <Text style={[styles.tooltipTitle, { color: '#FFF' }]}>
                  {selectedEvent.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedEvent(null)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.tooltipBody}>
                <View style={styles.tooltipRow}>
                  <Ionicons name="calendar-outline" size={18} color="#71717A" />
                  <Text style={styles.tooltipText}>{selectedEvent.day}</Text>
                </View>
                <View style={styles.tooltipRow}>
                  <Ionicons name="time-outline" size={18} color="#71717A" />
                  <Text style={styles.tooltipText}>
                    {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                  </Text>
                </View>

                {selectedEvent.profesor_nombre && (
                  <View style={styles.tooltipRow}>
                    <Ionicons name="person-outline" size={18} color="#71717A" />
                    <Text style={styles.tooltipText}>{selectedEvent.profesor_nombre}</Text>
                  </View>
                )}

                {selectedEvent.ubicacion_nombre && (
                  <View style={styles.tooltipRow}>
                    <Ionicons name="location-outline" size={18} color="#71717A" />
                    <Text style={styles.tooltipText}>{selectedEvent.ubicacion_nombre}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.tooltipButton, { backgroundColor: getEventTheme(selectedEvent.title).bg }]}
                  onPress={() => {
                    onEventPress?.(selectedEvent);
                    setSelectedEvent(null);
                  }}
                >
                  <Text style={styles.tooltipButtonText}>Gestionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

// ============= ESTILOS =============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainScroll: {
    flex: 1,
  },
  ganttContainer: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  
  // HEADER
  headerRow: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cornerHeader: {
    width: SIDEBAR_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  cornerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  timeHeaderContainer: {
    flexDirection: 'row',
  },
  timeHeaderCell: {
    width: HOUR_WIDTH,
    justifyContent: 'center',
    alignItems: 'flex-start', // Alinear al inicio para marcar la línea
    paddingLeft: 8,
    borderRightWidth: 1, // Marca de hora
    borderRightColor: '#E2E8F0', // Muy sutil
  },
  timeHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // BODY
  bodyContainer: {
    position: 'relative',
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  gridVerticalLine: {
    width: HOUR_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9', // Líneas de fondo muy claras
  },
  
  // FILAS
  rowContainer: {
    flexDirection: 'row',
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'transparent',
  },
  rowLabel: {
    width: SIDEBAR_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  rowLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  rowLabelSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  rowEventsContainer: {
    flex: 1,
    position: 'relative',
  },

  // EVENTS (TARJETAS)
  eventCard: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.10,
    shadowRadius: 1.5,
    elevation: 2,
  },
  eventCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  },
  eventContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: '500',
  },

  // INDICADOR HORA ACTUAL
  currentTimeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#EF4444',
    zIndex: 20,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: -3,
    marginTop: -4, // Subirlo al header
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  tooltipBody: {
    padding: 16,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  tooltipText: {
    fontSize: 14,
    color: '#3F3F46',
    flex: 1,
  },
  tooltipButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tooltipButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
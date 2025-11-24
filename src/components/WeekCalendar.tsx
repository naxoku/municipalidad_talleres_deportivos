import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { User } from "lucide-react";

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
  { id: "lunes", label: "Lunes", short: "Lun" },
  { id: "martes", label: "Martes", short: "Mar" },
  { id: "miércoles", label: "Miércoles", short: "Mié" },
  { id: "jueves", label: "Jueves", short: "Jue" },
  { id: "viernes", label: "Viernes", short: "Vie" },
  { id: "sábado", label: "Sábado", short: "Sáb" },
  { id: "domingo", label: "Domingo", short: "Dom" },
];

// CONFIGURACIÓN DE GANTT - MEJORADA PARA RESPONSIVE
const HOUR_WIDTH = 140; // Ancho en pixeles de cada hora (aumentado)
const SIDEBAR_WIDTH = 160; // Ancho de la columna de días (aumentado)
const EVENT_HEIGHT = 90; // Altura de cada tarjeta de evento (aumentado)
const EVENT_GAP = 6; // Espacio vertical entre eventos superpuestos (reducido)
const ROW_PADDING = 16; // Padding arriba y abajo dentro de cada fila de día (aumentado)

// Paleta de colores
const COLOR_THEMES = [
  { bg: "#4F46E5", border: "#3730A3", text: "#FFFFFF", subtext: "#E0E7FF" }, // Indigo
  { bg: "#059669", border: "#065F46", text: "#FFFFFF", subtext: "#D1FAE5" }, // Emerald
  { bg: "#D97706", border: "#92400E", text: "#FFFFFF", subtext: "#FEF3C7" }, // Amber
  { bg: "#DB2777", border: "#9D174D", text: "#FFFFFF", subtext: "#FCE7F3" }, // Pink
  { bg: "#2563EB", border: "#1E40AF", text: "#FFFFFF", subtext: "#DBEAFE" }, // Blue
  { bg: "#7C3AED", border: "#5B21B6", text: "#FFFFFF", subtext: "#EDE9FE" }, // Violet
  { bg: "#DC2626", border: "#991B1B", text: "#FFFFFF", subtext: "#FEE2E2" }, // Red
  { bg: "#0D9488", border: "#115E59", text: "#FFFFFF", subtext: "#CCFBF1" }, // Teal
];

// ============= HELPERS =============

const normalizeKey = (str: string) =>
  str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);

  return h * 60 + m;
};

const formatTime = (time: string) => {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return `${displayHour}:${m}`;
};

// Algoritmo de Layout Horizontal (Gantt)
const calculateGanttLayout = (events: CalendarEvent[], startHour: number) => {
  // 1. Ordenar eventos por hora de inicio y duración
  const items = events
    .map((e) => ({
      ...e,
      startMin: getMinutes(e.start),
      endMin: getMinutes(e.end),
      lane: 0, // Nivel vertical dentro de la misma fila
    }))
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  // 2. Calcular "Lanes" (Si se superponen, bajan de nivel)
  const lanes: number[] = []; // Guarda el minuto final del último evento en cada carril

  items.forEach((item) => {
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
    items: items.map((item) => {
      const startOffset = item.startMin - startHour * 60;
      const duration = item.endMin - item.startMin;

      return {
        ...item,
        left: (startOffset / 60) * HOUR_WIDTH,
        width: (duration / 60) * HOUR_WIDTH,
        top: ROW_PADDING + item.lane * (EVENT_HEIGHT + EVENT_GAP),
      };
    }),
    rowHeight: maxLanes * (EVENT_HEIGHT + EVENT_GAP) + ROW_PADDING * 2,
  };
};

const getEventTheme = (title: string) => {
  const hash = title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return COLOR_THEMES[hash % COLOR_THEMES.length];
};

// ============= COMPONENTE MODAL DETALLE =============

const EventModal: React.FC<{
  event: CalendarEvent | null;
  onClose: () => void;
  onPress?: (event: CalendarEvent) => void;
}> = ({ event, onClose, onPress }) => {
  if (!event) return null;

  return (
    <Modal
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-opacity-40",
      }}
      isOpen={!!event}
      placement="center"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {event.title}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-600">Día</p>
                    <p className="font-medium capitalize">{event.day}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Horario</p>
                    <p className="font-medium">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </p>
                  </div>
                </div>

                {event.profesor_nombre && (
                  <div>
                    <p className="text-sm text-default-600">Profesor</p>
                    <p className="font-medium">{event.profesor_nombre}</p>
                  </div>
                )}

                {event.ubicacion_nombre && (
                  <div>
                    <p className="text-sm text-default-600">Ubicación</p>
                    <p className="font-medium">{event.ubicacion_nombre}</p>
                  </div>
                )}

                {(event.capacidad || event.alumnos_inscritos) && (
                  <div>
                    <p className="text-sm text-default-600">Capacidad</p>
                    <p className="font-medium">
                      {event.alumnos_inscritos || 0} / {event.capacidad || 0}{" "}
                      alumnos
                    </p>
                  </div>
                )}

                {event.subtitle && (
                  <div>
                    <p className="text-sm text-default-600">Descripción</p>
                    <p className="text-sm">{event.subtitle}</p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCloseModal}>
                Cerrar
              </Button>
              {onPress && (
                <Button
                  color="primary"
                  onPress={() => {
                    onPress(event);
                    onCloseModal();
                  }}
                >
                  Gestionar Horario
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

// ============= COMPONENTE PRINCIPAL =============

export default function WeekCalendar({
  events = [],
  onEventPress,
  startHour = 8,
  endHour = 22,
}: WeekCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

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
    return DAYS.map((day) => {
      const dayEvents = events.filter(
        (e) => normalizeKey(e.day) === normalizeKey(day.id),
      );
      const layout = calculateGanttLayout(dayEvents, startHour);

      return {
        day,
        events: layout.items,
        height: Math.max(layout.rowHeight, 80), // Altura mínima de fila
      };
    });
  }, [events, startHour]);

  // Indicador de hora actual
  const currentTimeX = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    if (h < startHour || h > endHour) return null;
    const diffMinutes = h * 60 + m - startHour * 60;

    return (diffMinutes / 60) * HOUR_WIDTH;
  }, [startHour, endHour]);

  return (
    <div className="w-full bg-background rounded-lg shadow-lg border border-default-200 overflow-hidden">
      {/* Estructura: Scroll Vertical (Filas) -> Scroll Horizontal (Timeline) */}
      <div className="overflow-auto max-h-[80vh]">
        <div className="overflow-x-auto min-w-full">
          <div className="relative bg-background min-w-max">
            {/* 1. HEADER (Horas) */}
            <div className="flex border-b-2 border-default-200 bg-default-50 sticky top-0 z-20">
              {/* Esquina superior izquierda vacía (espacio del sidebar) */}
              <div
                className="flex items-center justify-center border-r-2 border-default-200 bg-default-100 px-4 py-4"
                style={{ width: SIDEBAR_WIDTH, height: 60 }}
              >
                <span className="text-sm font-bold text-default-700 text-center">
                  Día / Hora
                </span>
              </div>

              {/* Columnas de Hora */}
              <div className="flex">
                {timeLabels.map((h, _index) => (
                  <div
                    key={h}
                    className="flex items-center justify-center px-3 py-4 border-r border-default-200 min-w-0"
                    style={{ width: HOUR_WIDTH }}
                  >
                    <span className="text-sm font-semibold text-default-700 whitespace-nowrap">
                      {h}:00
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. CUERPO (Filas de Días) */}
            <div className="relative">
              {/* Grid de Fondo (Líneas Verticales) */}
              <div className="absolute inset-0 flex pointer-events-none">
                <div style={{ width: SIDEBAR_WIDTH }} />
                {timeLabels.map((h) => (
                  <div
                    key={`line-${h}`}
                    className="border-r border-default-100"
                    style={{ width: HOUR_WIDTH }}
                  />
                ))}
                {/* Línea de Hora Actual */}
                {currentTimeX !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 shadow-lg"
                    style={{ left: SIDEBAR_WIDTH + currentTimeX }}
                  >
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-background shadow-md" />
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-medium">
                      {new Date().toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Filas de Datos */}
              {rowsData.map((row, index) => {
                const isLast = index === rowsData.length - 1;

                return (
                  <div
                    key={row.day.id}
                    className={`flex relative hover:bg-default-50/50 transition-colors ${!isLast ? "border-b border-default-200" : ""}`}
                    style={{ height: row.height }}
                  >
                    {/* Columna Izquierda (Sticky visual) */}
                    <div
                      className="flex flex-col items-center justify-center border-r-2 border-default-200 bg-background z-10 px-4 py-6 sticky left-0"
                      style={{ width: SIDEBAR_WIDTH }}
                    >
                      <span className="text-base font-bold text-foreground text-center leading-tight">
                        {row.day.label}
                      </span>
                      <span className="text-xs text-default-500 mt-2 bg-default-100 px-2 py-1 rounded-full">
                        {row.events.length}{" "}
                        {row.events.length === 1 ? "clase" : "clases"}
                      </span>
                    </div>

                    {/* Área de Eventos */}
                    <div className="flex-1 relative min-h-full">
                      {row.events.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-default-400 text-sm pointer-events-none">
                          <div className="text-center opacity-50">
                            Sin clases programadas
                          </div>
                        </div>
                      )}
                      {row.events.map((event) => {
                        const theme = getEventTheme(event.title);

                        return (
                          <button
                            key={event.id}
                            className="absolute rounded-lg border-2 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer text-left transform hover:scale-105 group"
                            style={{
                              left: event.left,
                              width: event.width - 6, // -6 para margen visual
                              top: event.top,
                              height: EVENT_HEIGHT,
                              backgroundColor: theme.bg,
                              borderColor: theme.border,
                            }}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="p-3 h-full flex flex-col justify-between">
                              <div className="font-bold text-sm leading-tight truncate text-white group-hover:text-white">
                                {event.title}
                              </div>
                              <div className="text-xs mt-1 text-white/90 font-medium">
                                {formatTime(event.start)} -{" "}
                                {formatTime(event.end)}
                              </div>
                              {event.profesor_nombre && (
                                <div className="text-xs mt-1 text-white/80 truncate flex items-center gap-1">
                                  <User size={12} />
                                  {event.profesor_nombre}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onPress={onEventPress}
      />
    </div>
  );
}

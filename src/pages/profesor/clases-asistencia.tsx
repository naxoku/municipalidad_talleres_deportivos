import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Progress,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { asistenciaApi } from "@/api/asistencia";
import { detalleClaseApi, type DetalleClase } from "@/api/detalle_clase";

const formatTimeHHMM = (timeString: string) => {
  if (!timeString) return "-";

  return timeString.slice(0, 5);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function ClasesAsistenciaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const horarioIdParam = searchParams.get("horario");

  const initialHorario = (() => {
    if (!horarioIdParam) return 0;
    const parsed = Number(horarioIdParam);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  })();

  const [horarioSeleccionado, setHorarioSeleccionado] =
    useState<number>(initialHorario);

  // Fetch horarios del profesor
  const { data: horarios, isLoading: horariosLoading } = useQuery({
    queryKey: ["profesor", "horarios_asistencia", user?.profesor_id],
    queryFn: () => asistenciaApi.getHorariosConAlumnos(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  // Fetch clases del horario seleccionado
  const { data: clasesData, isLoading: clasesLoading } = useQuery({
    queryKey: ["profesor", "clases_horario", horarioSeleccionado],
    queryFn: () => detalleClaseApi.getClasesPorHorario(horarioSeleccionado),
    enabled: horarioSeleccionado > 0,
    refetchInterval: 30000, // Refrescar cada 30 segundos para actualizar estados
  });

  // Actualizar horario seleccionado si viene del parámetro
  useEffect(() => {
    if (horarioIdParam) {
      const parsed = Number(horarioIdParam);

      if (Number.isFinite(parsed) && parsed > 0) {
        setHorarioSeleccionado(parsed);
      }
    }
  }, [horarioIdParam]);

  // Separar clases en categorías
  const { claseActual, clasesRecientes, clasesAnteriores } = useMemo(() => {
    if (!clasesData?.clases) {
      return {
        claseActual: null,
        clasesRecientes: [],
        clasesAnteriores: [],
      };
    }

    const clases = clasesData.clases;
    const hoy = new Date().toISOString().split("T")[0];

    // Clase actual o en margen
    const actual = clases.find(
      (c) =>
        (c.estado === "en_curso" || c.estado === "margen_extra") &&
        c.puede_pasar_asistencia,
    );

    // Clases recientes (últimas 10 clases pasadas o editables)
    const recientes = clases
      .filter((c) => c !== actual && c.fecha_clase <= hoy)
      .slice(0, 10);

    // Clases antiguas (resto de clases pasadas)
    const anteriores = clases
      .filter((c) => c !== actual && c.fecha_clase <= hoy)
      .slice(10);

    return {
      claseActual: actual || null,
      clasesRecientes: recientes,
      clasesAnteriores: anteriores,
    };
  }, [clasesData]);

  if (horariosLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando horarios..." size="lg" />
      </div>
    );
  }

  if (!horarios || horarios.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto text-warning mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">No tienes horarios</h3>
        <p className="text-default-500">
          No se encontraron horarios asignados a tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pasar Asistencia
          </h1>
          <p className="text-default-500">
            Selecciona un horario y haz clic en una clase para marcar
            asistencia
          </p>
        </div>
      </div>

      {/* Selector de horario */}
      <Card>
        <CardBody>
          <Select
            className="max-w-md"
            label="Selecciona un horario"
            placeholder="Elige el horario"
            selectedKeys={
              horarioSeleccionado > 0 ? [horarioSeleccionado.toString()] : []
            }
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];

              if (selected) {
                const parsed = Number(selected);

                if (Number.isFinite(parsed) && parsed > 0) {
                  setHorarioSeleccionado(parsed);
                }
              }
            }}
          >
            {horarios.map((h) => (
              <SelectItem
                key={h.id.toString()}
                textValue={`${h.taller_nombre} - ${h.dia_semana} ${h.hora_inicio}-${h.hora_fin}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{h.taller_nombre}</span>
                  <span className="text-sm text-default-500">
                    {h.dia_semana} • {formatTimeHHMM(h.hora_inicio)} -{" "}
                    {formatTimeHHMM(h.hora_fin)} • {h.ubicacion_nombre}
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {/* Contenido de clases */}
      {horarioSeleccionado > 0 && (
        <>
          {clasesLoading ? (
            <div className="flex h-[30vh] w-full items-center justify-center">
              <Spinner label="Cargando clases..." size="lg" />
            </div>
          ) : clasesData ? (
            <div className="space-y-6">
              {/* Clase actual */}
              {claseActual && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                    <h3 className="text-lg font-semibold text-success uppercase">
                      {claseActual.estado === "en_curso"
                        ? "🔴 CLASE EN CURSO - Puedes pasar asistencia ahora"
                        : "⚠️ CLASE TERMINADA - Margen de 10 minutos disponible"}
                    </h3>
                  </div>
                  <ClaseCard
                    key={claseActual.id}
                    destacada
                    clase={claseActual}
                  />
                </div>
              )}

              {/* Clases recientes */}
              {clasesRecientes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="text-primary" size={16} />
                    <h3 className="text-sm font-semibold text-primary uppercase">
                      Clases recientes ({clasesRecientes.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {clasesRecientes.map((clase) => (
                      <ClaseCard key={clase.id} clase={clase} />
                    ))}
                  </div>
                </div>
              )}

              {/* Clases anteriores */}
              {clasesAnteriores.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-default-400" size={16} />
                    <h3 className="text-sm font-semibold text-default-500 uppercase">
                      Clases anteriores ({clasesAnteriores.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {clasesAnteriores.map((clase) => (
                      <ClaseCard key={clase.id} clase={clase} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sin clases */}
              {!claseActual &&
                clasesRecientes.length === 0 &&
                clasesAnteriores.length === 0 && (
                  <Card>
                    <CardBody className="flex flex-col items-center justify-center p-12">
                      <AlertCircle
                        className="text-default-300 mb-4"
                        size={48}
                      />
                      <p className="text-default-500 font-medium">
                        No hay clases registradas para este horario
                      </p>
                      <p className="text-sm text-default-400 text-center mt-2">
                        Las clases se generan automáticamente o puedes crearlas
                        manualmente desde la planificación.
                      </p>
                    </CardBody>
                  </Card>
                )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// Componente de tarjeta de clase
function ClaseCard({
  clase,
  destacada = false,
}: {
  clase: DetalleClase;
  destacada?: boolean;
}) {
  const navigate = useNavigate();
  const [tiempoRestante, setTiempoRestante] = useState(
    clase.tiempo_restante_segundos || 0,
  );

  useEffect(() => {
    if (clase.estado === "margen_extra" && tiempoRestante > 0) {
      const interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(interval);

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [clase.estado, tiempoRestante]);

  const formatTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEstadoChip = () => {
    switch (clase.estado) {
      case "en_curso":
        return (
          <Chip color="success" size="sm" variant="flat">
            En curso
          </Chip>
        );
      case "margen_extra":
        return (
          <Chip color="warning" size="sm" variant="flat">
            Tiempo extra: {formatTiempo(tiempoRestante)}
          </Chip>
        );
      case "pasada":
        return (
          <Chip color="default" size="sm" variant="flat">
            Finalizada
          </Chip>
        );
      default:
        return (
          <Chip color="primary" size="sm" variant="flat">
            Próxima
          </Chip>
        );
    }
  };

  const borderColor = destacada
    ? "border-l-success"
    : clase.puede_pasar_asistencia
      ? "border-l-warning"
      : "border-l-default-200";

  return (
    <Card
      className={`border-l-4 ${borderColor} ${destacada ? "shadow-lg" : ""}`}
      isPressable={clase.puede_pasar_asistencia}
      onPress={() => {
        if (clase.puede_pasar_asistencia) {
          navigate(
            `/profesor/asistencia?horario=${clase.horario_id}&fecha=${clase.fecha_clase}`,
          );
        }
      }}
    >
      <CardBody className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Fecha */}
        <div className="flex flex-col justify-center items-center sm:min-w-[120px] bg-default-100 rounded-lg p-3">
          <span className="text-xs text-default-500 uppercase font-semibold">
            {clase.dia_semana}
          </span>
          <span className="text-2xl font-bold">
            {new Date(clase.fecha_clase + "T00:00:00").getDate()}
          </span>
          <span className="text-xs text-default-500">
            {new Date(clase.fecha_clase + "T00:00:00").toLocaleDateString(
              "es-CL",
              { month: "short", year: "numeric" },
            )}
          </span>
        </div>

        {/* Info */}
        <div className="flex-grow space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-lg">{clase.taller_nombre}</h4>
              <p className="text-sm text-default-500">
                {formatDate(clase.fecha_clase)}
              </p>
            </div>
            {getEstadoChip()}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-default-500">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>
                {formatTimeHHMM(clase.hora_inicio)} -{" "}
                {formatTimeHHMM(clase.hora_fin)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{clase.ubicacion_nombre}</span>
            </div>
          </div>

          {/* Asistencia */}
          <div className="flex items-center gap-2">
            <Users className="text-default-400" size={14} />
            <span className="text-sm text-default-500">
              {clase.asistentes_presentes || 0} / {clase.asistentes_total || 0}{" "}
              presentes
            </span>
            <Progress
              aria-label="Asistencia"
              className="flex-1"
              color={
                clase.asistentes_total
                  ? (clase.asistentes_presentes || 0) / clase.asistentes_total >
                    0.8
                    ? "success"
                    : (clase.asistentes_presentes || 0) /
                          clase.asistentes_total >
                        0.5
                      ? "warning"
                      : "danger"
                  : "default"
              }
              size="sm"
              value={
                clase.asistentes_total
                  ? ((clase.asistentes_presentes || 0) /
                      clase.asistentes_total) *
                    100
                  : 0
              }
            />
          </div>

          {/* Botón de acción */}
          {destacada && clase.puede_pasar_asistencia && (
            <Button
              className="w-full sm:w-auto mt-2"
              color="success"
              size="md"
              startContent={<CheckCircle size={18} />}
              onPress={() =>
                navigate(
                  `/profesor/asistencia?horario=${clase.horario_id}&fecha=${clase.fecha_clase}`,
                )
              }
            >
              Pasar Asistencia Ahora
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

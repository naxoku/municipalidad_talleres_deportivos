import { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Progress,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  ArrowLeft,
  FileText,
  CheckSquare,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { detalleClaseApi, DetalleClase } from "@/api/detalle_clase";

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

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function ClasesHorarioPage() {
  const navigate = useNavigate();
  const { horarioId } = useParams<{ horarioId: string }>();
  const horarioIdNum = Number(horarioId);
  const [selectedTab, setSelectedTab] = useState("recientes");

  // Fetch clases del horario
  const { data: clasesData, isLoading } = useQuery({
    queryKey: ["profesor", "clases_horario", horarioIdNum],
    queryFn: () => detalleClaseApi.getClasesPorHorario(horarioIdNum),
    enabled: Number.isFinite(horarioIdNum) && horarioIdNum > 0,
  });

  // Separar clases por fecha
  const { clasesRecientes, clasesProximas } = useMemo(() => {
    if (!clasesData?.clases) {
      return { clasesRecientes: [], clasesProximas: [] };
    }

    const clases = clasesData.clases;
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    // Ordenar por fecha descendente (más recientes primero)
    const clasesOrdenadas = [...clases].sort((a, b) => {
      return (
        new Date(b.fecha_clase).getTime() - new Date(a.fecha_clase).getTime()
      );
    });

    // Clases recientes: últimas 10 clases pasadas
    const recientes = clasesOrdenadas
      .filter((clase) => {
        const fechaClase = new Date(clase.fecha_clase + "T00:00:00");

        return fechaClase <= hoy;
      })
      .slice(0, 10);

    // Clases próximas: clases futuras
    const proximas = clasesOrdenadas.filter((clase) => {
      const fechaClase = new Date(clase.fecha_clase + "T00:00:00");

      return fechaClase > hoy;
    });

    return {
      clasesRecientes: recientes,
      clasesProximas: proximas,
    };
  }, [clasesData]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando clases..." size="lg" />
      </div>
    );
  }

  if (!clasesData) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="mx-auto text-warning mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">
          No se encontró el horario
        </h3>
        <p className="text-default-500 mb-4">
          El horario solicitado no existe o no tienes acceso.
        </p>
        <Button
          color="primary"
          startContent={<ArrowLeft size={18} />}
          onPress={() => navigate("/profesor/horarios")}
        >
          Volver a Horarios
        </Button>
      </div>
    );
  }

  const { horario } = clasesData;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button
          isIconOnly
          className="self-start"
          size="sm"
          variant="flat"
          onPress={() => navigate("/profesor/horarios")}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {horario.taller_nombre}
          </h1>
          <div className="flex flex-wrap gap-3 mt-2">
            <Chip
              className="capitalize"
              color="primary"
              size="sm"
              startContent={<Clock size={12} />}
              variant="flat"
            >
              {horario.dia_semana} {formatTimeHHMM(horario.hora_inicio)} -{" "}
              {formatTimeHHMM(horario.hora_fin)}
            </Chip>
            <Chip
              color="default"
              size="sm"
              startContent={<MapPin size={12} />}
              variant="flat"
            >
              {horario.ubicacion_nombre}
            </Chip>
          </div>
          <p className="text-default-500 mt-2">
            Selecciona una clase para ver su planificación, alumnos y asistencia
          </p>
        </div>
      </div>

      {/* Tabs de clases */}
      <Tabs
        aria-label="Clases del horario"
        classNames={{
          tabList: "w-full",
          tab: "flex-1",
        }}
        color="primary"
        selectedKey={selectedTab}
        size="lg"
        variant="underlined"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="recientes"
          title={
            <div className="flex items-center gap-2">
              <Calendar className="text-primary" size={18} />
              <span>Clases Recientes</span>
              {clasesRecientes.length > 0 && (
                <Chip color="primary" size="sm" variant="flat">
                  {clasesRecientes.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            {clasesRecientes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {clasesRecientes.map((clase) => (
                  <ClaseCard key={clase.id} clase={clase} />
                ))}
              </div>
            ) : (
              <Card className="w-full">
                <CardBody className="flex flex-col items-center justify-center p-12">
                  <Calendar className="text-default-300 mb-4" size={48} />
                  <p className="text-default-500 font-medium">
                    No hay clases recientes
                  </p>
                  <p className="text-sm text-default-400 text-center mt-2">
                    Las clases recientes aparecerán aquí una vez que se
                    realicen.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
        <Tab
          key="proximas"
          title={
            <div className="flex items-center gap-2">
              <Clock className="text-secondary" size={18} />
              <span>Próximas Clases</span>
              {clasesProximas.length > 0 && (
                <Chip color="secondary" size="sm" variant="flat">
                  {clasesProximas.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            {clasesProximas.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {clasesProximas.map((clase) => (
                  <ClaseCard key={clase.id} clase={clase} />
                ))}
              </div>
            ) : (
              <Card className="w-full">
                <CardBody className="flex flex-col items-center justify-center p-12">
                  <Clock className="text-default-300 mb-4" size={48} />
                  <p className="text-default-500 font-medium">
                    No hay clases próximas programadas
                  </p>
                  <p className="text-sm text-default-400 text-center mt-2">
                    Las próximas clases aparecerán aquí cuando se programen.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

// Componente de tarjeta de clase
function ClaseCard({ clase }: { clase: DetalleClase }) {
  const navigate = useNavigate();

  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  const fechaClase = new Date(clase.fecha_clase + "T00:00:00");
  const esFutura = fechaClase > hoy;
  const esHoy = fechaClase.toDateString() === hoy.toDateString();

  const tienePlanificacion = !!(clase.objetivo || clase.actividades);
  const tieneAsistencia = (clase.asistentes_presentes || 0) > 0;

  const getEstadoChip = () => {
    if (esHoy) {
      return (
        <Chip color="success" size="sm" variant="flat">
          Hoy
        </Chip>
      );
    }
    if (esFutura) {
      return (
        <Chip color="primary" size="sm" variant="flat">
          Próxima
        </Chip>
      );
    }

    return (
      <Chip color="default" size="sm" variant="flat">
        Pasada
      </Chip>
    );
  };

  const borderColor = esHoy
    ? "border-l-success"
    : esFutura
      ? "border-l-primary"
      : "border-l-default-200";

  return (
    <Card
      isPressable
      className={`w-full border-l-4 ${borderColor}`}
      onPress={() => navigate(`/profesor/clases/${clase.id}`)}
    >
      <CardBody className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Fecha */}
        <div className="flex flex-col justify-center items-center sm:min-w-[100px] bg-default-100 rounded-lg p-3">
          <span className="text-xs text-default-500 uppercase font-semibold">
            {clase.dia_semana}
          </span>
          <span className="text-2xl font-bold">
            {new Date(clase.fecha_clase + "T00:00:00").getDate()}
          </span>
          <span className="text-xs text-default-500">
            {formatShortDate(clase.fecha_clase).split(" ").slice(1).join(" ")}
          </span>
        </div>

        {/* Info */}
        <div className="flex-grow space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-lg">{clase.taller_nombre}</h4>
              <p className="text-sm text-default-500 capitalize">
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

          {/* Estado de planificación y asistencia */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Chip
              color={tienePlanificacion ? "success" : "default"}
              size="sm"
              startContent={<FileText size={12} />}
              variant="flat"
            >
              {tienePlanificacion ? "Con planificación" : "Sin planificación"}
            </Chip>
            <Chip
              color={tieneAsistencia ? "success" : "default"}
              size="sm"
              startContent={<CheckSquare size={12} />}
              variant="flat"
            >
              {tieneAsistencia
                ? `${clase.asistentes_presentes}/${clase.asistentes_total} asistencia`
                : "Sin asistencia"}
            </Chip>
          </div>

          {/* Barra de asistencia */}
          {tieneAsistencia && (
            <div className="flex items-center gap-2">
              <Users className="text-default-400" size={14} />
              <Progress
                aria-label="Asistencia"
                className="flex-1"
                color={
                  clase.asistentes_total
                    ? (clase.asistentes_presentes || 0) /
                        clase.asistentes_total >
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
              <span className="text-xs text-default-500 min-w-[60px] text-right">
                {clase.asistentes_presentes || 0}/{clase.asistentes_total || 0}
              </span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

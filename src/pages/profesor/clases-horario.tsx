import { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
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

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
};

export default function ClasesHorarioPage() {
  const navigate = useNavigate();
  const { horarioId } = useParams<{ horarioId: string }>();
  const horarioIdNum = Number(horarioId);
  const [selectedTab, setSelectedTab] = useState("recientes");

  const { data: clasesData, isLoading } = useQuery({
    queryKey: ["profesor", "clases_horario", horarioIdNum],
    queryFn: () => detalleClaseApi.getClasesPorHorario(horarioIdNum),
    enabled: Number.isFinite(horarioIdNum) && horarioIdNum > 0,
  });

  const { clasesRecientes, clasesProximas } = useMemo(() => {
    if (!clasesData?.clases) {
      return { clasesRecientes: [], clasesProximas: [] };
    }

    const clases = clasesData.clases;
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const clasesOrdenadas = [...clases].sort((a, b) => {
      return (
        new Date(b.fecha_clase).getTime() - new Date(a.fecha_clase).getTime()
      );
    });

    const recientes = clasesOrdenadas
      .filter((clase) => {
        const fechaClase = new Date(clase.fecha_clase + "T00:00:00");

        return fechaClase <= hoy;
      })
      .slice(0, 10);

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
        <Card className="border-none shadow-sm">
          <CardBody className="py-16">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="text-warning" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">
              No se encontró el horario
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              El horario solicitado no existe o no tienes acceso.
            </p>
            <Button
              color="primary"
              startContent={<ArrowLeft size={18} />}
              onPress={() => navigate("/profesor/horarios")}
            >
              Volver a Horarios
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { horario } = clasesData;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          isIconOnly
          className="mt-1"
          size="sm"
          variant="flat"
          onPress={() => navigate("/profesor/horarios")}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {horario.taller_nombre}
              </h1>
              <p className="text-sm text-muted-foreground">
                Clases del horario
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info del horario */}
      <Card className="border-l-4 border-l-primary">
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-2">
            <Chip
              className="capitalize"
              color="primary"
              size="sm"
              startContent={<Clock size={14} />}
              variant="flat"
            >
              {horario.dia_semana} {formatTimeHHMM(horario.hora_inicio)} -{" "}
              {formatTimeHHMM(horario.hora_fin)}
            </Chip>
            <Chip
              color="default"
              size="sm"
              startContent={<MapPin size={14} />}
              variant="flat"
            >
              {horario.ubicacion_nombre}
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Tabs de clases */}
      <Tabs
        aria-label="Clases del horario"
        color="primary"
        selectedKey={selectedTab}
        size="md"
        variant="underlined"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="recientes"
          title={
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>Recientes</span>
              {clasesRecientes.length > 0 && (
                <Chip color="primary" size="sm" variant="flat">
                  {clasesRecientes.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-2 space-y-3">
            {clasesRecientes.length > 0 ? (
              clasesRecientes.map((clase) => (
                <ClaseCard key={clase.id} clase={clase} />
              ))
            ) : (
              <Card>
                <CardBody className="flex flex-col items-center justify-center p-12">
                  <Calendar className="text-default-300 mb-4" size={48} />
                  <p className="text-default-500 font-medium">
                    No hay clases recientes
                  </p>
                  <p className="text-sm text-default-400 text-center mt-2">
                    Las clases aparecerán aquí una vez que se realicen.
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
              <Clock size={18} />
              <span>Próximas</span>
              {clasesProximas.length > 0 && (
                <Chip color="secondary" size="sm" variant="flat">
                  {clasesProximas.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-2 space-y-3">
            {clasesProximas.length > 0 ? (
              clasesProximas.map((clase) => (
                <ClaseCard key={clase.id} clase={clase} />
              ))
            ) : (
              <Card>
                <CardBody className="flex flex-col items-center justify-center p-12">
                  <Clock className="text-default-300 mb-4" size={48} />
                  <p className="text-default-500 font-medium">
                    No hay clases próximas
                  </p>
                  <p className="text-sm text-default-400 text-center mt-2">
                    Las próximas clases aparecerán cuando se programen.
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

function ClaseCard({ clase }: { clase: DetalleClase }) {
  const navigate = useNavigate();

  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  const fechaClase = new Date(clase.fecha_clase + "T00:00:00");
  const esFutura = fechaClase > hoy;
  const esHoy = fechaClase.toDateString() === hoy.toDateString();

  const tienePlanificacion = !!(clase.objetivo || clase.actividades);
  const tieneAsistencia = (clase.asistentes_presentes || 0) > 0;
  const porcentajeAsistencia = clase.asistentes_total
    ? Math.round(
        ((clase.asistentes_presentes || 0) / clase.asistentes_total) * 100,
      )
    : 0;

  const borderColor = esHoy
    ? "border-l-success"
    : esFutura
      ? "border-l-primary"
      : "border-l-default-300";

  return (
    <Card
      isPressable
      className={`w-full border-none shadow-md hover:shadow-lg transition-all ${borderColor} border-l-4`}
      onPress={() => navigate(`/profesor/clases/${clase.id}`)}
    >
      <CardBody className="p-0 overflow-hidden">
        <div className="flex">
          {/* Fecha visual */}
          <div
            className={`px-4 py-4 flex flex-col items-center justify-center min-w-[80px] ${
              esHoy
                ? "bg-success/10"
                : esFutura
                  ? "bg-primary/10"
                  : "bg-default-100"
            }`}
          >
            <Calendar
              className={`mb-1 ${
                esHoy
                  ? "text-success"
                  : esFutura
                    ? "text-primary"
                    : "text-default-400"
              }`}
              size={18}
            />
            <span
              className={`text-sm font-bold leading-none ${
                esHoy
                  ? "text-success"
                  : esFutura
                    ? "text-primary"
                    : "text-default-700"
              }`}
            >
              {fechaClase.getDate()}
            </span>
            <span
              className={`text-[10px] mt-0.5 ${
                esHoy
                  ? "text-success/60"
                  : esFutura
                    ? "text-primary/60"
                    : "text-default-500"
              }`}
            >
              {formatShortDate(clase.fecha_clase)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base line-clamp-1">
                  {clase.taller_nombre}
                </h4>
                {esHoy && (
                  <Chip color="success" size="sm" variant="flat">
                    Hoy
                  </Chip>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1 text-default-500">
                <Clock size={12} />
                <span>
                  {formatTimeHHMM(clase.hora_inicio)} -{" "}
                  {formatTimeHHMM(clase.hora_fin)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-default-500">
                <MapPin size={12} />
                <span className="truncate max-w-[150px]">
                  {clase.ubicacion_nombre}
                </span>
              </div>
            </div>

            {/* Chips de estado */}
            <div className="flex flex-wrap gap-2">
              {tienePlanificacion && (
                <Chip
                  color="success"
                  size="sm"
                  startContent={<FileText size={12} />}
                  variant="flat"
                >
                  Planificación
                </Chip>
              )}
              {tieneAsistencia && (
                <Chip
                  color="success"
                  size="sm"
                  startContent={<Users size={12} />}
                  variant="flat"
                >
                  {clase.asistentes_presentes}/{clase.asistentes_total} (
                  {porcentajeAsistencia}%)
                </Chip>
              )}
              {!tieneAsistencia && !esFutura && (
                <Chip
                  color="default"
                  size="sm"
                  startContent={<CheckSquare size={12} />}
                  variant="flat"
                >
                  Sin asistencia
                </Chip>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

import { useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Progress,
} from "@heroui/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Sun,
  Users,
  FileText,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { profesorApi, ClaseHoy } from "@/api/profesor";

const formatTimeHHMM = (timeString: string) => {
  if (!timeString) return "-";

  return timeString.slice(0, 5);
};

export default function ProfesorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ["profesor", "dashboard", user?.profesor_id],
    queryFn: () => profesorApi.getDashboard(user!.profesor_id!),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.profesor_id,
  });

  // Procesar clases del día
  const { currentClasses, upcomingClasses } = useMemo(() => {
    if (!data?.clases_hoy) return { currentClasses: [], upcomingClasses: [] };

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const current: ClaseHoy[] = [];
    const upcoming: ClaseHoy[] = [];

    for (const c of data.clases_hoy) {
      const [hStart, mStart] = c.hora_inicio.split(":").map(Number);
      const [hEnd, mEnd] = c.hora_fin.split(":").map(Number);
      const startMinutes = hStart * 60 + mStart;
      const endMinutes = hEnd * 60 + mEnd;

      if (currentTime >= startMinutes && currentTime < endMinutes) {
        current.push(c);
      } else if (currentTime < startMinutes) {
        upcoming.push(c);
      }
    }

    return { currentClasses: current, upcomingClasses: upcoming };
  }, [data]);

  // Métricas del profesor
  const metrics = useMemo(() => {
    if (!data) {
      return {
        misTalleres: 0,
        totalAlumnos: 0,
        clasesHoy: 0,
        asistenciaPromedio: 0,
      };
    }

    return {
      misTalleres: data.total_talleres,
      totalAlumnos: data.total_alumnos,
      clasesHoy: currentClasses.length + upcomingClasses.length,
      asistenciaPromedio: data.asistencia_promedio,
    };
  }, [data, currentClasses, upcomingClasses]);

  if (dashboardLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando..." size="lg" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar el dashboard
        </h3>
        <p className="text-sm text-default-500">
          No se pudo conectar con el servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Hola, {user?.nombre}!
        </h1>
        <p className="text-default-500 capitalize">
          {new Date().toLocaleDateString("es-CL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BookOpen className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">Mis talleres</p>
              <p className="text-2xl font-bold">{metrics.misTalleres}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <Users className="text-success" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">Total alumnos</p>
              <p className="text-2xl font-bold">{metrics.totalAlumnos}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Calendar className="text-warning" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">Clases hoy</p>
              <p className="text-2xl font-bold">{metrics.clasesHoy}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <CheckCircle className="text-secondary" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">Asistencia</p>
              <p className="text-2xl font-bold">
                {metrics.asistenciaPromedio}%
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Acciones rápidas</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              className="h-20"
              color="primary"
              variant="flat"
              onPress={() => navigate("/profesor/talleres")}
            >
              <div className="flex flex-col items-center gap-2">
                <BookOpen size={24} />
                <span className="text-sm font-semibold">Ver mis talleres</span>
              </div>
            </Button>

            <Button
              className="h-20"
              color="success"
              variant="flat"
              onPress={() => navigate("/profesor/clases-asistencia")}
            >
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={24} />
                <span className="text-sm font-semibold">
                  Registros de asistencia
                </span>
              </div>
            </Button>

            <Button
              className="h-20"
              color="warning"
              variant="flat"
              onPress={() => navigate("/profesor/planificacion")}
            >
              <div className="flex flex-col items-center gap-2">
                <FileText size={24} />
                <span className="text-sm font-semibold">Planificación</span>
              </div>
            </Button>

            <Button
              className="h-20"
              color="secondary"
              variant="flat"
              onPress={() => navigate("/profesor/alumnos")}
            >
              <div className="flex flex-col items-center gap-2">
                <Users size={24} />
                <span className="text-sm font-semibold">Mis alumnos</span>
              </div>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Clases de Hoy */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Mis clases de hoy</h2>

        {/* En Curso */}
        {currentClasses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
              <h3 className="text-sm font-semibold text-success uppercase">
                En curso ({currentClasses.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentClasses.map((c) => (
                <ProfesorClassCard
                  key={c.horario_id}
                  clase={c}
                  status="current"
                />
              ))}
            </div>
          </div>
        )}

        {/* Próximas */}
        {upcomingClasses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="text-primary" size={16} />
              <h3 className="text-sm font-semibold text-primary uppercase">
                Próximas ({upcomingClasses.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingClasses.map((c) => (
                <ProfesorClassCard
                  key={c.horario_id}
                  clase={c}
                  status="upcoming"
                />
              ))}
            </div>
          </div>
        )}

        {/* Sin clases */}
        {currentClasses.length === 0 && upcomingClasses.length === 0 && (
          <Card>
            <CardBody className="flex flex-col items-center justify-center p-12">
              <Sun className="text-default-300 mb-4" size={48} />
              <p className="text-default-500 font-medium">
                Nada programado para hoy
              </p>
              <p className="text-sm text-default-400">Disfruta tu día</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de clase para profesor
function ProfesorClassCard({
  clase,
  status,
}: {
  clase: ClaseHoy;
  status: string;
}) {
  const navigate = useNavigate();
  const isCurrent = status === "current";

  return (
    <Card
      className={`border-l-4 ${isCurrent ? "border-l-success" : "border-l-primary"}`}
    >
      <CardBody className="flex flex-row p-0 overflow-hidden">
        {/* Horario */}
        <div
          className={`flex flex-col justify-center items-center px-4 py-3 min-w-[90px] ${isCurrent ? "bg-success-50" : "bg-primary-50"}`}
        >
          <span
            className={`text-sm font-bold ${isCurrent ? "text-success-700" : "text-primary-700"}`}
          >
            {formatTimeHHMM(clase.hora_inicio)}
          </span>
          <span className="text-xs text-default-400">-</span>
          <span
            className={`text-sm font-bold ${isCurrent ? "text-success-700" : "text-primary-700"}`}
          >
            {formatTimeHHMM(clase.hora_fin)}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center p-4 gap-2 flex-grow">
          <h4 className="font-bold text-lg">{clase.taller_nombre}</h4>

          <div className="flex items-center gap-2 text-sm text-default-500">
            <MapPin size={14} />
            <span>{clase.ubicacion_nombre}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="text-default-400" size={14} />
            <span className="text-sm text-default-500">
              {clase.total_inscritos || 0} / {clase.cupos_max || 0} alumnos
            </span>
            <Progress
              aria-label={`Ocupación: ${clase.total_inscritos} de ${clase.cupos_max}`}
              className="flex-1"
              color="primary"
              size="sm"
              value={(clase.total_inscritos / clase.cupos_max) * 100}
            />
          </div>

          {isCurrent && (
            <Button
              fullWidth
              className="mt-2"
              color="success"
              size="sm"
              onPress={() =>
                navigate(
                  `/profesor/asistencia?horario=${clase.horario_id}&fecha=${new Date().toISOString().split("T")[0]}`,
                )
              }
            >
              Pasar asistencia
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

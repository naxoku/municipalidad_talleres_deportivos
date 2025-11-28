import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  ClipboardCheck,
  Calendar,
  Users,
  Filter,
  Clock,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { profesoresFeatureApi } from "@/features/profesores/api";

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

export default function ProfesorClasesPage() {
  const { user } = useAuth();
  const [filtroTaller, setFiltroTaller] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("pasadas");

  const { data: clases, isLoading } = useQuery({
    queryKey: ["profesor", "todas-clases", user?.profesor_id],
    queryFn: () => profesoresFeatureApi.getClases(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  // Extraer talleres únicos para el filtro
  const talleresUnicos = useMemo(() => {
    if (!clases) return [];

    const talleresMap = new Map();

    clases.forEach((clase: any) => {
      const tallerId = clase.taller_id;
      const tallerNombre = clase.taller_nombre || "Sin nombre";

      if (tallerId && !talleresMap.has(tallerId)) {
        talleresMap.set(tallerId, {
          id: tallerId,
          nombre: tallerNombre,
        });
      }
    });

    return Array.from(talleresMap.values());
  }, [clases]);

  // Filtrar y ordenar clases
  const clasesFiltradas = useMemo(() => {
    if (!clases) return [];

    let filtradas = [...clases];

    // Aplicar filtros
    if (filtroTaller) {
      filtradas = filtradas.filter((clase: any) => {
        const tallerId = clase.taller_id;

        return Number(tallerId) === Number(filtroTaller);
      });
    }

    // Ordenar por fecha descendente (más reciente primero)
    return filtradas.sort(
      (a: any, b: any) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }, [clases, filtroTaller]);

  // Separar clases en pasadas, de hoy y próximas
  const { clasesPasadas, clasesHoy, clasesProximas } = useMemo(() => {
    if (!clasesFiltradas) {
      return { clasesPasadas: [], clasesHoy: [], clasesProximas: [] };
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);
    const now = new Date();

    const pasadas: any[] = [];
    const deHoy: any[] = [];
    const proximas: any[] = [];

    clasesFiltradas.forEach((clase) => {
      const fechaClase = new Date(clase.fecha + "T00:00:00");

      if (fechaClase < hoy) {
        // Clases pasadas (anteriores a hoy)
        pasadas.push(clase);
      } else if (fechaClase > hoy) {
        // Clases futuras
        proximas.push(clase);
      } else {
        // Clases de hoy - verificar horario
        const [horaInicio, minInicio] = (clase.hora_inicio || "00:00")
          .split(":")
          .map(Number);
        const [horaFin, minFin] = (clase.hora_fin || "23:59")
          .split(":")
          .map(Number);

        const inicioClase = new Date(fechaClase);

        inicioClase.setHours(horaInicio, minInicio, 0, 0);

        const finClase = new Date(fechaClase);

        finClase.setHours(horaFin, minFin, 0, 0);

        if (now < inicioClase) {
          // Clase aún no comienza
          proximas.push(clase);
        } else if (now > finClase) {
          // Clase ya terminó
          pasadas.push(clase);
        } else {
          // Clase en curso
          deHoy.push(clase);
        }
      }
    });

    return {
      clasesPasadas: pasadas.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      ),
      clasesHoy: deHoy.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      ),
      clasesProximas: proximas.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      ),
    };
  }, [clasesFiltradas]);

  const limpiarFiltros = () => {
    setFiltroTaller(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner label="Cargando clases..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Historial de Clases
            </h1>
            <p className="text-sm text-muted-foreground">
              Todas las clases realizadas en tus talleres
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-default-500" size={20} />
            <h3 className="text-lg font-semibold">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Taller"
              placeholder="Todos los talleres"
              selectedKeys={
                filtroTaller ? new Set([String(filtroTaller)]) : new Set()
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];

                setFiltroTaller(selected ? Number(selected) : null);
              }}
            >
              {talleresUnicos.map((taller) => (
                <SelectItem key={String(taller.id)}>{taller.nombre}</SelectItem>
              ))}
            </Select>

            <div className="flex items-end">
              <Button
                className="w-full"
                color="default"
                variant="flat"
                onPress={limpiarFiltros}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Botones de navegación */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          color="primary"
          size="sm"
          startContent={<ClipboardCheck size={16} />}
          variant={selectedTab === "pasadas" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("pasadas")}
        >
          Clases pasadas
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<Clock size={16} />}
          variant={selectedTab === "hoy" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("hoy")}
        >
          Clases en curso
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<Calendar size={16} />}
          variant={selectedTab === "proximas" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("proximas")}
        >
          Próximas clases
        </Button>
      </div>

      {/* Contenido */}
      {selectedTab === "pasadas" && (
        <div className="space-y-3">
          {clasesPasadas.length > 0 ? (
            clasesPasadas.map((clase: any) => (
              <ClaseCard key={clase.id} clase={clase} />
            ))
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center justify-center p-12">
                <ClipboardCheck className="text-default-300 mb-4" size={48} />
                <p className="text-default-500 font-medium">
                  No hay clases pasadas
                </p>
                <p className="text-sm text-default-400 text-center mt-2">
                  Las clases pasadas aparecerán aquí.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {selectedTab === "hoy" && (
        <div className="space-y-3">
          {clasesHoy.length > 0 ? (
            clasesHoy.map((clase: any) => (
              <ClaseCard key={clase.id} clase={clase} />
            ))
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center justify-center p-12">
                <Clock className="text-default-300 mb-4" size={48} />
                <p className="text-default-500 font-medium">
                  No hay clases en curso
                </p>
                <p className="text-sm text-default-400 text-center mt-2">
                  Las clases que están actualmente en curso aparecerán aquí.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {selectedTab === "proximas" && (
        <div className="space-y-3">
          {clasesProximas.length > 0 ? (
            clasesProximas.map((clase: any) => (
              <ClaseCard key={clase.id} clase={clase} />
            ))
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center justify-center p-12">
                <Calendar className="text-default-300 mb-4" size={48} />
                <p className="text-default-500 font-medium">
                  No hay clases próximas
                </p>
                <p className="text-sm text-default-400 text-center mt-2">
                  Las próximas clases aparecerán aquí cuando se programen.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ClaseCard({ clase }: { clase: any }) {
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  const now = new Date();
  const fechaClase = new Date(clase.fecha + "T00:00:00");
  const esHoy = fechaClase.toDateString() === hoy.toDateString();

  // Verificar si la clase está actualmente en curso
  let estaEnCurso = false;

  if (esHoy) {
    const [horaInicio, minInicio] = (clase.hora_inicio || "00:00")
      .split(":")
      .map(Number);
    const [horaFin, minFin] = (clase.hora_fin || "23:59")
      .split(":")
      .map(Number);

    const inicioClase = new Date(fechaClase);

    inicioClase.setHours(horaInicio, minInicio, 0, 0);

    const finClase = new Date(fechaClase);

    finClase.setHours(horaFin, minFin, 0, 0);

    estaEnCurso = now >= inicioClase && now <= finClase;
  }

  let esFutura = false;

  if (fechaClase > hoy) {
    esFutura = true;
  } else if (esHoy) {
    // today: check if not ended
    const [hours, minutes] = (clase.hora_fin || "23:59").split(":").map(Number);
    const endTime = new Date(fechaClase);

    endTime.setHours(hours, minutes, 0, 0);
    esFutura = now <= endTime;
  }

  const tieneAsistencia = (clase.asistentes || 0) > 0;
  const porcentajeAsistencia = clase.total
    ? Math.round(((clase.asistentes || 0) / clase.total) * 100)
    : 0;

  // Determinar si la clase ya terminó
  const yaTermino = !esFutura;
  const sinAsistencia = yaTermino && !tieneAsistencia;

  const borderColor = estaEnCurso
    ? "border-l-success"
    : esFutura
      ? "border-l-primary"
      : "border-l-default-300";

  return (
    <Card
      isPressable
      className={`w-full border-none shadow-md hover:shadow-lg transition-all ${borderColor} border-l-4`}
      onPress={() => {
        // Navegar al detalle de la clase
        window.location.href = `/panel-profesor/clases/${clase.id}`;
      }}
    >
      <CardBody className="p-0 overflow-hidden">
        <div className="flex">
          {/* Fecha visual */}
          <div
            className={`px-4 py-4 flex flex-col items-center justify-center min-w-[80px] ${
              estaEnCurso
                ? "bg-success/10"
                : esFutura
                  ? "bg-primary/10"
                  : "bg-default-100"
            }`}
          >
            <Calendar
              className={`mb-1 ${
                estaEnCurso
                  ? "text-success"
                  : esFutura
                    ? "text-primary"
                    : "text-default-400"
              }`}
              size={18}
            />
            <span
              className={`text-sm font-bold leading-none ${
                estaEnCurso
                  ? "text-success"
                  : esFutura
                    ? "text-primary"
                    : "text-default-700"
              }`}
            >
              {formatShortDate(clase.fecha)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base line-clamp-1">
                  {clase.taller_nombre || "Sin taller"}
                </h4>
                {estaEnCurso && (
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
                  {clase.ubicacion_nombre || "Sin ubicación"}
                </span>
              </div>
            </div>

            {/* Chips de estado */}
            <div className="flex flex-wrap gap-2">
              {sinAsistencia && (
                <Chip
                  color="danger"
                  size="sm"
                  startContent={<AlertCircle size={12} />}
                  variant="flat"
                >
                  Sin asistencia
                </Chip>
              )}
              {tieneAsistencia && (
                <Chip
                  color="success"
                  size="sm"
                  startContent={<Users size={12} />}
                  variant="flat"
                >
                  {clase.asistentes}/{clase.total} ({porcentajeAsistencia}%)
                </Chip>
              )}
              {(esFutura || estaEnCurso) && (
                <Chip
                  color={clase.estado === "Realizada" ? "success" : "warning"}
                  size="sm"
                  variant="flat"
                >
                  {clase.estado || "Pendiente"}
                </Chip>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

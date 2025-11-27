import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  ClipboardCheck,
  Calendar,
  Users,
  Filter,
  Clock,
  MapPin,
  CheckSquare,
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
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("");
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

    if (filtroFechaDesde) {
      filtradas = filtradas.filter(
        (clase: any) => new Date(clase.fecha) >= new Date(filtroFechaDesde),
      );
    }

    if (filtroFechaHasta) {
      filtradas = filtradas.filter(
        (clase: any) => new Date(clase.fecha) <= new Date(filtroFechaHasta),
      );
    }

    // Ordenar por fecha descendente (más reciente primero)
    return filtradas.sort(
      (a: any, b: any) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }, [clases, filtroTaller, filtroFechaDesde, filtroFechaHasta]);

  // Separar clases en pasadas y próximas
  const { clasesPasadas, clasesProximas } = useMemo(() => {
    if (!clasesFiltradas) {
      return { clasesPasadas: [], clasesProximas: [] };
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);
    const now = new Date();

    const pasadas = clasesFiltradas
      .filter((clase) => {
        const fechaClase = new Date(clase.fecha + "T00:00:00");

        if (fechaClase < hoy) return true; // past
        if (fechaClase > hoy) return false; // future
        // today: check if ended
        const [hours, minutes] = (clase.hora_fin || "23:59")
          .split(":")
          .map(Number);
        const endTime = new Date(fechaClase);

        endTime.setHours(hours, minutes, 0, 0);

        return now > endTime;
      })
      .sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );

    const proximas = clasesFiltradas
      .filter((clase) => {
        const fechaClase = new Date(clase.fecha + "T00:00:00");

        if (fechaClase < hoy) return false; // past
        if (fechaClase > hoy) return true; // future
        // today: check if not ended
        const [hours, minutes] = (clase.hora_fin || "23:59")
          .split(":")
          .map(Number);
        const endTime = new Date(fechaClase);

        endTime.setHours(hours, minutes, 0, 0);

        return now <= endTime;
      })
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );

    return {
      clasesPasadas: pasadas,
      clasesProximas: proximas,
    };
  }, [clasesFiltradas]);

  const limpiarFiltros = () => {
    setFiltroTaller(null);
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Input
              label="Fecha desde"
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
            />

            <Input
              label="Fecha hasta"
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
            />

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

      {/* Lista de clases */}
      <Tabs
        fullWidth
        aria-label="Historial de clases"
        classNames={{
          base: "w-full",
          tabList: "w-full gap-2 p-1 bg-default-100 rounded-lg",
          cursor: "bg-primary",
          tab: "h-12 px-4",
          tabContent: "group-data-[selected=true]:text-primary-foreground",
        }}
        selectedKey={selectedTab}
        size="lg"
        variant="solid"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="pasadas"
          title={
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} />
              <span>Clases pasadas</span>
            </div>
          }
        >
          <div className="mt-4 space-y-3">
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
        </Tab>
        <Tab
          key="proximas"
          title={
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>Próximas clases</span>
            </div>
          }
        >
          <div className="mt-4 space-y-3">
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
        </Tab>
      </Tabs>
    </div>
  );
}

function ClaseCard({ clase }: { clase: any }) {
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  const now = new Date();
  const fechaClase = new Date(clase.fecha + "T00:00:00");
  const esHoy = fechaClase.toDateString() === hoy.toDateString();

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

  const borderColor = esHoy
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
                  {clase.ubicacion_nombre || "Sin ubicación"}
                </span>
              </div>
            </div>

            {/* Chips de estado */}
            <div className="flex flex-wrap gap-2">
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
              <Chip
                color={clase.estado === "Realizada" ? "success" : "warning"}
                size="sm"
                variant="flat"
              >
                {clase.estado || "Pendiente"}
              </Chip>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

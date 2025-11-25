import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Tabs,
  Tab,
  SortDescriptor,
} from "@heroui/react";
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  User,
  List,
  Edit,
  Filter,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

import { horariosApi } from "@/api/horarios";
import { talleresFeatureApi as talleresApi } from "@/features/talleres/api";
import { profesoresFeatureApi as profesoresApi } from "@/features/profesores/api";
import { ubicacionesApi } from "@/api/ubicaciones";
import { inscripcionesFeatureApi as inscripcionesApi } from "@/features/inscripciones/api";
import WeekCalendar, { CalendarEvent } from "@/components/WeekCalendar";

const columns = [
  { name: "TALLER", uid: "taller", sortable: true },
  { name: "PROFESOR", uid: "profesor", sortable: true },
  { name: "UBICACIÓN", uid: "ubicacion", sortable: true },
  { name: "DÍA / HORA", uid: "dia_hora", sortable: true },
  { name: "INSCRITOS / CUPO", uid: "capacidad", sortable: true },
  { name: "ACCIONES", uid: "actions" },
];

export default function HorariosPage() {
  const navigate = useNavigate();
  const [filterValue, setFilterValue] = useState("");
  const [tallerFilter, setTallerFilter] = useState<string[]>([]);
  const [profesorFilter, setProfesorFilter] = useState<string[]>([]);
  const [ubicacionFilter, setUbicacionFilter] = useState<string[]>([]);
  const [diaFilter, setDiaFilter] = useState<string[]>([]);
  // Removed secondary filters: horaInicioFilter, horaFinFilter, capacidad and alumnos filters
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(
    {} as SortDescriptor,
  );

  // Constantes para el calendario
  const CALENDAR_START_HOUR = 8;
  const CALENDAR_END_HOUR = 22;

  const {
    data: horarios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["horarios"],
    queryFn: horariosApi.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: talleres } = useQuery({
    queryKey: ["talleres"],
    queryFn: talleresApi.getAll,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: profesores } = useQuery({
    queryKey: ["profesores"],
    queryFn: profesoresApi.getAll,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: ubicaciones } = useQuery({
    queryKey: ["ubicaciones"],
    queryFn: ubicacionesApi.getAll,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: inscripciones } = useQuery({
    queryKey: ["inscripciones"],
    queryFn: inscripcionesApi.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calcular estadísticas para cada horario
  const horariosConEstadisticas = useMemo(() => {
    if (!horarios || !talleres) return [];

    return horarios.map((horario) => {
      // Encontrar el taller para obtener capacidad
      const tallerId =
        typeof horario.taller_id === "string"
          ? parseInt(horario.taller_id)
          : horario.taller_id;
      const taller = talleres.find((t) => t.id === tallerId);

      // Calcular alumnos inscritos (usando datos reales de inscripciones)
      const alumnosInscritos =
        inscripciones?.filter((i: any) => i.horario_id === horario.id).length ||
        0;

      // Calcular clases programadas (simulado - basado en duración del taller)
      const clasesProgramadas = Math.floor(Math.random() * 12) + 8; // Simulado

      return {
        ...horario,
        taller_nombre: horario.taller_nombre || "Sin taller",
        profesor_nombre: horario.profesor_nombre || "Sin profesor",
        ubicacion_nombre: horario.ubicacion_nombre || "Sin ubicación",
        capacidad: horario.cupos_max || taller?.capacidad_maxima || 20, // Usar cupos_max del horario o capacidad del taller
        alumnos_inscritos: alumnosInscritos,
        clases_programadas: clasesProgramadas,
        ultima_modificacion: new Date().toLocaleDateString("es-CL"),
      };
    });
  }, [horarios, talleres, inscripciones]);

  const filteredHorarios = useMemo(() => {
    let filtered = horariosConEstadisticas || [];

    // Filtro por búsqueda general (taller, profesor, ubicación)
    if (filterValue) {
      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const normalizedFilter = normalizeText(filterValue);

      filtered = filtered.filter(
        (horario) =>
          normalizeText(horario.taller_nombre || "").includes(
            normalizedFilter,
          ) ||
          normalizeText(horario.profesor_nombre || "").includes(
            normalizedFilter,
          ) ||
          normalizeText(horario.ubicacion_nombre || "").includes(
            normalizedFilter,
          ),
      );
    }

    // Filtro por taller
    if (tallerFilter.length > 0) {
      filtered = filtered.filter((horario) => {
        const tallerKey = horario.taller_nombre
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_");

        return tallerFilter.includes(tallerKey || "");
      });
    }

    // Filtro por profesor
    if (profesorFilter.length > 0) {
      filtered = filtered.filter((horario) => {
        const profesorKey = horario.profesor_nombre
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_");

        return profesorFilter.includes(profesorKey || "");
      });
    }

    // Filtro por ubicación
    if (ubicacionFilter.length > 0) {
      filtered = filtered.filter((horario) => {
        const ubicacionKey = horario.ubicacion_nombre
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_");

        return ubicacionFilter.includes(ubicacionKey || "");
      });
    }

    // Filtro por día de la semana
    if (diaFilter.length > 0) {
      filtered = filtered.filter((horario) =>
        diaFilter.some((dia) =>
          horario.dia_semana?.toLowerCase().includes(dia.toLowerCase()),
        ),
      );
    }

    // Sorting
    if (sortDescriptor.column) {
      filtered.sort((a, b) => {
        const column = sortDescriptor.column as keyof typeof a;
        const aValue = a[column] || "";
        const bValue = b[column] || "";

        if (aValue < bValue)
          return sortDescriptor.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortDescriptor.direction === "ascending" ? 1 : -1;

        return 0;
      });
    }

    return filtered;
  }, [
    horariosConEstadisticas,
    filterValue,
    tallerFilter,
    profesorFilter,
    ubicacionFilter,
    diaFilter,
    sortDescriptor,
  ]);

  // Transformar datos para el calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredHorarios.map((horario) => ({
      id: horario.id,
      title: horario.taller_nombre || "Sin taller",
      subtitle: horario.descripcion || undefined,
      day: horario.dia_semana || "",
      start: horario.hora_inicio || "",
      end: horario.hora_fin || "",
      profesor_nombre: horario.profesor_nombre,
      ubicacion_nombre: horario.ubicacion_nombre,
      taller_id: horario.taller_id,
      profesor_id: horario.profesor_id,
      ubicacion_id: horario.ubicacion_id,
      capacidad: horario.capacidad,
      alumnos_inscritos: horario.alumnos_inscritos,
    }));
  }, [filteredHorarios]);

  const handleEventPress = (event: CalendarEvent) => {
    // Navegar al detalle del horario
    navigate(`/horarios/${event.id}`);
  };

  const profesorOptions = useMemo(() => {
    if (!profesores) return [];

    const profesoresUnicos = new Map<string, { key: string; label: string }>();

    profesores.forEach((profesor) => {
      const key = profesor.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");

      profesoresUnicos.set(key, {
        key,
        label: profesor.nombre,
      });
    });

    return Array.from(profesoresUnicos.values());
  }, [profesores]);

  const ubicacionOptions = useMemo(() => {
    if (!ubicaciones) return [];

    const ubicacionesUnicas = new Map<string, { key: string; label: string }>();

    ubicaciones.forEach((ubicacion) => {
      const key = ubicacion.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");

      ubicacionesUnicas.set(key, {
        key,
        label: ubicacion.nombre,
      });
    });

    return Array.from(ubicacionesUnicas.values());
  }, [ubicaciones]);

  const tallerOptions = useMemo(() => {
    if (!talleres) return [];

    const talleresUnicos = new Map<string, { key: string; label: string }>();

    talleres.forEach((taller) => {
      const key = taller.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");

      talleresUnicos.set(key, {
        key,
        label: taller.nombre,
      });
    });

    return Array.from(talleresUnicos.values());
  }, [talleres]);

  const diasOptions = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miércoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sábado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  const renderCell = (horario: any, columnKey: React.Key) => {
    const cellValue = horario[columnKey as keyof typeof horario];

    switch (columnKey) {
      case "taller":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">
              {horario.taller_nombre || "Sin taller"}
            </p>
          </div>
        );
      case "profesor":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">
              {horario.profesor_nombre || "Sin profesor"}
            </p>
          </div>
        );
      case "ubicacion":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">
              {horario.ubicacion_nombre || "Sin ubicación"}
            </p>
          </div>
        );
      case "dia_hora":
        return (
          <div className="flex flex-col">
            <p className="text-sm font-medium capitalize">
              {horario.dia_semana}
            </p>
            <p className="text-sm text-default-600">
              {horario.hora_inicio?.slice(0, 5)} -{" "}
              {horario.hora_fin?.slice(0, 5)}
            </p>
          </div>
        );
      case "capacidad":
        return (
          <div className="flex flex-col">
            <p className="font-bold text-sm">
              {horario.alumnos_inscritos} / {horario.capacidad}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="relative flex justify-center items-center gap-2">
            <Button
              isIconOnly
              aria-label="Editar horario"
              size="sm"
              variant="light"
              onPress={() => navigate(`/horarios/${horario.id}`)}
            >
              <Edit className="text-default-400" size={16} />
            </Button>
          </div>
        );
      default:
        return String(cellValue);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Cargando horarios..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar los horarios
        </h3>
        <p className="text-sm text-default-500 mb-4">
          No se pudo conectar con el servidor. Verifica que el backend esté
          ejecutándose.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de horarios</h1>
      </div>

      {/* Selector de vista */}
      <Tabs
        classNames={{
          tabList: "bg-default-50 p-1 rounded-lg",
          tab: "px-4 py-2",
        }}
        selectedKey={viewMode}
        onSelectionChange={(key) => setViewMode(key as "table" | "calendar")}
      >
        <Tab
          key="table"
          title={
            <div className="flex items-center gap-2">
              <List size={16} />
              <span>Tabla</span>
            </div>
          }
        />
        <Tab
          key="calendar"
          title={
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Calendario</span>
            </div>
          }
        />
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 bg-content1 p-4 rounded-lg shadow-sm">
        <Input
          isClearable
          className="w-full sm:flex-1"
          placeholder="Buscar por taller, profesor o ubicación..."
          startContent={<Search className="text-default-300" />}
          value={filterValue}
          onClear={() => setFilterValue("")}
          onValueChange={setFilterValue}
        />
        <div className="flex gap-2 sm:w-auto justify-end">
          <Button
            className="w-full sm:w-auto"
            color="primary"
            endContent={<Plus size={20} />}
          >
            Nuevo Horario
          </Button>
        </div>
      </div>

      {/* Filtros mejorados */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="text-primary" size={18} />
              <h3 className="text-lg font-semibold">Filtros de búsqueda</h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Primera fila: Filtros principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-default-700 flex items-center gap-2"
                  htmlFor="taller-select"
                >
                  <BookOpen className="text-primary" size={16} />
                  Taller
                </label>
                <Select
                  aria-label="Filtrar por taller"
                  className="w-full"
                  id="taller-select"
                  placeholder="Todos los talleres"
                  selectedKeys={tallerFilter}
                  selectionMode="multiple"
                  size="sm"
                  onSelectionChange={(keys) =>
                    setTallerFilter(Array.from(keys) as string[])
                  }
                >
                  {tallerOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-default-700 flex items-center gap-2"
                  htmlFor="profesor-select"
                >
                  <User className="text-success" size={16} />
                  Profesor
                </label>
                <Select
                  aria-label="Filtrar por profesor"
                  className="w-full"
                  id="profesor-select"
                  placeholder="Todos los profesores"
                  selectedKeys={profesorFilter}
                  selectionMode="multiple"
                  size="sm"
                  onSelectionChange={(keys) =>
                    setProfesorFilter(Array.from(keys) as string[])
                  }
                >
                  {profesorOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-default-700 flex items-center gap-2"
                  htmlFor="ubicacion-select"
                >
                  <MapPin className="text-warning" size={16} />
                  Ubicación
                </label>
                <Select
                  aria-label="Filtrar por ubicación"
                  className="w-full"
                  id="ubicacion-select"
                  placeholder="Todas las ubicaciones"
                  selectedKeys={ubicacionFilter}
                  selectionMode="multiple"
                  size="sm"
                  onSelectionChange={(keys) =>
                    setUbicacionFilter(Array.from(keys) as string[])
                  }
                >
                  {ubicacionOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-default-700 flex items-center gap-2"
                  htmlFor="dia-select"
                >
                  <Calendar className="text-secondary" size={16} />
                  Día de la semana
                </label>
                <Select
                  aria-label="Filtrar por día"
                  className="w-full"
                  id="dia-select"
                  placeholder="Todos los días"
                  selectedKeys={diaFilter}
                  selectionMode="multiple"
                  size="sm"
                  onSelectionChange={(keys) =>
                    setDiaFilter(Array.from(keys) as string[])
                  }
                >
                  {diasOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Secondary filters removed - keeping only primary filters for clarity */}
          </div>

          {/* Chips de filtros activos */}
          <div className="flex flex-wrap gap-2 mt-4">
            {tallerFilter.length > 0 &&
              tallerFilter.map((tallerKey) => {
                const tallerOption = tallerOptions.find(
                  (opt) => opt.key === tallerKey,
                );

                return (
                  <Chip
                    key={tallerKey}
                    color="primary"
                    size="sm"
                    startContent={<BookOpen size={14} />}
                    variant="flat"
                    onClose={() =>
                      setTallerFilter(
                        tallerFilter.filter((t) => t !== tallerKey),
                      )
                    }
                  >
                    Taller: {tallerOption?.label || tallerKey}
                  </Chip>
                );
              })}
            {profesorFilter.length > 0 &&
              profesorFilter.map((profesorKey) => {
                const profesorOption = profesorOptions.find(
                  (opt) => opt.key === profesorKey,
                );

                return (
                  <Chip
                    key={profesorKey}
                    color="success"
                    size="sm"
                    startContent={<User size={14} />}
                    variant="flat"
                    onClose={() =>
                      setProfesorFilter(
                        profesorFilter.filter((p) => p !== profesorKey),
                      )
                    }
                  >
                    Profesor: {profesorOption?.label || profesorKey}
                  </Chip>
                );
              })}
            {ubicacionFilter.length > 0 &&
              ubicacionFilter.map((ubicacionKey) => {
                const ubicacionOption = ubicacionOptions.find(
                  (opt) => opt.key === ubicacionKey,
                );

                return (
                  <Chip
                    key={ubicacionKey}
                    color="warning"
                    size="sm"
                    startContent={<MapPin size={14} />}
                    variant="flat"
                    onClose={() =>
                      setUbicacionFilter(
                        ubicacionFilter.filter((u) => u !== ubicacionKey),
                      )
                    }
                  >
                    Ubicación: {ubicacionOption?.label || ubicacionKey}
                  </Chip>
                );
              })}
            {diaFilter.length > 0 &&
              diaFilter.map((dia) => (
                <Chip
                  key={dia}
                  color="secondary"
                  size="sm"
                  startContent={<Calendar size={14} />}
                  variant="flat"
                  onClose={() =>
                    setDiaFilter(diaFilter.filter((d) => d !== dia))
                  }
                >
                  Día:{" "}
                  {diasOptions.find((opt) => opt.key === dia)?.label || dia}
                </Chip>
              ))}
            {/* Secondary chips removed */}
          </div>
        </CardBody>
      </Card>

      {viewMode === "table" && (
        <Table
          isStriped
          aria-label="Tabla de horarios"
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={"No hay horarios registrados."}
            items={filteredHorarios}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {viewMode === "calendar" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Calendario semanal
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Horarios programados de {CALENDAR_START_HOUR}:00 a{" "}
                {CALENDAR_END_HOUR}:00 horas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {calendarEvents.length}
                </div>
                <div className="text-xs text-gray-500">
                  horarios programados
                </div>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="text-right">
                <div className="text-2xl font-bold text-success">
                  {new Set(calendarEvents.map((e) => e.taller_id)).size}
                </div>
                <div className="text-xs text-gray-500">talleres activos</div>
              </div>
            </div>
          </div>

          <Card className="shadow-lg border-0 overflow-hidden">
            <CardBody className="p-0">
              <WeekCalendar
                endHour={CALENDAR_END_HOUR}
                events={calendarEvents}
                startHour={CALENDAR_START_HOUR}
                onEventPress={handleEventPress}
              />
            </CardBody>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>
              Haz clic en cualquier horario para ver más detalles y gestionar el
              horario
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

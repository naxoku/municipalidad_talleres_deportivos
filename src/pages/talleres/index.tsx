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
  SortDescriptor,
} from "@heroui/react";
import { Plus, Search, Edit, Filter, CheckCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

import { Taller } from "@/types/schema";
import { talleresApi } from "@/api/talleres";

const columns = [
  { name: "NOMBRE", uid: "nombre", sortable: true },
  { name: "DESCRIPCIÓN", uid: "descripcion", sortable: false },
  { name: "PROFESOR(ES)", uid: "profesores", sortable: false },
  { name: "HORARIOS", uid: "horarios_count", sortable: true },
  { name: "ALUMNOS", uid: "alumnos_count", sortable: true },
  { name: "ESTADO", uid: "estado", sortable: true },
  { name: "ACCIONES", uid: "actions" },
];

export default function TalleresPage() {
  const navigate = useNavigate();
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [profesorFilter, setProfesorFilter] = useState<string[]>([]);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(
    {} as SortDescriptor,
  );

  const {
    data: talleres,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["talleres"],
    queryFn: talleresApi.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredTalleres = useMemo(() => {
    let filtered = talleres || [];

    // Filtro por nombre
    if (filterValue) {
      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const normalizedFilter = normalizeText(filterValue);

      filtered = filtered.filter((taller) =>
        normalizeText(taller.nombre).includes(normalizedFilter),
      );
    }

    // Filtro por estado
    if (statusFilter.length > 0) {
      filtered = filtered.filter((taller) => {
        const estado = taller.activo ? "activo" : "pausado";

        return statusFilter.includes(estado);
      });
    }

    // Filtro por profesor
    if (profesorFilter.length > 0) {
      filtered = filtered.filter((taller) => {
        return profesorFilter.some((profKey) => {
          if (profKey === "sin_asignar") {
            return (
              !taller.profesores ||
              !Array.isArray(taller.profesores) ||
              taller.profesores.length === 0
            );
          }

          if (!taller.profesores || !Array.isArray(taller.profesores)) {
            return false;
          }

          return taller.profesores.some(
            (p: any) =>
              p.nombre &&
              p.nombre.toLowerCase().replace(/\s+/g, "_") === profKey,
          );
        });
      });
    }

    // Filtro por ubicación - deshabilitado por ahora ya que no se cargan ubicaciones en lista
    // if (ubicacionFilter.length > 0) {
    //   filtered = filtered.filter((taller) =>
    //     taller.ubicaciones?.some((ubicacion: any) =>
    //       ubicacionFilter.some(ubic => ubicacion.nombre?.toLowerCase().includes(ubic.toLowerCase()))
    //     )
    //   );
    // }

    // Filtro por día - deshabilitado por ahora ya que no se cargan horarios en lista
    // if (diaFilter.length > 0) {
    //   filtered = filtered.filter((taller) =>
    //     taller.horarios?.some((horario: any) =>
    //       diaFilter.some(dia => horario.dia_semana?.toLowerCase() === dia.toLowerCase())
    //     )
    //   );
    // }

    // Filtro por categoría
    // if (categoriaFilter.length > 0) {
    //   filtered = filtered.filter(
    //     (taller) =>
    //       taller.categoria &&
    //       categoriaFilter.includes(taller.categoria.toLowerCase()),
    //   );
    // }

    // Occupation filter removed

    // Sorting
    if (sortDescriptor.column) {
      filtered.sort((a, b) => {
        const column = sortDescriptor.column as keyof Taller;
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
  }, [talleres, filterValue, statusFilter, profesorFilter, sortDescriptor]);

  // Extraer opciones dinámicas para los filtros
  const profesorOptions = useMemo(() => {
    if (!talleres || !Array.isArray(talleres) || talleres.length === 0) {
      // Opciones por defecto si no hay datos
      return [{ key: "sin_asignar", label: "Sin asignar" }];
    }

    const profesoresUnicos = new Map<string, { key: string; label: string }>();

    talleres.forEach((taller: any) => {
      if (taller.profesores && Array.isArray(taller.profesores)) {
        taller.profesores.forEach((prof: any) => {
          if (prof.nombre) {
            const key = prof.nombre.toLowerCase().replace(/\s+/g, "_");

            profesoresUnicos.set(key, {
              key,
              label: prof.nombre,
            });
          }
        });
      }
    });

    // Si no hay profesores, usar opción por defecto
    if (profesoresUnicos.size === 0) {
      return [{ key: "sin_asignar", label: "Sin asignar" }];
    }

    // Agregar opción "Sin asignar" al inicio
    const opciones = Array.from(profesoresUnicos.values());

    opciones.unshift({ key: "sin_asignar", label: "Sin asignar" });

    return opciones;
  }, [talleres]);

  // ubicacionOptions & diaOptions removed - not used in simplified filters
  // diaOptions removed - day filter not part of the main filters

  const renderCell = (taller: Taller, columnKey: React.Key) => {
    const cellValue = taller[columnKey as keyof Taller];

    switch (columnKey) {
      case "nombre":
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">{taller.nombre}</p>
            </div>
          </div>
        );
      case "descripcion":
        return (
          <div className="flex flex-col">
            <p className="text-sm">{taller.descripcion || "Sin descripción"}</p>
          </div>
        );
      case "profesores":
        const profesoresList =
          taller.profesores &&
          Array.isArray(taller.profesores) &&
          taller.profesores.length > 0
            ? taller.profesores.map((p: any) => p.nombre).join(", ")
            : "Sin asignar";

        return (
          <div className="flex flex-col">
            <p className="text-sm">{profesoresList}</p>
          </div>
        );
      case "horarios_count":
        const horariosCount = taller.horarios_count || 0;

        return (
          <div className="flex justify-center items-center h-full">
            <Chip className="w-fit" color="primary" size="sm" variant="flat">
              {horariosCount}
            </Chip>
          </div>
        );
      case "alumnos_count":
        const alumnosCount = taller.alumnos_count || 0;

        return (
          <div className="flex justify-center items-center h-full">
            <Chip className="w-fit" color="success" size="sm" variant="flat">
              {alumnosCount}
            </Chip>
          </div>
        );
      case "estado":
        const estado = taller.activo ? "Activo" : "Pausado";
        const color = taller.activo ? "success" : "warning";

        return (
          <div className="flex justify-center items-center h-full">
            <Chip
              className="capitalize"
              color={color as any}
              size="sm"
              variant="flat"
            >
              {estado}
            </Chip>
          </div>
        );
      case "actions":
        return (
          <div className="flex justify-center items-center h-full">
            <div className="relative flex justify-end items-center gap-2">
              <Button
                isIconOnly
                aria-label="Editar taller"
                size="sm"
                variant="light"
                onPress={() => navigate(`/talleres/${taller.id}`)}
              >
                <Edit className="text-default-400" size={16} />
              </Button>
            </div>
          </div>
        );
      default:
        return String(cellValue);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Cargando talleres..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar los talleres
        </h3>
        <p className="text-sm text-default-500 mb-4">
          No se pudo conectar con el servidor. Verifica que el backend esté
          ejecutándose.
        </p>
        <p className="text-xs text-default-400">
          URL:{" "}
          {import.meta.env.VITE_API_URL || "http://localhost/talleres_backend"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de talleres</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-content1 p-4 rounded-lg shadow-sm">
        <Input
          isClearable
          className="w-full sm:flex-1"
          placeholder="Buscar por nombre..."
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
            Nuevo Taller
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-default-700 flex items-center gap-2"
                  htmlFor="estado-select"
                >
                  <CheckCircle className="text-primary" size={16} />
                  Estado
                </label>
                <Select
                  aria-label="Filtrar por estado"
                  className="w-full"
                  id="estado-select"
                  placeholder="Todos los estados"
                  selectedKeys={statusFilter}
                  selectionMode="multiple"
                  size="sm"
                  onSelectionChange={(keys) =>
                    setStatusFilter(Array.from(keys) as string[])
                  }
                >
                  <SelectItem key="activo">Activo</SelectItem>
                  <SelectItem key="pausado">Pausado</SelectItem>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-default-700 flex items-center gap-2"
                  htmlFor="profesor-select"
                >
                  <User className="text-warning" size={16} />
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

              {/* Ubicación filter removed to keep the main filters only */}
            </div>

            {/* Secondary filters removed - keeping only main filters */}
          </div>

          {/* Chips de filtros activos */}
          <div className="flex flex-wrap gap-2 mt-4">
            {statusFilter.length > 0 &&
              statusFilter.map((status) => (
                <Chip
                  key={status}
                  color="primary"
                  size="sm"
                  startContent={<CheckCircle size={14} />}
                  variant="flat"
                  onClose={() =>
                    setStatusFilter(statusFilter.filter((s) => s !== status))
                  }
                >
                  Estado: {status === "activo" ? "Activo" : "Pausado"}
                </Chip>
              ))}
            {profesorFilter.length > 0 &&
              profesorFilter.map((profesorKey) => {
                const profesorOption = profesorOptions.find(
                  (opt) => opt.key === profesorKey,
                );

                return (
                  <Chip
                    key={profesorKey}
                    color="warning"
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
            {/* Ubicación chips removed */}
            {/* Día chips removed */}
            {/* Ocupación chips removed */}
          </div>
        </CardBody>
      </Card>

      <Table
        isStriped
        aria-label="Tabla de talleres"
        className="w-full"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={
                column.uid === "actions" ||
                column.uid === "horarios_count" ||
                column.uid === "alumnos_count" ||
                column.uid === "estado"
                  ? "center"
                  : "start"
              }
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={"No hay talleres registrados."}
          items={filteredTalleres}
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
    </div>
  );
}

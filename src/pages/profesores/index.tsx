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
import { Plus, Search, Edit, Filter, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

import { profesoresFeatureApi as profesoresApi } from "@/features/profesores/api";
import { talleresFeatureApi as talleresApi } from "@/features/talleres/api";
import { Profesor } from "@/types/schema";

const columns = [
  { name: "NOMBRE", uid: "nombre_completo", sortable: true },
  { name: "EMAIL", uid: "email", sortable: true },
  { name: "TELÉFONO", uid: "telefono", sortable: false },
  { name: "TALLERES ASIGNADOS", uid: "talleres_asignados", sortable: false },
  { name: "CARGA SEMANAL", uid: "carga_semanal", sortable: true },
  { name: "CLASES ESTA SEMANA", uid: "clases_semana", sortable: true },
  { name: "ESTADO", uid: "estado", sortable: true },
  { name: "ACCIONES", uid: "actions" },
];

export default function ProfesoresPage() {
  const navigate = useNavigate();
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(
    {} as SortDescriptor,
  );

  const {
    data: profesores,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profesores"],
    queryFn: profesoresApi.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useQuery({
    queryKey: ["talleres"],
    queryFn: talleresApi.getAll,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calcular estadísticas para cada profesor (ahora vienen del backend)
  const profesoresConEstadisticas = useMemo(() => {
    if (!profesores) return profesores || [];

    return (profesores || []).map((profesor) => {
      return {
        ...profesor,
        talleres_asignados: profesor.talleres_asignados || 0, // ahora es número
        carga_semanal: profesor.carga_semanal || 0,
        clases_semana: profesor.clases_semana || 0,
        estado: profesor.estado || "Activo",
        ultima_modificacion:
          profesor.ultima_modificacion ||
          new Date().toLocaleDateString("es-CL"),
      } as Profesor;
    });
  }, [profesores]);

  const filteredProfesores = useMemo(() => {
    let filtered = profesoresConEstadisticas || [];

    // Filtro por nombre o correo
    if (filterValue) {
      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const normalizedFilter = normalizeText(filterValue);

      filtered = filtered.filter(
        (profesor) =>
          normalizeText(profesor.nombre).includes(normalizedFilter) ||
          normalizeText(profesor.email || "").includes(normalizedFilter),
      );
    }

    // Filtro por estado
    if (statusFilter.length > 0) {
      filtered = filtered.filter((profesor) =>
        statusFilter.includes((profesor.estado || "activo").toLowerCase()),
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
  }, [profesoresConEstadisticas, filterValue, statusFilter, sortDescriptor]);

  const renderCell = (profesor: any, columnKey: React.Key) => {
    const cellValue = profesor[columnKey as keyof typeof profesor];

    switch (columnKey) {
      case "nombre_completo":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{profesor.nombre}</p>
          </div>
        );
      case "email":
        return (
          <div className="flex flex-col">
            <p className="text-sm">{profesor.email || "Sin email"}</p>
          </div>
        );
      case "telefono":
        return (
          <div className="flex flex-col">
            <p className="text-sm">{profesor.telefono || "Sin teléfono"}</p>
          </div>
        );
      case "talleres_asignados":
        const numeroTalleres = profesor.talleres_asignados || 0;

        return (
          <div className="flex justify-center items-center h-full">
            <Chip className="w-fit" color="primary" size="sm" variant="flat">
              {numeroTalleres} taller{numeroTalleres !== 1 ? "es" : ""}
            </Chip>
          </div>
        );
      case "carga_semanal":
        return (
          <div className="flex justify-center items-center h-full">
            <Chip className="w-fit" color="warning" size="sm" variant="flat">
              {profesor.carga_semanal || 0} horas
            </Chip>
          </div>
        );
      case "clases_semana":
        return (
          <div className="flex justify-center items-center h-full">
            <Chip className="w-fit" color="secondary" size="sm" variant="flat">
              {profesor.clases_semana || 0} clases
            </Chip>
          </div>
        );
      case "estado":
        const estado = profesor.estado || "Activo";
        const color = estado === "Activo" ? "success" : "warning";

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
          <div className="relative flex justify-center items-center gap-2">
            <Button
              isIconOnly
              aria-label="Editar profesor"
              size="sm"
              variant="light"
              onPress={() => navigate(`/profesores/${profesor.id}`)}
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
        <Spinner label="Cargando profesores..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar los profesores
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
        <h1 className="text-2xl font-bold">Gestión de profesores</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-content1 p-4 rounded-lg shadow-sm">
        <Input
          isClearable
          className="w-full sm:flex-1"
          placeholder="Buscar por nombre o correo..."
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
            Nuevo Profesor
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
            <div className="grid grid-cols-1 gap-4">
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
                  <SelectItem key="deshabilitado">Deshabilitado</SelectItem>
                </Select>
              </div>

              {/* Taller filter removed - now stats come from backend */}
            </div>

            {/* Secondary filters removed */}
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
                  Estado: {status === "activo" ? "Activo" : "Deshabilitado"}
                </Chip>
              ))}
            {/* Taller chips removed - filter removed */}
          </div>
        </CardBody>
      </Card>

      <Table
        isStriped
        aria-label="Tabla de profesores"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={
                column.uid === "actions" ||
                column.uid === "talleres_asignados" ||
                column.uid === "carga_semanal" ||
                column.uid === "clases_semana" ||
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
          emptyContent={"No hay profesores registrados."}
          items={filteredProfesores}
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

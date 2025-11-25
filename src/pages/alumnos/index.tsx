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
import { Plus, Search, Edit, Filter, Tag, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";

import { alumnosFeatureApi as alumnosApi } from "@/features/alumnos/api";
import { talleresFeatureApi as talleresApi } from "@/features/talleres/api";
import { inscripcionesFeatureApi as inscripcionesApi } from "@/features/inscripciones/api";
import { Alumno } from "@/types/schema";

const columns = [
  { name: "NOMBRE", uid: "nombre_completo", sortable: true },
  { name: "RUT", uid: "rut", sortable: true },
  { name: "EDAD", uid: "edad", sortable: true },
  { name: "SEXO", uid: "sexo", sortable: false },
  { name: "TELÉFONO", uid: "telefono", sortable: false },
  { name: "CORREO", uid: "correo", sortable: false },
  { name: "TUTOR", uid: "tutor", sortable: false },
  { name: "TALLER(ES) INSCRITO", uid: "talleres_inscritos", sortable: false },
  { name: "ACCIONES", uid: "actions" },
];

export default function AlumnosPage() {
  const navigate = useNavigate();
  const [filterValue, setFilterValue] = useState("");
  const [sexoFilter, setSexoFilter] = useState<string[]>([]);
  const [tallerFilter, setTallerFilter] = useState<string[]>([]);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(
    {} as SortDescriptor,
  );

  const {
    data: alumnos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["alumnos"],
    queryFn: alumnosApi.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: talleres } = useQuery({
    queryKey: ["talleres"],
    queryFn: talleresApi.getAll,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: inscripciones } = useQuery({
    queryKey: ["inscripciones"],
    queryFn: inscripcionesApi.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Calcular estadísticas para cada alumno
  const alumnosConEstadisticas = useMemo(() => {
    if (!alumnos) return alumnos || [];

    return (alumnos || []).map((alumno) => {
      // Calcular edad
      const edad =
        new Date().getFullYear() -
        new Date(alumno.fecha_nacimiento).getFullYear();

      // Talleres inscritos (desde las inscripciones)
      const talleresInscritos =
        inscripciones
          ?.filter((i: { alumno_id: number }) => i.alumno_id === alumno.id)
          .map((i: { taller_nombre: any }) => i.taller_nombre) || [];

      return {
        ...alumno,
        edad,
        talleres_inscritos: talleresInscritos,
      } as Alumno;
    });
  }, [alumnos, inscripciones]);

  const filteredAlumnos = useMemo(() => {
    let filtered = alumnosConEstadisticas || [];

    // Filtro por nombre, apellido o RUT
    if (filterValue) {
      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const normalizedFilter = normalizeText(filterValue);

      filtered = filtered.filter(
        (alumno) =>
          normalizeText(alumno.nombre).includes(normalizedFilter) ||
          normalizeText(alumno.apellidos || "").includes(normalizedFilter) ||
          normalizeText(alumno.rut).includes(normalizedFilter),
      );
    }

    // Filtro por sexo
    if (sexoFilter.length > 0) {
      filtered = filtered.filter((alumno) =>
        sexoFilter.includes(alumno.genero),
      );
    }

    // Age filter removed to keep the main filters minimal

    // Filtro por taller inscrito
    if (tallerFilter.length > 0) {
      filtered = filtered.filter((alumno) =>
        alumno.talleres_inscritos?.some((taller: string) => {
          const tallerKey = taller.toLowerCase().replace(/\s+/g, "_");

          return tallerFilter.includes(tallerKey);
        }),
      );
    }

    // Colegio filter removed

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
    alumnosConEstadisticas,
    filterValue,
    sexoFilter,
    tallerFilter,
    sortDescriptor,
  ]);

  // Opciones para filtros
  const tallerOptions = useMemo(() => {
    if (!talleres) return [];

    const talleresUnicos = new Map<string, { key: string; label: string }>();

    talleres.forEach((taller) => {
      const key = taller.nombre.toLowerCase().replace(/\s+/g, "_");

      talleresUnicos.set(key, {
        key,
        label: taller.nombre,
      });
    });

    return Array.from(talleresUnicos.values());
  }, [talleres]);

  // Colegio options removed

  const renderCell = (alumno: any, columnKey: React.Key) => {
    const cellValue = alumno[columnKey as keyof typeof alumno];

    switch (columnKey) {
      case "nombre_completo":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">
              {alumno.nombre} {alumno.apellidos}
            </p>
          </div>
        );
      case "rut":
        return (
          <div className="flex flex-col">
            <p className="text-sm">{alumno.rut}</p>
          </div>
        );
      case "edad":
        return (
          <div className="flex flex-col">
            <Chip className="w-fit" color="warning" size="sm" variant="flat">
              {alumno.edad || 0} años
            </Chip>
          </div>
        );
      case "sexo":
        return (
          <div className="flex flex-col">
            <p className="text-sm">
              {alumno.genero === "M"
                ? "Masculino"
                : alumno.genero === "F"
                  ? "Femenino"
                  : "No especificado"}
            </p>
          </div>
        );
      case "telefono":
        return (
          <div className="flex flex-col">
            <p className="text-sm">{alumno.telefono || "Sin teléfono"}</p>
          </div>
        );
      case "correo":
        return (
          <div className="flex flex-col">
            <p className="text-sm">
              {alumno.correo_electronico || "Sin correo"}
            </p>
          </div>
        );
      case "tutor":
        const tutorInfo = alumno.tutor_nombre
          ? `${alumno.tutor_nombre}${alumno.tutor_telefono ? ` (${alumno.tutor_telefono})` : ""}`
          : "Sin tutor";

        return (
          <div className="flex flex-col">
            <p className="text-sm">{tutorInfo}</p>
          </div>
        );
      case "talleres_inscritos":
        const talleresText =
          alumno.talleres_inscritos?.join(", ") || "Sin talleres";

        return (
          <div className="flex flex-col">
            <p className="text-sm text-default-600">{talleresText}</p>
          </div>
        );
      case "actions":
        return (
          <div className="relative flex justify-center items-center gap-2">
            <Button
              isIconOnly
              aria-label="Editar alumno"
              size="sm"
              variant="light"
              onPress={() => navigate(`/alumnos/${alumno.id}`)}
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
        <Spinner label="Cargando alumnos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar los alumnos
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
        <h1 className="text-2xl font-bold">Gestión de alumnos</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-content1 p-4 rounded-lg shadow-sm">
        <Input
          isClearable
          className="w-full sm:flex-1"
          placeholder="Buscar por nombre, apellido o RUT..."
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
            Nuevo Alumno
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
                  htmlFor="sexo-filter"
                >
                  <User className="text-primary" size={16} />
                  Sexo
                </label>
                <Select
                  aria-label="Filtrar por sexo"
                  className="w-full"
                  id="sexo-filter"
                  placeholder="Todos los sexos"
                  selectedKeys={sexoFilter}
                  selectionMode="multiple"
                  size="sm"
                  onSelectionChange={(keys) =>
                    setSexoFilter(Array.from(keys) as string[])
                  }
                >
                  <SelectItem key="M">Masculino</SelectItem>
                  <SelectItem key="F">Femenino</SelectItem>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-default-700 flex items-center gap-2"
                  htmlFor="taller-filter"
                >
                  <Tag className="text-secondary" size={16} />
                  Taller inscrito
                </label>
                <Select
                  aria-label="Filtrar por taller"
                  className="w-full"
                  id="taller-filter"
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

              {/* Colegio filter removed */}
            </div>

            {/* Secondary filters removed for simplicity */}
          </div>

          {/* Chips de filtros activos */}
          <div className="flex flex-wrap gap-2 mt-4">
            {sexoFilter.length > 0 &&
              sexoFilter.map((sexo) => (
                <Chip
                  key={sexo}
                  color="primary"
                  size="sm"
                  startContent={<User size={14} />}
                  variant="flat"
                  onClose={() =>
                    setSexoFilter(sexoFilter.filter((s) => s !== sexo))
                  }
                >
                  Sexo: {sexo === "M" ? "Masculino" : "Femenino"}
                </Chip>
              ))}
            {tallerFilter.length > 0 &&
              tallerFilter.map((tallerKey) => {
                const tallerOption = tallerOptions.find(
                  (opt) => opt.key === tallerKey,
                );

                return (
                  <Chip
                    key={tallerKey}
                    color="secondary"
                    size="sm"
                    startContent={<Tag size={14} />}
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
            {/* Colegio chips removed */}
          </div>
        </CardBody>
      </Card>

      <Table
        isStriped
        aria-label="Tabla de alumnos"
        className="w-full"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
              className={column.uid === "rut" ? "min-w-[120px]" : undefined}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={"No hay alumnos registrados."}
          items={filteredAlumnos}
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

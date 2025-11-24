import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Avatar,
} from "@heroui/react";
import {
  Users,
  Search,
  Download,
  Phone,
  Mail,
  User,
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { profesorApi } from "@/api/profesor";

export default function ProfesorAlumnosPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: alumnos, isLoading } = useQuery({
    queryKey: ["profesor", "alumnos", user?.profesor_id],
    queryFn: () => profesorApi.getAlumnos(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  const filteredAlumnos = useMemo(() => {
    if (!alumnos) return [];

    return alumnos.filter(
      (alumno) =>
        alumno.nombre_completo
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        alumno.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alumno.talleres.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [alumnos, searchQuery]);

  const handleExport = () => {
    if (!alumnos) return;

    const csv = [
      [
        "RUT",
        "Nombre Completo",
        "Edad",
        "Género",
        "Teléfono",
        "Email",
        "Apoderado",
        "Teléfono Apoderado",
        "Talleres",
      ],
      ...alumnos.map((a) => [
        a.rut,
        a.nombre_completo,
        a.edad,
        a.genero,
        a.telefono || "",
        a.email || "",
        a.nombre_apoderado || "",
        a.telefono_apoderado || "",
        a.talleres,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `alumnos_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner label="Cargando alumnos..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Alumnos</h1>
          <p className="text-default-500">
            Listado completo de alumnos en tus talleres
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Chip color="primary" size="lg" variant="flat">
            {alumnos?.length || 0} Alumnos
          </Chip>
          <Button
            color="success"
            startContent={<Download size={18} />}
            variant="flat"
            onPress={handleExport}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        classNames={{
          base: "max-w-full sm:max-w-[400px]",
        }}
        placeholder="Buscar por nombre, RUT o taller..."
        startContent={<Search size={18} />}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      {/* Alumnos List */}
      <div className="space-y-4">
        {/* Desktop Table */}
        <Card className="hidden md:block">
          <CardBody className="p-0">
            <Table
              removeWrapper
              aria-label="Tabla de alumnos"
              classNames={{
                th: "bg-default-100",
              }}
            >
              <TableHeader>
                <TableColumn>ALUMNO</TableColumn>
                <TableColumn>RUT</TableColumn>
                <TableColumn>EDAD</TableColumn>
                <TableColumn>CONTACTO</TableColumn>
                <TableColumn>APODERADO</TableColumn>
                <TableColumn>TALLERES</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No hay alumnos para mostrar">
                {filteredAlumnos.map((alumno) => (
                  <TableRow key={alumno.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          showFallback
                          color="primary"
                          name={alumno.nombre}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold">
                            {alumno.nombre_completo}
                          </p>
                          <p className="text-xs text-default-400 capitalize">
                            {alumno.genero}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm">{alumno.rut}</p>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {alumno.edad} años
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {alumno.telefono && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone size={12} />
                            <span>{alumno.telefono}</span>
                          </div>
                        )}
                        {alumno.email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail size={12} />
                            <span className="truncate max-w-[150px]">
                              {alumno.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {alumno.nombre_apoderado && (
                          <p className="text-sm font-medium">
                            {alumno.nombre_apoderado}
                          </p>
                        )}
                        {alumno.telefono_apoderado && (
                          <div className="flex items-center gap-1 text-xs text-default-500">
                            <Phone size={12} />
                            <span>{alumno.telefono_apoderado}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-[200px] truncate">
                        {alumno.talleres}
                      </p>
                      {alumno.total_inscripciones > 1 && (
                        <Chip color="primary" size="sm" variant="flat">
                          {alumno.total_inscripciones} talleres
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={() =>
                          (window.location.href = `/alumnos/${alumno.id}`)
                        }
                      >
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Mobile Cards */}
        <div className="grid gap-3 md:hidden">
          {filteredAlumnos.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-center text-default-500">
                  No hay alumnos para mostrar
                </p>
              </CardBody>
            </Card>
          ) : (
            filteredAlumnos.map((alumno) => (
              <Card key={alumno.id}>
                <CardBody className="gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        showFallback
                        color="primary"
                        name={alumno.nombre}
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold">
                          {alumno.nombre_completo}
                        </p>
                        <p className="text-xs text-default-400 font-mono">
                          {alumno.rut}
                        </p>
                      </div>
                    </div>
                    <Chip size="sm" variant="flat">
                      {alumno.edad} años
                    </Chip>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-2 text-sm">
                    {(alumno.telefono || alumno.email) && (
                      <div>
                        <p className="text-xs text-default-400 mb-1">
                          Contacto
                        </p>
                        <div className="space-y-1">
                          {alumno.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="text-default-400" size={14} />
                              <span>{alumno.telefono}</span>
                            </div>
                          )}
                          {alumno.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="text-default-400" size={14} />
                              <span className="truncate">{alumno.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {alumno.nombre_apoderado && (
                      <div>
                        <p className="text-xs text-default-400 mb-1">
                          Apoderado
                        </p>
                        <p className="font-medium">{alumno.nombre_apoderado}</p>
                        {alumno.telefono_apoderado && (
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="text-default-400" size={14} />
                            <span>{alumno.telefono_apoderado}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-default-400 mb-1">Talleres</p>
                      <p className="text-sm">{alumno.talleres}</p>
                      {alumno.total_inscripciones > 1 && (
                        <Chip
                          className="mt-1"
                          color="primary"
                          size="sm"
                          variant="flat"
                        >
                          {alumno.total_inscripciones} talleres
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    fullWidth
                    color="primary"
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      (window.location.href = `/alumnos/${alumno.id}`)
                    }
                  >
                    Ver Detalle
                  </Button>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-3">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Alumnos</p>
                <p className="text-2xl font-bold">{alumnos?.length || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-100 p-3">
                <User className="text-success" size={24} />
              </div>
              <div>
                <p className="text-sm text-default-500">Promedio Edad</p>
                <p className="text-2xl font-bold">
                  {alumnos && alumnos.length > 0
                    ? Math.round(
                        alumnos.reduce((sum, a) => sum + a.edad, 0) /
                          alumnos.length,
                      )
                    : 0}{" "}
                  años
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning-100 p-3">
                <Calendar className="text-warning" size={24} />
              </div>
              <div>
                <p className="text-sm text-default-500">Inscripciones</p>
                <p className="text-2xl font-bold">
                  {alumnos?.reduce(
                    (sum, a) => sum + a.total_inscripciones,
                    0,
                  ) || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

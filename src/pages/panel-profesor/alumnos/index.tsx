import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, Button, Spinner, Chip, Input } from "@heroui/react";
import { Users, Search, Download, Eye, BookOpen } from "lucide-react";

import { useAuth } from "@/context/auth";
import { profesorApi } from "@/api/profesor";
import { localIsoDate } from "@/utils/localDate";

export default function ProfesorAlumnosPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: alumnos, isLoading } = useQuery({
    queryKey: ["profesor", "alumnos", user?.profesor_id],
    queryFn: () => profesorApi.getAlumnos(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  const alumnosList = useMemo(() => {
    if (!alumnos) return [] as any[];
    if (Array.isArray(alumnos)) return alumnos as any[];
    if (Array.isArray((alumnos as any).datos))
      return (alumnos as any).datos as any[];
    if (Array.isArray((alumnos as any).value))
      return (alumnos as any).value as any[];
    if (Array.isArray((alumnos as any).data?.datos))
      return (alumnos as any).data.datos as any[];

    return [] as any[];
  }, [alumnos]);

  const filteredAlumnos = useMemo(() => {
    if (!alumnosList) return [];

    return alumnosList.filter(
      (alumno) =>
        alumno.nombre_completo
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        alumno.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alumno.talleres.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [alumnosList, searchQuery]);

  const handleExport = () => {
    if (!alumnosList) return;

    const csv = [
      [
        "RUT",
        "Nombre Completo",
        "Edad",
        "Género",
        "Teléfono",
        "Email",
        "Talleres",
      ],
      ...alumnosList.map((a) => [
        a.rut,
        a.nombre_completo,
        a.edad,
        a.genero,
        a.telefono || "",
        a.email || "",
        a.talleres,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `alumnos_${localIsoDate()}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner color="primary" label="Cargando alumnos..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Users className="text-success" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Mis alumnos
            </h1>
            <p className="text-sm text-muted-foreground">
              Lista completa de tus estudiantes
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          classNames={{
            base: "w-full",
            inputWrapper: "h-12 bg-card shadow-sm",
          }}
          placeholder="Buscar por nombre, RUT o taller..."
          radius="lg"
          size="lg"
          startContent={<Search className="text-muted-foreground" size={20} />}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <div className="flex items-center justify-between gap-3">
          <Chip className="font-bold" color="primary" size="lg" variant="flat">
            {filteredAlumnos?.length || 0} Alumnos
          </Chip>
          <Button
            color="success"
            size="sm"
            startContent={<Download size={16} />}
            variant="flat"
            onPress={handleExport}
          >
            Exportar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlumnos.length === 0 ? (
          <Card className="w-full border-none shadow-sm">
            <CardBody className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Users className="text-muted-foreground" size={32} />
              </div>
              <p className="font-bold text-lg mb-1">No hay alumnos</p>
              <p className="text-sm text-muted-foreground text-center px-4">
                No se encontraron alumnos con ese criterio
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredAlumnos.map((alumno) => (
            <Card
              key={alumno.id}
              isPressable
              className="w-full hover:border-primary/20 hover:shadow-sm transition-all duration-200"
              onPress={() => (window.location.href = `/alumnos/${alumno.id}`)}
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  {/* Icono con colores */}
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Users className="text-success" size={18} />
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate">
                          {alumno.nombre_completo}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono mb-2">
                          {alumno.rut}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-foreground">
                              {alumno.edad}
                            </span>
                            <span>años</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="text-primary" size={14} />
                            <span className="font-medium text-foreground">
                              {alumno.total_inscripciones}
                            </span>
                            <span>talleres</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flecha de navegación */}
                  <Eye className="text-primary" size={16} />
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Spinner,
  Divider,
} from "@heroui/react";
import {
  User,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Hash,
  Cake,
  Users,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { profesorApi } from "@/api/profesor";
import { useAuth } from "@/context/auth";

const formatLocalDate = (dateString: string) => {
  if (!dateString) return "No especificado";
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const calculateAge = (birthDate: string) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export default function ProfesorAlumnoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const alumnoId = Number(id);
  const [selectedTab, setSelectedTab] = useState<"talleres" | "clases">("talleres");

  // Obtener datos del alumno
  const { data: alumnos, isLoading: isLoadingAlumnos } = useQuery({
    queryKey: ["profesor", "alumnos", user?.profesor_id],
    queryFn: () => profesorApi.getAlumnos(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  // Extraer la lista de alumnos del objeto de respuesta
  const alumnosList = Array.isArray(alumnos)
    ? alumnos
    : Array.isArray((alumnos as any)?.datos)
      ? (alumnos as any).datos
      : Array.isArray((alumnos as any)?.value)
        ? (alumnos as any).value
        : Array.isArray((alumnos as any)?.data?.datos)
          ? (alumnos as any).data.datos
          : [];

  const alumno = alumnosList.find((a: any) => a.id === alumnoId);

  // Obtener inscripciones del alumno
  const { data: inscripcionesData, isLoading: isLoadingInscripciones } =
    useQuery({
      queryKey: ["alumno", "inscripciones", alumnoId],
      queryFn: async () => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost/talleres_backend"}/api/inscripciones.php?action=por_alumno&alumno_id=${alumnoId}`,
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem("user") || "{}").token}`,
            },
          },
        );

        return response.json();
      },
      enabled: !!alumnoId,
    });

  const inscripciones = (inscripcionesData?.datos || []).filter(
    (insc: any) => insc.profesor_id === user?.profesor_id,
  );

  // Filtrar talleres únicos para evitar duplicados
  const talleresUnicos = inscripciones.filter(
    (insc: any, index: number, self: any[]) =>
      index === self.findIndex((t: any) => t.taller_id === insc.taller_id),
  );

  // Obtener clases del alumno
  const { data: clasesData, isLoading: isLoadingClases } = useQuery({
    queryKey: ["alumno", "clases", alumnoId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost/talleres_backend"}/api/asistencia.php?action=por_alumno&alumno_id=${alumnoId}`,
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user") || "{}").token}`,
          },
        },
      );

      return response.json();
    },
    enabled: !!alumnoId,
  });

  const clases = (clasesData?.datos || []).filter(
    (clase: any) => clase.profesor_id === user?.profesor_id,
  );
  const edad = alumno?.fecha_nacimiento
    ? calculateAge(alumno.fecha_nacimiento)
    : alumno?.edad;

  if (isLoadingAlumnos) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando información del alumno..." size="lg" />
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="text-center p-8">
        <Card className="border-none shadow-sm">
          <CardBody className="py-16">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4 mx-auto">
              <User className="text-warning" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Alumno no encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              El alumno solicitado no existe o no tienes acceso.
            </p>
            <Button
              color="primary"
              onPress={() => navigate("/panel-profesor/alumnos")}
            >
              Volver a Alumnos
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">
            {alumno.nombre_completo}
          </h1>
          <p className="text-xs text-muted-foreground">Detalle del alumno</p>
        </div>
        <Chip color="success" size="sm">
          Activo
        </Chip>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="shadow-sm border-none">
          <CardBody className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-1">
              <BookOpen className="text-success" size={16} />
            </div>
            <p className="text-xl font-bold">{talleresUnicos.length}</p>
            <p className="text-[10px] text-muted-foreground">Talleres</p>
          </CardBody>
        </Card>

        <Card className="shadow-sm border-none">
          <CardBody className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <ClipboardCheck className="text-primary" size={16} />
            </div>
            <p className="text-xl font-bold">{clases.length}</p>
            <p className="text-[10px] text-muted-foreground">Clases</p>
          </CardBody>
        </Card>

        <Card className="shadow-sm border-none">
          <CardBody className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-1">
              <Cake className="text-secondary" size={16} />
            </div>
            <p className="text-xl font-bold">{edad || "N/A"}</p>
            <p className="text-[10px] text-muted-foreground">Años</p>
          </CardBody>
        </Card>
      </div>

      {/* Información personal */}
      <Card className="shadow-sm border-none">
        <CardBody className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="text-primary" size={18} />
            <h2 className="text-base font-bold">Información Personal</h2>
          </div>
          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alumno.rut && (
              <div className="flex items-start gap-2">
                <Hash
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={14}
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">RUT</p>
                  <p className="text-sm font-medium">{alumno.rut}</p>
                </div>
              </div>
            )}

            {alumno.fecha_nacimiento && (
              <div className="flex items-start gap-2">
                <Cake
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={14}
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    Fecha de Nacimiento
                  </p>
                  <p className="text-sm font-medium">
                    {formatLocalDate(alumno.fecha_nacimiento)}
                  </p>
                </div>
              </div>
            )}

            {alumno.genero && (
              <div className="flex items-start gap-2">
                <Users
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={14}
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Género</p>
                  <p className="text-sm font-medium capitalize">
                    {alumno.genero}
                  </p>
                </div>
              </div>
            )}

            {alumno.telefono && (
              <div className="flex items-start gap-2">
                <Phone
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={14}
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">{alumno.telefono}</p>
                </div>
              </div>
            )}

            {alumno.email && (
              <div className="flex items-start gap-2">
                <Mail
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={14}
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{alumno.email}</p>
                </div>
              </div>
            )}

            {alumno.direccion && (
              <div className="flex items-start gap-2">
                <MapPin
                  className="text-muted-foreground shrink-0 mt-0.5"
                  size={14}
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="text-sm font-medium">{alumno.direccion}</p>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs para Talleres y Clases */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          color="primary"
          size="sm"
          startContent={<BookOpen size={16} />}
          variant={selectedTab === "talleres" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("talleres")}
        >
          Talleres Inscritos
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<ClipboardCheck size={16} />}
          variant={selectedTab === "clases" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("clases")}
        >
          Historial de Clases
        </Button>
      </div>

      {/* Contenido de talleres */}
      {selectedTab === "talleres" && (
        <div>
          {isLoadingInscripciones ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : !talleresUnicos || talleresUnicos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <BookOpen className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">No hay talleres inscritos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {talleresUnicos.map((insc: any) => (
                <Card
                  key={insc.id}
                  isPressable
                  className="shadow-none border border-default-200 hover:border-primary/50 transition-colors w-full"
                  onPress={() =>
                    navigate(`/panel-profesor/talleres/${insc.taller_id}`)
                  }
                >
                  <CardBody className="p-3 w-full">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen
                            className="text-primary shrink-0"
                            size={14}
                          />
                          <span className="font-bold text-sm">
                            {insc.taller_nombre}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Inscrito el{" "}
                          {formatLocalDate(insc.fecha_inscripcion)}
                        </p>
                      </div>
                      <ChevronRight
                        className="text-primary shrink-0"
                        size={16}
                      />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido de clases */}
      {selectedTab === "clases" && (
        <div>
          {isLoadingClases ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : !clases || clases.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ClipboardCheck className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">No hay clases registradas</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {clases.map((clase: any, index: number) => (
                <Card
                  key={`clase-${clase.id}-${index}`}
                  className="shadow-none border border-default-200"
                >
                  <CardBody className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar
                            className="text-secondary shrink-0"
                            size={14}
                          />
                          <span className="font-medium text-sm">
                            {formatLocalDate(clase.fecha)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {clase.taller_nombre}
                        </p>
                        <Chip
                          color={clase.presente ? "success" : "danger"}
                          size="sm"
                          variant="flat"
                        >
                          {clase.presente ? "Presente" : "Ausente"}
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

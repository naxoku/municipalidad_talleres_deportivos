import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Spinner,
  Divider,
  Avatar,
} from "@heroui/react";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  MapPin,
  ClipboardCheck,
  CalendarDays,
  Info,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { talleresFeatureApi } from "@/features/talleres/api";
import { inscripcionesFeatureApi } from "@/features/inscripciones/api";

const parseLocalDate = (dateString: string) => {
  // Agregar T00:00:00 para que JavaScript interprete como fecha local
  return new Date(dateString + "T00:00:00");
};

const formatLocalDate = (dateString: string) => {
  const date = parseLocalDate(dateString);

  return date.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export default function ProfesorTallerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tallerId = Number(id);
  const [selectedTab, setSelectedTab] = useState("horarios");

  // Queries
  const { data: taller, isLoading: isLoadingTaller } = useQuery({
    queryKey: ["taller", tallerId],
    queryFn: () => talleresFeatureApi.getById(tallerId),
    enabled: !!tallerId,
  });

  const { data: horarios, isLoading: isLoadingHorarios } = useQuery({
    queryKey: ["taller_horarios", tallerId],
    queryFn: () => talleresFeatureApi.getHorarios(tallerId),
    enabled: !!tallerId,
  });

  const { data: inscripciones, isLoading: isLoadingAlumnos } = useQuery({
    queryKey: ["taller_inscripciones", tallerId],
    queryFn: () => inscripcionesFeatureApi.getByTaller(tallerId),
    enabled: !!tallerId,
  });

  const alumnos =
    inscripciones?.map((insc: any) => ({
      id: insc.alumno_id,
      inscripcion_id: insc.inscripcion_id,
      nombre_completo:
        insc.alumno_nombre ||
        `${insc.nombres || ""} ${insc.apellidos || ""}`.trim(),
      rut: insc.rut,
      edad: insc.edad,
    })) || [];

  // Filtrar alumnos únicos por ID
  const alumnosUnicos = alumnos.filter(
    (alumno: { id: any }, index: any, self: any[]) =>
      index === self.findIndex((a) => a.id === alumno.id),
  );

  const { data: clasesData, isLoading: isLoadingClases } = useQuery({
    queryKey: ["taller_clases", tallerId],
    queryFn: () => talleresFeatureApi.getClases(tallerId),
    enabled: !!tallerId,
  });

  const clases =
    clasesData?.map((clase: any) => ({
      ...clase,
      fecha_parsed: parseLocalDate(clase.fecha_clase || clase.fecha),
      estado:
        clase.fecha_clase && parseLocalDate(clase.fecha_clase) < new Date()
          ? "Realizada"
          : "Pendiente",
    })) || [];

  const totalAlumnos = alumnosUnicos.length;
  const totalHorarios = horarios?.length || 0;
  const totalClases = clases.length;

  // Filtrar solo clases que han pasado
  const today = new Date();

  today.setHours(0, 0, 0, 0); // Inicio del día actual

  const clasesPasadas = clases.filter(
    (clase: any) => clase.fecha_parsed < today,
  );
  const clasesRecientes = clasesPasadas
    .sort(
      (a: any, b: any) => b.fecha_parsed.getTime() - a.fecha_parsed.getTime(),
    )
    .slice(0, 5);

  if (isLoadingTaller) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando información del taller..." size="lg" />
      </div>
    );
  }

  if (!taller) {
    return (
      <div className="text-center p-8">
        <Card className="border-none shadow-sm">
          <CardBody className="py-16">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4 mx-auto">
              <BookOpen className="text-warning" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Taller no encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              El taller solicitado no existe o no tienes acceso.
            </p>
            <Button
              color="primary"
              onPress={() => navigate("/panel-profesor/talleres")}
            >
              Volver a Talleres
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
            {taller.nombre}
          </h1>
          <p className="text-xs text-muted-foreground">Detalle del taller</p>
        </div>
        <Chip color={taller.activo ? "success" : "default"} size="sm">
          {taller.activo ? "Activo" : "Inactivo"}
        </Chip>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="shadow-sm border-none">
          <CardBody className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-1">
              <Users className="text-success" size={16} />
            </div>
            <p className="text-xl font-bold">{totalAlumnos}</p>
            <p className="text-[10px] text-muted-foreground">Alumnos</p>
          </CardBody>
        </Card>

        <Card className="shadow-sm border-none">
          <CardBody className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <Calendar className="text-primary" size={16} />
            </div>
            <p className="text-xl font-bold">{totalHorarios}</p>
            <p className="text-[10px] text-muted-foreground">Horarios</p>
          </CardBody>
        </Card>

        <Card className="shadow-sm border-none">
          <CardBody className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-1">
              <ClipboardCheck className="text-secondary" size={16} />
            </div>
            <p className="text-xl font-bold">{totalClases}</p>
            <p className="text-[10px] text-muted-foreground">Clases</p>
          </CardBody>
        </Card>
      </div>

      {/* Información del taller */}
      <Card className="shadow-sm border-none">
        <CardBody className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="text-primary" size={18} />
            <h2 className="text-base font-bold">Información</h2>
          </div>
          <Divider />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descripción</p>
            <p className="text-sm">{taller.descripcion || "Sin descripción"}</p>
          </div>
        </CardBody>
      </Card>

      {/* Botones de navegación */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          color="primary"
          size="sm"
          startContent={<CalendarDays size={16} />}
          variant={selectedTab === "horarios" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("horarios")}
        >
          Horarios
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<ClipboardCheck size={16} />}
          variant={selectedTab === "clases" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("clases")}
        >
          Clases Pasadas
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<Users size={16} />}
          variant={selectedTab === "alumnos" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("alumnos")}
        >
          Alumnos
        </Button>
      </div>

      {/* Contenido según selección */}
      <div className="mt-4">
        {selectedTab === "horarios" && (
          <div>
            {isLoadingHorarios ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : !horarios || horarios.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">No hay horarios definidos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {horarios.map((h: any) => (
                  <Card
                    key={h.id}
                    isPressable
                    className="shadow-none border border-default-200 hover:border-primary/50 transition-colors w-full"
                    onPress={() =>
                      navigate(`/panel-profesor/horarios/${h.id}/clases`)
                    }
                  >
                    <CardBody className="p-3 w-full">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarDays
                              className="text-primary shrink-0"
                              size={14}
                            />
                            <span className="font-bold text-sm capitalize">
                              {h.dia_semana || h.dia}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>
                                {h.hora_inicio?.slice(0, 5)} -{" "}
                                {h.hora_fin?.slice(0, 5)}
                              </span>
                            </div>
                            {h.ubicacion_nombre && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin size={12} />
                                <span className="truncate">
                                  {h.ubicacion_nombre}
                                </span>
                              </div>
                            )}
                          </div>
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

        {selectedTab === "clases" && (
          <div>
            {isLoadingClases ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : !clasesRecientes || clasesRecientes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardCheck className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">No hay clases pasadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clasesRecientes.map((clase: any, index: number) => {
                  // Encontrar el horario correspondiente
                  const horarioCorrespondiente = horarios?.find(
                    (h: any) => h.id === clase.horario_id,
                  );

                  return (
                    <Card
                      key={`clase-${clase.id}-${index}`}
                      isPressable
                      className="shadow-none border border-default-200 hover:border-secondary/50 transition-colors w-full"
                      onPress={() =>
                        navigate(`/panel-profesor/clases/${clase.id}`)
                      }
                    >
                      <CardBody className="p-3 w-full">
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar
                                className="text-secondary shrink-0"
                                size={14}
                              />
                              <span className="font-medium text-sm">
                                {formatLocalDate(
                                  clase.fecha_clase || clase.fecha,
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {horarioCorrespondiente && (
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  <span className="capitalize">
                                    {horarioCorrespondiente.dia_semana ||
                                      horarioCorrespondiente.dia}{" "}
                                    {horarioCorrespondiente.hora_inicio?.slice(
                                      0,
                                      5,
                                    )}{" "}
                                    -{" "}
                                    {horarioCorrespondiente.hora_fin?.slice(
                                      0,
                                      5,
                                    )}
                                  </span>
                                </div>
                              )}
                              <Chip
                                color={
                                  clase.estado === "Realizada"
                                    ? "success"
                                    : "warning"
                                }
                                size="sm"
                                variant="dot"
                              >
                                {clase.estado || "Pendiente"}
                              </Chip>
                            </div>
                          </div>
                          <ChevronRight
                            className="text-secondary shrink-0"
                            size={16}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
            {clasesPasadas.length > 5 && (
              <Button
                fullWidth
                color="secondary"
                size="sm"
                variant="flat"
                onPress={() =>
                  navigate(`/panel-profesor/clases?taller=${tallerId}`)
                }
              >
                Ver todas las clases
              </Button>
            )}
          </div>
        )}

        {selectedTab === "alumnos" && (
          <div>
            {isLoadingAlumnos ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : !alumnosUnicos || alumnosUnicos.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">No hay alumnos inscritos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alumnosUnicos.map((alumno: any) => (
                  <Card
                    key={`alumno-${alumno.id}`}
                    className="shadow-none border border-default-200"
                  >
                    <CardBody className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="shrink-0"
                          name={alumno.nombre_completo || "?"}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {alumno.nombre_completo || "Sin nombre"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alumno.rut}
                          </p>
                        </div>
                        {alumno.edad && (
                          <Chip color="default" size="sm" variant="flat">
                            {alumno.edad} años
                          </Chip>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

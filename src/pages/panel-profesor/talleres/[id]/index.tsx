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
  ArrowLeft,
  ClipboardCheck,
  CalendarDays,
  Info,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { talleresFeatureApi } from "@/features/talleres/api";

export default function ProfesorTallerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tallerId = Number(id);

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

  const { data: alumnos, isLoading: isLoadingAlumnos } = useQuery({
    queryKey: ["taller_alumnos", tallerId],
    queryFn: () => talleresFeatureApi.getAlumnos(tallerId),
    enabled: !!tallerId,
  });

  const totalAlumnos = alumnos?.length || 0;
  const totalHorarios = horarios?.length || 0;

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
      {/* Header con botón volver */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          className="shrink-0"
          size="sm"
          variant="flat"
          onPress={() => navigate("/panel-profesor/talleres")}
        >
          <ArrowLeft size={20} />
        </Button>
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
      <div className="grid grid-cols-2 gap-2">
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
      </div>

      {/* Información del taller */}
      <Card className="shadow-sm border-none">
        <CardBody className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="text-primary" size={18} />
            <h2 className="text-base font-bold">Información</h2>
          </div>
          <Divider />
          {taller.descripcion && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm">{taller.descripcion}</p>
            </div>
          )}
          {taller.ubicacion_principal && (
            <div className="flex items-start gap-2">
              <MapPin
                className="text-muted-foreground shrink-0 mt-0.5"
                size={14}
              />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Ubicación principal
                </p>
                <p className="text-sm font-medium">
                  {taller.ubicacion_principal}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Horarios */}
      <Card className="shadow-sm border-none">
        <CardBody className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-primary" size={18} />
              <h2 className="text-base font-bold">Horarios</h2>
            </div>
            {totalHorarios > 0 && (
              <Chip color="primary" size="sm" variant="flat">
                {totalHorarios}
              </Chip>
            )}
          </div>
          <Divider />
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
                  className="shadow-none border border-default-200 hover:border-primary/50 transition-colors"
                  onPress={() =>
                    navigate(`/panel-profesor/horarios/${h.id}/clases`)
                  }
                >
                  <CardBody className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays
                            className="text-primary shrink-0"
                            size={14}
                          />
                          <span className="font-bold text-sm">
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
        </CardBody>
      </Card>

      {/* Alumnos inscritos */}
      <Card className="shadow-sm border-none">
        <CardBody className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-success" size={18} />
              <h2 className="text-base font-bold">Alumnos Inscritos</h2>
            </div>
            {totalAlumnos > 0 && (
              <Chip color="success" size="sm" variant="flat">
                {totalAlumnos}
              </Chip>
            )}
          </div>
          <Divider />
          {isLoadingAlumnos ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : !alumnos || alumnos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">No hay alumnos inscritos</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alumnos.map((alumno: any) => (
                <Card
                  key={alumno.inscripcion_id || alumno.id}
                  className="shadow-none border border-default-200"
                >
                  <CardBody className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="shrink-0"
                        name={
                          alumno.nombre_completo || alumno.alumno_nombre || "?"
                        }
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {alumno.nombre_completo ||
                            alumno.alumno_nombre ||
                            "Sin nombre"}
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
          {totalAlumnos > 5 && (
            <Button
              fullWidth
              color="primary"
              size="sm"
              variant="flat"
              onPress={() =>
                navigate(`/panel-profesor/alumnos?taller=${tallerId}`)
              }
            >
              Ver todos los alumnos
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 gap-2 sticky bottom-4">
        <Button
          fullWidth
          color="primary"
          size="lg"
          startContent={<ClipboardCheck size={20} />}
          onPress={() =>
            navigate(`/panel-profesor/asistencia?taller=${tallerId}`)
          }
        >
          Marcar Asistencia
        </Button>
      </div>
    </div>
  );
}

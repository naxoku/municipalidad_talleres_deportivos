"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Spinner, Card, CardBody, Chip } from "@heroui/react";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Users,
  CheckCircle,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@heroui/react";

import { detalleClaseApi, type DetalleClase } from "@/api/detalle_clase";
import { useAuth } from "@/context/auth";
import { profesoresFeatureApi as profesoresApi } from "@/features/profesores/api";

// Función para normalizar strings (remover acentos)
const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export default function ProfesorHorariosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const profesorId = user?.profesor_id;

  const diasSemana = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
    "domingo",
  ];

  const {
    data: horarios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profesor_horarios", profesorId],
    queryFn: () => profesoresApi.getHorarios(Number(profesorId)),
    enabled: !!profesorId,
  });

  const horariosAgrupados = useMemo(() => {
    if (!horarios) return {};

    const agrupados: any = {};

    // Agrupar por día
    horarios.forEach((h: any) => {
      const dia = normalizeString(h.dia_semana || "sin día");

      if (!agrupados[dia]) agrupados[dia] = [];
      agrupados[dia].push(h);
    });

    // Ordenar cada grupo por hora
    Object.keys(agrupados).forEach((dia) => {
      agrupados[dia].sort((a: any, b: any) =>
        a.hora_inicio.localeCompare(b.hora_inicio),
      );
    });

    return agrupados;
  }, [horarios]);

  // Mostrar clase en curso (buscar entre horarios de hoy)
  const diaIndex = new Date().getDay();
  const diaHoy = diasSemana[diaIndex === 0 ? 6 : diaIndex - 1];
  const horariosDelDia = (horarios || []).filter(
    (h: any) => normalizeString(h.dia_semana || "") === normalizeString(diaHoy),
  );

  const clasesQueries = useQueries({
    queries: (horariosDelDia || []).map((h: any) => ({
      queryKey: ["profesor", "clases_horario", h.id],
      queryFn: () => detalleClaseApi.getClasesPorHorario(h.id),
      enabled: !!profesorId,
    })),
  });

  const clasesPorHorario = (clasesQueries || [])
    .map((q: any) => q.data)
    .filter(Boolean);

  const claseActual: DetalleClase | undefined = clasesPorHorario
    .flatMap((c: any) => c.clases || [])
    .find(
      (cl: any) =>
        (cl.estado === "en_curso" || cl.estado === "margen_extra") &&
        cl.puede_pasar_asistencia,
    );

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner color="primary" label="Cargando horarios..." size="lg" />
      </div>
    );

  if (error)
    return (
      <div className="text-center p-8">
        <Card className="border-none shadow-sm">
          <CardBody className="py-16">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 mx-auto">
              <Calendar className="text-destructive" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Error al cargar horarios</h3>
            <p className="text-sm text-muted-foreground">{String(error)}</p>
          </CardBody>
        </Card>
      </div>
    );

  const handleRowClick = (horarioId: number) => {
    navigate(`/panel-profesor/horarios/${horarioId}/clases`);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Calendar className="text-secondary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Mis horarios
            </h1>
            <p className="text-sm text-muted-foreground">
              Toca un horario para ver sus clases
            </p>
          </div>
        </div>
      </div>

      {/* Clase en curso */}
      {claseActual && (
        <Card className="border-l-4 border-l-success">
          <CardBody className="flex flex-col sm:flex-row gap-4 p-4">
            {/* Fecha */}
            <div className="flex flex-col justify-center items-center sm:min-w-[120px] bg-success/10 rounded-lg p-3">
              <span className="text-xs text-success uppercase font-semibold">
                {claseActual.dia_semana}
              </span>
              <span className="text-2xl font-bold">
                {new Date(claseActual.fecha_clase + "T00:00:00").getDate()}
              </span>
              <span className="text-xs text-success">
                {new Date(
                  claseActual.fecha_clase + "T00:00:00",
                ).toLocaleDateString("es-CL", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Info */}
            <div className="flex-grow space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-lg">
                    {claseActual.taller_nombre}
                  </h4>
                </div>
                <Chip color="success" size="sm" variant="flat">
                  En curso
                </Chip>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-default-500">
                <div className="flex items-center gap-1">
                  <span>
                    {claseActual.hora_inicio?.slice(0, 5)}
                    {" - "}
                    {claseActual.hora_fin?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{claseActual.ubicacion_nombre}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Chip
                  color="success"
                  size="sm"
                  startContent={<Users size={12} />}
                  variant="flat"
                >
                  {claseActual.asistentes_presentes || 0} /{" "}
                  {claseActual.asistentes_total || 0} presentes
                </Chip>
                {claseActual.puede_pasar_asistencia && (
                  <Button
                    color="success"
                    size="md"
                    variant="flat"
                    className="w-full"
                    startContent={<CheckCircle size={16} />}
                    onPress={() =>
                      navigate(
                        `/panel-profesor/marcar-asistencia?horario=${claseActual.horario_id}&fecha=${claseActual.fecha_clase}`,
                      )
                    }
                  >
                    Pasar asistencia
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      <div className="space-y-5">
        {!horarios || horarios.length === 0 ? (
          <Card className="w-full border-none shadow-sm">
            <CardBody className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 mx-auto">
                <Calendar className="text-muted-foreground" size={32} />
              </div>
              <p className="font-bold text-lg mb-1">
                No hay horarios asignados
              </p>
              <p className="text-sm text-muted-foreground">
                Contacta al administrador
              </p>
            </CardBody>
          </Card>
        ) : (
          diasSemana.map((dia) => {
            const diaNormalizado = normalizeString(dia);
            const horariosDelDia = horariosAgrupados[diaNormalizado];

            if (!horariosDelDia || horariosDelDia.length === 0) return null;

            return (
              <div key={dia}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <h3 className="font-bold text-base capitalize">{dia}</h3>
                  <Chip color="primary" size="sm" variant="flat">
                    {horariosDelDia.length}
                  </Chip>
                </div>
                <div className="space-y-3">
                  {horariosDelDia.map((h: any) => (
                    <Card
                      key={h.id}
                      isPressable
                      className="w-full border-none shadow-md hover:shadow-lg transition-all"
                      onPress={() => handleRowClick(h.id)}
                    >
                      <CardBody className="p-0 overflow-hidden">
                        <div className="flex">
                          {/* Horario visual */}
                          <div className="bg-primary/10 px-4 py-4 flex flex-col items-center justify-center min-w-[80px]">
                            <span className="text-sm font-bold text-primary leading-none">
                              {h.hora_inicio?.slice(0, 5)}
                            </span>
                            <span className="text-sm font-bold text-primary my-0.5">
                              -
                            </span>
                            <span className="text-sm font-bold text-primary leading-none">
                              {h.hora_fin?.slice(0, 5)}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base line-clamp-2">
                                  {h.taller?.nombre ||
                                    h.taller_nombre ||
                                    "Sin taller"}
                                </h4>

                                {(h.ubicacion?.nombre ||
                                  h.ubicacion_nombre) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <MapPin size={14} />
                                    <span className="font-medium">
                                      {h.ubicacion?.nombre ||
                                        h.ubicacion_nombre}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <ChevronRight
                                className="text-primary shrink-0"
                                size={20}
                              />
                            </div>

                            {(h.alumnos_inscritos || 0) > 0 && (
                              <Chip
                                color="success"
                                size="sm"
                                startContent={<Users size={12} />}
                                variant="flat"
                              >
                                {h.alumnos_inscritos} alumnos
                              </Chip>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

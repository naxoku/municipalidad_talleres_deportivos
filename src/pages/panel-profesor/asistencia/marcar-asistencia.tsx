import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Select,
  SelectItem,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  ClipboardCheck,
  Save,
  Users,
  Clock,
  Lock,
  Download,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/auth";
import {
  asistenciaApi,
  HorarioAsistencia,
  AlumnoAsistencia,
} from "@/api/asistencia";
import { localIsoDate } from "@/utils/localDate";
import { profesoresFeatureApi } from "@/features/profesores/api";

export default function ProfesorAsistenciaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const horarioFromUrl = searchParams.get("horario");
  const fechaFromUrl = searchParams.get("fecha");

  const [horarioSeleccionado, setHorarioSeleccionado] = useState<number>(0);
  const [fecha, setFecha] = useState<string>("");
  const [urlProcessed, setUrlProcessed] = useState(false);
  const [asistencias, setAsistencias] = useState<Map<number, boolean>>(
    new Map(),
  );

  const [activeTab, setActiveTab] = useState<"marcar" | "historial">("marcar");
  const [histFiltroTaller, setHistFiltroTaller] = useState<number | null>(null);
  const [histFechaDesde, setHistFechaDesde] = useState<string>("");
  const [histFechaHasta, setHistFechaHasta] = useState<string>("");

  useEffect(() => {
    if (activeTab === "historial") {
      setHistFiltroTaller(null);
      setHistFechaDesde("");
      setHistFechaHasta("");
    }
  }, [activeTab]);

  const { data: horarios, isLoading: loadingHorarios } = useQuery({
    queryKey: ["profesor", "horarios_asistencia", user?.profesor_id],
    queryFn: () => asistenciaApi.getHorariosConAlumnos(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  const {
    data: asistenciaData,
    isLoading: loadingAlumnos,
    refetch: refetchAsistencia,
  } = useQuery({
    queryKey: [
      "profesor",
      "asistencia",
      horarioSeleccionado,
      fecha,
      user?.profesor_id,
    ],
    queryFn: () => asistenciaApi.getAsistenciaFecha(horarioSeleccionado, fecha),
    enabled: !!horarioSeleccionado && !!fecha,
  });

  const alumnos: AlumnoAsistencia[] = useMemo(() => {
    if (!asistenciaData) return [];

    return asistenciaData.alumnos || [];
  }, [asistenciaData]);

  const esEditable = useMemo(() => {
    if (!asistenciaData) return true;

    return asistenciaData.es_editable !== false;
  }, [asistenciaData]);

  useEffect(() => {
    if (alumnos && alumnos.length > 0) {
      const newAsistencias = new Map<number, boolean>();

      alumnos.forEach((alumno) => {
        newAsistencias.set(alumno.id, alumno.presente);
      });
      setAsistencias(newAsistencias);
    }
  }, [alumnos]);

  const guardarMutation = useMutation({
    mutationFn: () =>
      asistenciaApi.guardarAsistencia({
        horario_id: horarioSeleccionado,
        fecha,
        asistencias: Array.from(asistencias.entries()).map(
          ([alumno_id, presente]) => ({
            alumno_id,
            presente,
          }),
        ),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profesor", "asistencia"],
      });
      showToast({
        title: "Asistencia guardada exitosamente",
        color: "success",
      });
      refetchAsistencia();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };

      showToast({
        title: err.response?.data?.error || "Error al guardar asistencia",
        color: "danger",
      });
    },
  });

  const horariosList = useMemo<HorarioAsistencia[]>(() => {
    if (!horarios) return [];

    if (Array.isArray(horarios)) return horarios;

    if (Array.isArray((horarios as { datos?: unknown }).datos))
      return (horarios as { datos: HorarioAsistencia[] }).datos;

    if (Array.isArray((horarios as { value?: unknown }).value))
      return (horarios as { value: HorarioAsistencia[] }).value;

    return [];
  }, [horarios]);

  const { data: clasesProfesor, isLoading: loadingClases } = useQuery({
    queryKey: ["profesor", "clases", user?.profesor_id],
    queryFn: () => profesoresFeatureApi.getClases(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  const talleresHist = useMemo(() => {
    if (!clasesProfesor) return [] as { id: number; nombre: string }[];

    const map = new Map<number, string>();

    (clasesProfesor as any[]).forEach((c) => {
      const id = c.taller?.id ?? c.taller_id ?? null;
      const nombre = c.taller?.nombre ?? c.taller ?? "Taller";

      if (id) map.set(id, nombre);
    });

    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [clasesProfesor]);

  const clasesFiltradas = useMemo(() => {
    if (!clasesProfesor) return [] as any[];

    return (clasesProfesor as any[]).filter((c) => {
      if (histFiltroTaller) {
        const cid = c.taller?.id ?? c.taller_id ?? null;

        if (!cid || Number(cid) !== Number(histFiltroTaller)) return false;
      }

      if (
        histFechaDesde &&
        new Date(c.fecha + "T00:00:00") < new Date(histFechaDesde + "T00:00:00")
      )
        return false;
      if (
        histFechaHasta &&
        new Date(c.fecha + "T00:00:00") > new Date(histFechaHasta + "T00:00:00")
      )
        return false;

      return true;
    });
  }, [clasesProfesor, histFiltroTaller, histFechaDesde, histFechaHasta]);

  useEffect(() => {
    if (horarioFromUrl && horariosList.length > 0 && !urlProcessed) {
      const horarioId = parseInt(horarioFromUrl);
      const existeHorario = horariosList.some((h) => h.id === horarioId);

      if (existeHorario) {
        setHorarioSeleccionado(horarioId);
        setFecha(fechaFromUrl || localIsoDate());
      }
      setUrlProcessed(true);
    }
  }, [horarioFromUrl, fechaFromUrl, horariosList, urlProcessed]);

  useEffect(() => {
    if (urlProcessed && horarioSeleccionado && fecha) {
      if (typeof refetchAsistencia === "function") refetchAsistencia();
    }
  }, [urlProcessed, horarioSeleccionado, fecha, refetchAsistencia]);

  const horarioInfo = useMemo(() => {
    return horariosList.find((h) => h.id === horarioSeleccionado);
  }, [horariosList, horarioSeleccionado]);

  const handleToggleAsistencia = (alumnoId: number) => {
    if (!esEditable) {
      showToast({
        title: "No se puede modificar la asistencia de una clase pasada",
        color: "danger",
      });

      return;
    }
    setAsistencias((prev) => {
      const newMap = new Map(prev);

      newMap.set(alumnoId, !prev.get(alumnoId));

      return newMap;
    });
  };

  const handleMarcarTodos = (presente: boolean) => {
    if (!esEditable) {
      showToast({
        title: "No se puede modificar la asistencia de una clase pasada",
        color: "danger",
      });

      return;
    }
    if (!alumnos) return;
    setAsistencias((prev) => {
      const newMap = new Map(prev);

      alumnos.forEach((alumno) => {
        newMap.set(alumno.id, presente);
      });

      return newMap;
    });
  };

  const handleGuardar = () => {
    if (!horarioSeleccionado || !fecha) {
      showToast({
        title: "Selecciona un horario y una fecha",
        color: "danger",
      });

      return;
    }
    if (!esEditable) {
      showToast({
        title: "No se puede guardar la asistencia de una clase pasada",
        color: "danger",
      });

      return;
    }
    guardarMutation.mutate();
  };

  const handleExportarCSV = () => {
    if (!alumnos || alumnos.length === 0) return;

    const csv = [
      ["RUT", "Nombre Completo", "Asistencia"],
      ...alumnos.map((a) => [
        a.rut,
        a.nombre_completo,
        asistencias.get(a.id) ? "Presente" : "Ausente",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `asistencia_${horarioInfo?.taller_nombre || "clase"}_${fecha}.csv`;
    a.click();
  };

  const presentesCount = useMemo(() => {
    return Array.from(asistencias.values()).filter((p) => p).length;
  }, [asistencias]);

  const ausentesCount = useMemo(() => {
    return Array.from(asistencias.values()).filter((p) => !p).length;
  }, [asistencias]);

  if (loadingHorarios) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner label="Cargando horarios..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Registro de Asistencia
            </h1>
            <p className="text-sm text-muted-foreground">
              Marca la asistencia de tus alumnos por clase
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <Button
          color="primary"
          size="sm"
          variant={activeTab === "marcar" ? "solid" : "ghost"}
          onPress={() => setActiveTab("marcar")}
        >
          Marcar asistencia
        </Button>
        <Button
          color="default"
          size="sm"
          variant={activeTab === "historial" ? "solid" : "ghost"}
          onPress={() => setActiveTab("historial")}
        >
          Registro histórico
        </Button>
      </div>

      {activeTab === "marcar" ? (
        <>
          {horarioSeleccionado && fecha ? (
            <div className="space-y-4">
              {/* Info de la clase */}
              <Card className="border-l-4 border-l-primary">
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold">
                      {horarioInfo?.taller_nombre || "Clase"}
                    </h3>
                    {!esEditable && (
                      <Chip
                        color="warning"
                        size="sm"
                        startContent={<Lock size={14} />}
                        variant="flat"
                      >
                        Solo lectura
                      </Chip>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <Chip
                      color="default"
                      size="sm"
                      startContent={<Clock size={14} />}
                      variant="flat"
                    >
                      {horarioInfo?.hora_inicio?.slice(0, 5)} -{" "}
                      {horarioInfo?.hora_fin?.slice(0, 5)}
                    </Chip>
                    <Chip color="default" size="sm" variant="flat">
                      {new Date(fecha).toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Chip>
                  </div>
                </CardBody>
              </Card>

              {/* Mensaje de solo lectura */}
              {!esEditable && (
                <Card className="border-l-4 border-l-warning bg-warning-50/50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <Lock className="text-warning-600 shrink-0" size={20} />
                      <p className="text-sm font-medium text-warning-800">
                        Esta clase ya finalizó. No puedes modificar la
                        asistencia.
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Estadísticas */}
              {alumnos && alumnos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <Card className="bg-success-50/50 border-success-200 border">
                    <CardBody className="p-3 text-center">
                      <p className="text-2xl font-bold text-success-700">
                        {presentesCount}
                      </p>
                      <p className="text-xs text-success-600">Presentes</p>
                    </CardBody>
                  </Card>
                  <Card className="bg-danger-50/50 border-danger-200 border">
                    <CardBody className="p-3 text-center">
                      <p className="text-2xl font-bold text-danger-700">
                        {ausentesCount}
                      </p>
                      <p className="text-xs text-danger-600">Ausentes</p>
                    </CardBody>
                  </Card>
                  <Card className="bg-default-100 border-default-200 border">
                    <CardBody className="p-3 text-center">
                      <p className="text-2xl font-bold text-default-700">
                        {alumnos.length}
                      </p>
                      <p className="text-xs text-default-600">Total</p>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Acciones rápidas */}
              {alumnos && alumnos.length > 0 && esEditable && (
                <div className="flex gap-2">
                  <Button
                    fullWidth
                    color="success"
                    size="sm"
                    variant="flat"
                    onPress={() => handleMarcarTodos(true)}
                  >
                    ✓ Todos presentes
                  </Button>
                  <Button
                    fullWidth
                    color="danger"
                    size="sm"
                    variant="flat"
                    onPress={() => handleMarcarTodos(false)}
                  >
                    ✗ Todos ausentes
                  </Button>
                </div>
              )}

              {/* Lista de alumnos */}
              {loadingAlumnos ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner label="Cargando alumnos..." size="lg" />
                </div>
              ) : !alumnos || alumnos.length === 0 ? (
                <Card>
                  <CardBody className="flex h-40 flex-col items-center justify-center text-default-400">
                    <Users size={48} />
                    <p className="mt-2 text-sm">
                      No hay alumnos inscritos en este horario
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="space-y-2">
                    {alumnos.map((alumno) => (
                      <Card
                        key={alumno.id}
                        className={`w-full shadow-none border border-default-200 transition-all ${
                          asistencias.get(alumno.id)
                            ? "border-l-4 border-l-success bg-success-50/40"
                            : "border-l-4 border-l-danger bg-danger-50/30"
                        }`}
                        isPressable={esEditable}
                        onPress={() =>
                          esEditable && handleToggleAsistencia(alumno.id)
                        }
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base truncate">
                                {alumno.nombre_completo}
                              </p>
                              <p className="text-xs text-default-500">
                                {alumno.rut}
                              </p>
                            </div>
                            {esEditable ? (
                              <Checkbox
                                color="success"
                                isSelected={asistencias.get(alumno.id) || false}
                                size="lg"
                                onValueChange={() =>
                                  handleToggleAsistencia(alumno.id)
                                }
                              />
                            ) : (
                              <Chip
                                color={
                                  asistencias.get(alumno.id)
                                    ? "success"
                                    : "danger"
                                }
                                size="sm"
                                variant="flat"
                              >
                                {asistencias.get(alumno.id) ? "✓" : "✗"}
                              </Chip>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>

                  {/* Botón guardar */}
                  {esEditable && (
                    <div className="sticky bottom-4 z-10">
                      <Button
                        fullWidth
                        color="primary"
                        isLoading={guardarMutation.isPending}
                        size="lg"
                        startContent={<Save size={20} />}
                        onPress={handleGuardar}
                      >
                        Guardar Asistencia
                      </Button>
                    </div>
                  )}

                  {/* Opciones para solo lectura */}
                  {!esEditable && (
                    <div className="space-y-3">
                      <Button
                        fullWidth
                        color="default"
                        size="lg"
                        startContent={<Download size={20} />}
                        variant="bordered"
                        onPress={handleExportarCSV}
                      >
                        Descargar CSV
                      </Button>
                      <p className="text-xs text-center text-default-500">
                        Contacta al administrador para hacer correcciones
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <Card>
              <CardBody className="flex h-60 items-center justify-center text-center p-8">
                <ClipboardCheck className="text-default-300" size={64} />
                <p className="mt-4 text-base text-default-500">
                  Selecciona un horario y fecha para registrar la asistencia
                </p>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Historial de clases</h2>
                <p className="text-sm text-default-500">
                  Filtra y revisa registros pasados
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Select
                label="Taller"
                selectedKeys={
                  histFiltroTaller ? [String(histFiltroTaller)] : []
                }
                onSelectionChange={(keys) => {
                  const k = Array.from(keys)[0];

                  setHistFiltroTaller(k ? parseInt(String(k)) : null);
                }}
              >
                {[
                  <SelectItem key="0">Todos</SelectItem>,
                  ...talleresHist.map((t) => (
                    <SelectItem key={t.id.toString()}>{t.nombre}</SelectItem>
                  )),
                ]}
              </Select>

              <Input
                label="Desde"
                max={localIsoDate()}
                type="date"
                value={histFechaDesde}
                onChange={(e) => setHistFechaDesde(e.target.value)}
              />

              <Input
                label="Hasta"
                max={localIsoDate()}
                type="date"
                value={histFechaHasta}
                onChange={(e) => setHistFechaHasta(e.target.value)}
              />
            </div>
            {loadingClases ? (
              <div className="p-4 text-default-500">Cargando historial...</div>
            ) : !clasesFiltradas || clasesFiltradas.length === 0 ? (
              <div className="p-4 text-default-400">
                No hay clases registradas para los filtros seleccionados.
              </div>
            ) : (
              <Table aria-label="Historial de clases">
                <TableHeader>
                  <TableColumn>FECHA</TableColumn>
                  <TableColumn>TALLER</TableColumn>
                  <TableColumn>ASISTENCIA</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn align="end">ACCIONES</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent="No hay clases registradas."
                  items={clasesFiltradas || []}
                >
                  {(c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {new Date(c.fecha).toLocaleDateString("es-CL", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell>{c.taller?.nombre || c.taller}</TableCell>
                      <TableCell>
                        <div className="text-small font-medium">
                          {c.asistentes || 0}/{c.total || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={
                            c.estado === "Realizada" ? "success" : "danger"
                          }
                          size="sm"
                          variant="dot"
                        >
                          {c.estado}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setHorarioSeleccionado(c.horario_id || 0);
                              setFecha(c.fecha?.slice(0, 10) || localIsoDate());
                              setActiveTab("marcar");
                            }}
                          >
                            Ver detalle
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

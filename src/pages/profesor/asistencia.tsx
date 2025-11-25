import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
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
  Calendar,
  ClipboardCheck,
  Save,
  Users,
  Clock,
  MapPin,
  Lock,
  AlertCircle,
  Download,
  Info,
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
  // use centralized toast helper
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Leer horario de la URL si viene del dashboard
  const horarioFromUrl = searchParams.get("horario");

  // No pre-seleccionar hasta que los horarios estén cargados
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<number>(0);
  const [fecha, setFecha] = useState<string>("");
  const [urlProcessed, setUrlProcessed] = useState(false);
  const [asistencias, setAsistencias] = useState<Map<number, boolean>>(
    new Map(),
  );

  // UI tabs and history filters
  const [activeTab, setActiveTab] = useState<"marcar" | "historial">("marcar");
  const [histFiltroTaller, setHistFiltroTaller] = useState<number | null>(null);
  const [histFechaDesde, setHistFechaDesde] = useState<string>("");
  const [histFechaHasta, setHistFechaHasta] = useState<string>("");

  // Siempre mostrar todas las clases por defecto cuando se abre el historial
  useEffect(() => {
    if (activeTab === "historial") {
      // Resetear filtros para mostrar todo por defecto
      setHistFiltroTaller(null);
      setHistFechaDesde("");
      setHistFechaHasta("");
    }
  }, [activeTab]);

  // Fetch horarios del profesor con alumnos
  const { data: horarios, isLoading: loadingHorarios } = useQuery({
    queryKey: ["profesor", "horarios_asistencia", user?.profesor_id],
    queryFn: () => asistenciaApi.getHorariosConAlumnos(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  // Fetch asistencia para horario y fecha seleccionados
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

  // Extraer alumnos y estado de editabilidad
  const alumnos: AlumnoAsistencia[] = useMemo(() => {
    if (!asistenciaData) return [];

    return asistenciaData.alumnos || [];
  }, [asistenciaData]);

  const esEditable = useMemo(() => {
    if (!asistenciaData) return true;

    return asistenciaData.es_editable !== false;
  }, [asistenciaData]);

  const mensajeBloqueo = useMemo(() => {
    if (!asistenciaData) return "";

    return asistenciaData.mensaje || "";
  }, [asistenciaData]);

  // Inicializar asistencias cuando se cargan los alumnos
  useEffect(() => {
    if (alumnos && alumnos.length > 0) {
      const newAsistencias = new Map<number, boolean>();

      alumnos.forEach((alumno) => {
        newAsistencias.set(alumno.id, alumno.presente);
      });
      setAsistencias(newAsistencias);
    }
  }, [alumnos]);

  // Mutation para guardar asistencia
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

  // Normalizar datos recibidos de la query
  const horariosList = useMemo<HorarioAsistencia[]>(() => {
    if (!horarios) return [];

    if (Array.isArray(horarios)) return horarios;

    if (Array.isArray((horarios as { datos?: unknown }).datos))
      return (horarios as { datos: HorarioAsistencia[] }).datos;

    if (Array.isArray((horarios as { value?: unknown }).value))
      return (horarios as { value: HorarioAsistencia[] }).value;

    return [];
  }, [horarios]);

  // Clases (historial) del profesor para la vista histórica
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

      if (histFechaDesde && new Date(c.fecha) < new Date(histFechaDesde))
        return false;
      if (histFechaHasta && new Date(c.fecha) > new Date(histFechaHasta))
        return false;

      return true;
    });
  }, [clasesProfesor, histFiltroTaller, histFechaDesde, histFechaHasta]);

  // Efecto para sincronizar horario de URL cuando los datos estén listos
  useEffect(() => {
    if (horarioFromUrl && horariosList.length > 0 && !urlProcessed) {
      const horarioId = parseInt(horarioFromUrl);
      const existeHorario = horariosList.some((h) => h.id === horarioId);

      if (existeHorario) {
        setHorarioSeleccionado(horarioId);
        // Use local date (avoid UTC shift)
        setFecha(localIsoDate());
      }
      setUrlProcessed(true);
    }
  }, [horarioFromUrl, horariosList, urlProcessed]);

  // Si la URL fue procesada y ya tenemos horario y fecha, forzar carga de asistencia
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

  // Exportar a CSV
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
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <ClipboardCheck className="text-primary" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Registro de Asistencia</h1>
          <p className="text-default-500">
            Marca la asistencia de tus alumnos por clase
          </p>
        </div>
      </div>

      {/* Selector de vistas (tabs) */}
      <div className="mb-4 flex items-center gap-2">
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

      {/* Contenido por pestaña */}
      {activeTab === "marcar" ? (
        <>
          {/* Selección de horario y fecha */}
          <Card className="mb-6">
            <CardBody className="gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Select Horario */}
                <Select
                  isRequired
                  aria-label="Seleccionar horario"
                  label="Horario de Clase"
                  placeholder="Selecciona un horario"
                  selectedKeys={
                    horarioSeleccionado ? [horarioSeleccionado.toString()] : []
                  }
                  startContent={<Clock size={18} />}
                  onSelectionChange={(keys) => {
                    const id = Array.from(keys)[0]?.toString();

                    setHorarioSeleccionado(id ? parseInt(id) : 0);
                    setAsistencias(new Map());
                  }}
                >
                  {horariosList.map((horario) => (
                    <SelectItem
                      key={horario.id.toString()}
                      textValue={`${horario.taller_nombre} - ${horario.dia_semana} ${horario.hora_inicio}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {horario.taller_nombre}
                        </span>
                        <span className="text-small text-default-500">
                          <span className="capitalize">
                            {horario.dia_semana}
                          </span>{" "}
                          {horario.hora_inicio} - {horario.hora_fin}
                          {horario.ubicacion_nombre &&
                            ` • ${horario.ubicacion_nombre}`}
                        </span>
                        <span className="text-tiny text-default-400">
                          {horario.total_alumnos} alumno
                          {horario.total_alumnos !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                {/* Input Fecha */}
                <Input
                  isRequired
                  label="Fecha de la Clase"
                  max={localIsoDate()}
                  startContent={<Calendar size={18} />}
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setAsistencias(new Map());
                  }}
                />
              </div>

              {/* Info del horario seleccionado */}
              {horarioInfo && (
                <div className="flex flex-wrap gap-4">
                  <Chip
                    color="primary"
                    startContent={<Users size={16} />}
                    variant="flat"
                  >
                    {horarioInfo.total_alumnos} Alumnos
                  </Chip>
                  <Chip
                    color="secondary"
                    startContent={<Clock size={16} />}
                    variant="flat"
                  >
                    <span className="capitalize">{horarioInfo.dia_semana}</span>{" "}
                    {horarioInfo.hora_inicio} - {horarioInfo.hora_fin}
                  </Chip>
                  {horarioInfo.ubicacion_nombre && (
                    <Chip
                      color="default"
                      startContent={<MapPin size={16} />}
                      variant="flat"
                    >
                      {horarioInfo.ubicacion_nombre}
                    </Chip>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Banner de solo lectura */}
          {horarioSeleccionado && fecha && !esEditable && (
            <Card className="mb-6 border-l-4 border-l-warning bg-warning-50">
              <CardBody className="flex-row items-center gap-4">
                <div className="rounded-full bg-warning-100 p-3">
                  <Lock className="text-warning-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-warning-800">
                    Asistencia de Solo Lectura
                  </h3>
                  <p className="text-sm text-warning-700">
                    {mensajeBloqueo ||
                      "Esta clase ya finalizó. No es posible modificar la asistencia."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-warning-600">
                  <Info size={16} />
                  <span>
                    Contacta al administrador si necesitas correcciones
                  </span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tabla de asistencia */}
          {horarioSeleccionado && fecha && (
            <Card>
              <CardHeader className="flex-col items-start gap-3 pb-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Lista de Asistencia
                    </h2>
                    {!esEditable && (
                      <Chip color="warning" size="sm" variant="flat">
                        <Lock className="mr-1" size={12} />
                        Solo lectura
                      </Chip>
                    )}
                  </div>
                  {alumnos && alumnos.length > 0 && (
                    <div className="flex gap-2">
                      {esEditable ? (
                        <>
                          <Button
                            color="success"
                            size="sm"
                            variant="flat"
                            onPress={() => handleMarcarTodos(true)}
                          >
                            Marcar todos presentes
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            onPress={() => handleMarcarTodos(false)}
                          >
                            Marcar todos ausentes
                          </Button>
                        </>
                      ) : (
                        <Button
                          color="default"
                          size="sm"
                          startContent={<Download size={16} />}
                          variant="flat"
                          onPress={handleExportarCSV}
                        >
                          Descargar CSV
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {alumnos && alumnos.length > 0 && (
                  <div className="flex gap-4">
                    <Chip color="success" variant="flat">
                      Presentes: {presentesCount}
                    </Chip>
                    <Chip color="danger" variant="flat">
                      Ausentes: {ausentesCount}
                    </Chip>
                    <Chip color="default" variant="flat">
                      Total: {alumnos.length}
                    </Chip>
                  </div>
                )}
              </CardHeader>

              <CardBody>
                {loadingAlumnos ? (
                  <div className="flex h-40 items-center justify-center">
                    <Spinner label="Cargando alumnos..." />
                  </div>
                ) : !alumnos || alumnos.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center text-default-400">
                    <Users size={48} />
                    <p className="mt-2">
                      No hay alumnos inscritos en este horario
                    </p>
                  </div>
                ) : (
                  <>
                    <Table
                      aria-label="Tabla de asistencia"
                      className="hidden md:table"
                    >
                      <TableHeader>
                        <TableColumn>ALUMNO</TableColumn>
                        <TableColumn>RUT</TableColumn>
                        <TableColumn width={150}>ASISTENCIA</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {alumnos.map((alumno) => (
                          <TableRow key={alumno.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {alumno.nombre_completo}
                                </p>
                                {alumno.telefono && (
                                  <p className="text-small text-default-400">
                                    {alumno.telefono}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{alumno.rut}</TableCell>
                            <TableCell>
                              {esEditable ? (
                                <Checkbox
                                  color="success"
                                  isSelected={
                                    asistencias.get(alumno.id) || false
                                  }
                                  onValueChange={() =>
                                    handleToggleAsistencia(alumno.id)
                                  }
                                >
                                  Presente
                                </Checkbox>
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
                                  {asistencias.get(alumno.id)
                                    ? "✓ Presente"
                                    : "✗ Ausente"}
                                </Chip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Vista móvil */}
                    <div className="flex flex-col gap-3 md:hidden">
                      {alumnos.map((alumno) => (
                        <Card key={alumno.id} shadow="sm">
                          <CardBody className="gap-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold">
                                  {alumno.nombre_completo}
                                </p>
                                <p className="text-small text-default-500">
                                  {alumno.rut}
                                </p>
                                {alumno.telefono && (
                                  <p className="text-small text-default-400">
                                    📞 {alumno.telefono}
                                  </p>
                                )}
                              </div>
                              {esEditable ? (
                                <Checkbox
                                  color="success"
                                  isSelected={
                                    asistencias.get(alumno.id) || false
                                  }
                                  size="lg"
                                  onValueChange={() =>
                                    handleToggleAsistencia(alumno.id)
                                  }
                                >
                                  Presente
                                </Checkbox>
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
                                  {asistencias.get(alumno.id)
                                    ? "✓ Presente"
                                    : "✗ Ausente"}
                                </Chip>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>

                    {/* Botón guardar o mensaje de solo lectura */}
                    <div className="mt-6 flex justify-end gap-3">
                      {!esEditable && (
                        <Button
                          color="default"
                          size="lg"
                          startContent={<Download size={20} />}
                          variant="flat"
                          onPress={handleExportarCSV}
                        >
                          Descargar CSV
                        </Button>
                      )}
                      {esEditable && (
                        <Button
                          color="primary"
                          isLoading={guardarMutation.isPending}
                          size="lg"
                          startContent={<Save size={20} />}
                          onPress={handleGuardar}
                        >
                          Guardar Asistencia
                        </Button>
                      )}
                    </div>

                    {/* Mensaje informativo para clase pasada */}
                    {!esEditable && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-default-100 p-3 text-sm text-default-600">
                        <AlertCircle size={16} />
                        <span>
                          Los datos mostrados corresponden a la asistencia
                          registrada el día de la clase. Si necesitas hacer
                          correcciones, contacta al administrador del sistema.
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          )}

          {/* Mensaje inicial */}
          {!horarioSeleccionado && !fecha && (
            <Card>
              <CardBody className="flex h-60 items-center justify-center text-center">
                <ClipboardCheck className="text-default-300" size={64} />
                <p className="mt-4 text-lg text-default-500">
                  Selecciona un horario y una fecha para registrar la asistencia
                </p>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Historial de clases */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Historial de clases</h2>
                  <p className="text-sm text-default-500">
                    Filtra y revisa registros pasados
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {/* filtros */}
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
                    <SelectItem key="0">Todos</SelectItem>
                    <>
                      {talleresHist.map((t) => (
                        <SelectItem key={t.id.toString()}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </>
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
                  <div className="p-4 text-default-500">
                    Cargando historial...
                  </div>
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
                                  // abrir el detalle de la clase en modo lectura
                                  setHorarioSeleccionado(c.horario_id || 0);
                                  setFecha(
                                    c.fecha?.slice(0, 10) || localIsoDate(),
                                  );
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
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

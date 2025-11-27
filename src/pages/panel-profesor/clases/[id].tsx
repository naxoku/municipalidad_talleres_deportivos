import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Textarea,
  Checkbox,
} from "@heroui/react";
import {
  Clock,
  MapPin,
  Users,
  AlertCircle,
  FileText,
  CheckSquare,
  Target,
  ListChecks,
  Save,
  Edit,
  UserCheck,
  UserX,
  Calendar,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  detalleClaseApi,
  DetalleClase,
  DetalleClaseForm,
} from "@/api/detalle_clase";
import { asistenciaApi, AlumnoAsistencia } from "@/api/asistencia";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/auth";

const formatTimeHHMM = (timeString: string) => {
  if (!timeString) return "-";

  return timeString.slice(0, 5);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function DetalleClasePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "planificacion";
  const [activeTab, setActiveTab] = useState<
    "planificacion" | "alumnos" | "asistencia"
  >(initialTab as any);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch detalle de la clase
  const {
    data: clase,
    isLoading,
    error: claseError,
  } = useQuery({
    queryKey: ["profesor", "detalle_clase", id],
    queryFn: () => detalleClaseApi.getDetalleById(Number(id)),
    enabled: !!id,
  });

  // Debug
  console.log(
    "[DetalleClasePage] id:",
    id,
    "clase:",
    clase,
    "error:",
    claseError,
    "isLoading:",
    isLoading,
  );

  // Fetch asistencia de la clase
  const { data: asistenciaData, isLoading: asistenciaLoading } = useQuery({
    queryKey: [
      "profesor",
      "asistencia_clase",
      clase?.horario_id,
      clase?.fecha_clase,
    ],
    queryFn: () =>
      asistenciaApi.getAsistenciaFecha(clase!.horario_id, clase!.fecha_clase),
    enabled: !!clase?.horario_id && !!clase?.fecha_clase,
  });

  const alumnos = useMemo(() => {
    if (!asistenciaData?.alumnos) return [];

    return asistenciaData.alumnos;
  }, [asistenciaData]);

  const esEditable = useMemo(() => {
    if (!clase) return false;
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);
    const fechaClase = new Date(clase.fecha_clase + "T00:00:00");

    return fechaClase >= hoy;
  }, [clase]);

  // Sincronizar con query param si cambia
  useEffect(() => {
    const t = searchParams.get("tab");

    if (t) setActiveTab(t as any);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando clase..." size="lg" />
      </div>
    );
  }

  if (!clase) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[50vh]">
        <AlertCircle className="text-warning mb-4" size={64} />
        <h3 className="text-lg font-semibold mb-2">Clase no encontrada</h3>
        <p className="text-default-500 mb-4 text-center">
          La clase solicitada no existe o no tienes acceso.
        </p>
        <Button
          color="primary"
          startContent={<ArrowLeft size={18} />}
          onPress={() => navigate("/panel-profesor/horarios")}
        >
          Volver a Horarios
        </Button>
      </div>
    );
  }

  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  const fechaClase = new Date(clase.fecha_clase + "T00:00:00");
  const esFutura = fechaClase > hoy;
  const esHoy = fechaClase.toDateString() === hoy.toDateString();

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="text-primary" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
              {clase.taller_nombre}
            </h1>
            <p className="text-sm text-muted-foreground">
              Detalle de la clase programada
            </p>
          </div>
        </div>
      </div>

      {/* Info de la clase */}
      <Card className="border-l-4 border-l-primary">
        <CardBody className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {esHoy && (
                <Chip color="success" size="sm" variant="solid">
                  Hoy
                </Chip>
              )}
              {esFutura && !esHoy && (
                <Chip color="primary" size="sm" variant="flat">
                  Próxima
                </Chip>
              )}
              {!esFutura && !esHoy && (
                <Chip color="default" size="sm" variant="flat">
                  Pasada
                </Chip>
              )}
            </div>
            {!esEditable && activeTab !== "asistencia" && (
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

          <p className="text-lg font-semibold capitalize">
            {formatDate(clase.fecha_clase)}
          </p>

          <div className="flex flex-wrap gap-2 text-sm">
            <Chip
              color="default"
              size="sm"
              startContent={<Clock size={14} />}
              variant="flat"
            >
              {formatTimeHHMM(clase.hora_inicio)} -{" "}
              {formatTimeHHMM(clase.hora_fin)}
            </Chip>
            <Chip
              color="default"
              size="sm"
              startContent={<MapPin size={14} />}
              variant="flat"
            >
              {clase.ubicacion_nombre}
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Tabs móviles */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          color="primary"
          size="sm"
          startContent={<FileText size={16} />}
          variant={activeTab === "planificacion" ? "solid" : "ghost"}
          onPress={() => setActiveTab("planificacion")}
        >
          Planificación
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<Users size={16} />}
          variant={activeTab === "alumnos" ? "solid" : "ghost"}
          onPress={() => setActiveTab("alumnos")}
        >
          Alumnos ({alumnos.length})
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<CheckSquare size={16} />}
          variant={activeTab === "asistencia" ? "solid" : "ghost"}
          onPress={() => setActiveTab("asistencia")}
        >
          Asistencia
        </Button>
      </div>

      {/* Contenido según tab */}
      {activeTab === "planificacion" && (
        <PlanificacionTab
          clase={clase}
          esEditable={esEditable}
          isEditing={isEditing}
          profesorId={user?.profesor_id}
          queryClient={queryClient}
          setIsEditing={setIsEditing}
        />
      )}

      {activeTab === "alumnos" && (
        <AlumnosTab alumnos={alumnos} isLoading={asistenciaLoading} />
      )}

      {activeTab === "asistencia" && (
        <AsistenciaTab
          alumnos={alumnos}
          clase={clase}
          esEditable={asistenciaData?.es_editable || false}
          isLoading={asistenciaLoading}
          queryClient={queryClient}
        />
      )}
    </div>
  );
}

// Tab de Planificación
function PlanificacionTab({
  clase,
  esEditable,
  isEditing,
  setIsEditing,
  profesorId,
  queryClient,
}: {
  clase: DetalleClase;
  esEditable: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  profesorId?: number;
  queryClient: any;
}) {
  const [formData, setFormData] = useState({
    objetivo: clase.objetivo || "",
    actividades: clase.actividades || "",
    observaciones: clase.observaciones || "",
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<DetalleClaseForm> & { id: number }) =>
      detalleClaseApi.updateDetalle(data.id, {
        ...data,
        profesor_id: profesorId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profesor", "detalle_clase"],
      });
      showToast({ title: "Planificación actualizada", color: "success" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      showToast({
        title: error.response?.data?.error || "Error al actualizar",
        color: "danger",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: clase.id,
      horario_id: clase.horario_id,
      taller_id: clase.taller_id,
      fecha_clase: clase.fecha_clase,
      ...formData,
    });
  };

  const tienePlanificacion = !!(
    clase.objetivo ||
    clase.actividades ||
    clase.observaciones
  );

  if (!tienePlanificacion && !isEditing) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center justify-center p-8 text-center h-60">
          <FileText className="text-default-300 mb-4" size={64} />
          <p className="text-default-500 font-medium mb-1">
            No hay planificación registrada
          </p>
          <p className="text-sm text-default-400 mb-4">
            Agrega objetivos y actividades para esta clase
          </p>
          {esEditable && (
            <Button
              color="primary"
              size="lg"
              startContent={<Edit size={18} />}
              onPress={() => setIsEditing(true)}
            >
              Agregar Planificación
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mensaje de solo lectura */}
      {!esEditable && !isEditing && (
        <Card className="border-l-4 border-l-warning bg-warning-50/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="text-warning-600 shrink-0" size={20} />
              <p className="text-sm font-medium text-warning-800">
                Esta clase ya finalizó. No puedes modificar la planificación.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Objetivo, Actividades y Observaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Objetivo */}
        <Card className="border-l-4 border-l-primary">
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="text-primary" size={20} />
                <h3 className="font-semibold text-base">Objetivo</h3>
              </div>
              {esEditable && !isEditing && (
                <Button
                  isIconOnly
                  color="primary"
                  size="sm"
                  variant="flat"
                  onPress={() => setIsEditing(true)}
                >
                  <Edit size={16} />
                </Button>
              )}
            </div>
            {isEditing ? (
              <Textarea
                classNames={{
                  input: "text-base",
                }}
                minRows={4}
                placeholder="Describe el objetivo principal de esta clase..."
                value={formData.objetivo}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, objetivo: e.target.value })
                }
              />
            ) : (
              <p className="text-default-700 text-base whitespace-pre-wrap">
                {clase.objetivo || "Sin objetivo definido"}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Actividades */}
        <Card className="border-l-4 border-l-secondary">
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="text-secondary" size={20} />
              <h3 className="font-semibold text-base">Actividades</h3>
            </div>
            {isEditing ? (
              <Textarea
                classNames={{
                  input: "text-base",
                }}
                minRows={4}
                placeholder="Lista las actividades que realizarás durante la clase..."
                value={formData.actividades}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, actividades: e.target.value })
                }
              />
            ) : (
              <p className="text-default-700 text-base whitespace-pre-wrap">
                {clase.actividades || "Sin actividades definidas"}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Observaciones */}
        <Card className="border-l-4 border-l-warning">
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="text-warning" size={20} />
              <h3 className="font-semibold text-base">Observaciones</h3>
            </div>
            {isEditing ? (
              <Textarea
                classNames={{
                  input: "text-base",
                }}
                minRows={4}
                placeholder="Materiales necesarios, consideraciones especiales, etc..."
                value={formData.observaciones}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
              />
            ) : (
              <p className="text-default-700 text-base whitespace-pre-wrap">
                {clase.observaciones || "Sin observaciones"}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Botones de edición */}
      {isEditing && (
        <div className="flex flex-col gap-2 sticky bottom-4 z-10">
          <Button
            fullWidth
            color="primary"
            isLoading={updateMutation.isPending}
            size="lg"
            startContent={<Save size={18} />}
            onPress={handleSave}
          >
            Guardar Planificación
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="flat"
            onPress={() => {
              setFormData({
                objetivo: clase.objetivo || "",
                actividades: clase.actividades || "",
                observaciones: clase.observaciones || "",
              });
              setIsEditing(false);
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

// Tab de Alumnos
function AlumnosTab({
  alumnos,
  isLoading,
}: {
  alumnos: AlumnoAsistencia[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-[30vh] w-full items-center justify-center">
        <Spinner label="Cargando alumnos..." />
      </div>
    );
  }

  if (alumnos.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center justify-center p-8 text-center h-60">
          <Users className="text-default-300 mb-4" size={64} />
          <p className="text-default-500 font-medium mb-1">
            No hay alumnos inscritos
          </p>
          <p className="text-sm text-default-400">
            Este horario no tiene alumnos matriculados
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadística */}
      <Card className="bg-primary-50/50 border-primary-200 border">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700">
                {alumnos.length}
              </p>
              <p className="text-sm text-primary-600">Alumnos inscritos</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de alumnos */}
      <div className="space-y-2">
        {alumnos.map((alumno) => (
          <Card
            key={alumno.id}
            className="shadow-none border border-default-200"
          >
            <CardBody className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">
                      {alumno.nombre_completo}
                    </p>
                    <p className="text-sm text-default-500">{alumno.rut}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-default-400 text-xs">Teléfono</p>
                    <p className="font-medium">
                      {alumno.telefono || "Sin registro"}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-400 text-xs">Emergencia</p>
                    <p className="font-medium">
                      {alumno.telefono_emergencia || "Sin registro"}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Tab de Asistencia
function AsistenciaTab({
  alumnos,
  clase,
  esEditable,
  isLoading,
  queryClient,
}: {
  alumnos: AlumnoAsistencia[];
  clase: DetalleClase;
  esEditable: boolean;
  isLoading: boolean;
  queryClient: any;
}) {
  const [asistencias, setAsistencias] = useState<Record<number, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar asistencias cuando cambian los alumnos
  useEffect(() => {
    const inicial: Record<number, boolean> = {};

    alumnos.forEach((a) => {
      inicial[a.id] = a.presente;
    });
    setAsistencias(inicial);
    setHasChanges(false);
  }, [alumnos]);

  const guardarMutation = useMutation({
    mutationFn: (data: {
      horario_id: number;
      fecha: string;
      asistencias: Array<{ alumno_id: number; presente: boolean }>;
    }) => asistenciaApi.guardarAsistencia(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profesor", "asistencia_clase"],
      });
      showToast({ title: "Asistencia guardada", color: "success" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      showToast({
        title: error.response?.data?.error || "Error al guardar asistencia",
        color: "danger",
      });
    },
  });

  const handleToggle = (alumnoId: number) => {
    if (!esEditable) {
      showToast({
        title: "No se puede modificar la asistencia de una clase pasada",
        color: "danger",
      });

      return;
    }
    setAsistencias((prev) => ({
      ...prev,
      [alumnoId]: !prev[alumnoId],
    }));
    setHasChanges(true);
  };

  const handleGuardar = () => {
    const asistenciasArray = Object.entries(asistencias).map(
      ([id, presente]) => ({
        alumno_id: Number(id),
        presente,
      }),
    );

    guardarMutation.mutate({
      horario_id: clase.horario_id,
      fecha: clase.fecha_clase,
      asistencias: asistenciasArray,
    });
  };

  const marcarTodos = (presente: boolean) => {
    if (!esEditable) {
      showToast({
        title: "No se puede modificar la asistencia de una clase pasada",
        color: "danger",
      });

      return;
    }
    const nuevas: Record<number, boolean> = {};

    alumnos.forEach((a) => {
      nuevas[a.id] = presente;
    });
    setAsistencias(nuevas);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[30vh] w-full items-center justify-center">
        <Spinner label="Cargando asistencia..." />
      </div>
    );
  }

  if (alumnos.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center justify-center p-8 text-center h-60">
          <CheckSquare className="text-default-300 mb-4" size={64} />
          <p className="text-default-500 font-medium mb-1">
            No hay alumnos para registrar
          </p>
          <p className="text-sm text-default-400">
            Este horario no tiene alumnos matriculados
          </p>
        </CardBody>
      </Card>
    );
  }

  const presentes = Object.values(asistencias).filter(Boolean).length;
  const total = alumnos.length;

  return (
    <div className="space-y-4">
      {/* Mensaje de solo lectura */}
      {!esEditable && (
        <Card className="border-l-4 border-l-warning bg-warning-50/50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="text-warning-600 shrink-0" size={20} />
              <p className="text-sm font-medium text-warning-800">
                Esta clase ya finalizó. No puedes modificar la asistencia.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-success-50/50 border-success-200 border">
          <CardBody className="p-3 text-center">
            <p className="text-2xl font-bold text-success-700">{presentes}</p>
            <p className="text-xs text-success-600">Presentes</p>
          </CardBody>
        </Card>
        <Card className="bg-danger-50/50 border-danger-200 border">
          <CardBody className="p-3 text-center">
            <p className="text-2xl font-bold text-danger-700">
              {total - presentes}
            </p>
            <p className="text-xs text-danger-600">Ausentes</p>
          </CardBody>
        </Card>
        <Card className="bg-default-100 border-default-200 border">
          <CardBody className="p-3 text-center">
            <p className="text-2xl font-bold text-default-700">{total}</p>
            <p className="text-xs text-default-600">Total</p>
          </CardBody>
        </Card>
      </div>

      {/* Acciones rápidas */}
      {esEditable && (
        <div className="flex gap-2">
          <Button
            fullWidth
            color="success"
            size="sm"
            startContent={<UserCheck size={14} />}
            variant="flat"
            onPress={() => marcarTodos(true)}
          >
            ✓ Todos presentes
          </Button>
          <Button
            fullWidth
            color="danger"
            size="sm"
            startContent={<UserX size={14} />}
            variant="flat"
            onPress={() => marcarTodos(false)}
          >
            ✗ Todos ausentes
          </Button>
        </div>
      )}

      {/* Lista de alumnos */}
      <div className="space-y-2">
        {alumnos.map((alumno) => (
          <Card
            key={alumno.id}
            className={`w-full shadow-none border border-default-200 transition-all ${
              asistencias[alumno.id]
                ? "border-l-4 border-l-success bg-success-50/40"
                : "border-l-4 border-l-danger bg-danger-50/30"
            }`}
            isPressable={esEditable}
            onPress={() => esEditable && handleToggle(alumno.id)}
          >
            <CardBody className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">
                    {alumno.nombre_completo}
                  </p>
                  <p className="text-xs text-default-500">{alumno.rut}</p>
                </div>
                {esEditable ? (
                  <Checkbox
                    color="success"
                    isSelected={asistencias[alumno.id] || false}
                    size="lg"
                    onValueChange={() => handleToggle(alumno.id)}
                  />
                ) : (
                  <Chip
                    color={asistencias[alumno.id] ? "success" : "danger"}
                    size="sm"
                    variant="flat"
                  >
                    {asistencias[alumno.id] ? "✓" : "✗"}
                  </Chip>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Botón guardar */}
      {esEditable && hasChanges && (
        <div className="sticky bottom-4 z-10">
          <Button
            fullWidth
            color="primary"
            isLoading={guardarMutation.isPending}
            size="lg"
            startContent={<Save size={18} />}
            onPress={handleGuardar}
          >
            Guardar Asistencia
          </Button>
        </div>
      )}
    </div>
  );
}

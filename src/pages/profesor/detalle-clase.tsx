import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Progress,
  Divider,
} from "@heroui/react";
import {
  Clock,
  MapPin,
  Users,
  AlertCircle,
  ArrowLeft,
  FileText,
  CheckSquare,
  Target,
  ListChecks,
  Save,
  Edit,
  UserCheck,
  UserX,
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
  const { claseId } = useParams<{ claseId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "planificacion";
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch detalle de la clase
  const { data: clase, isLoading } = useQuery({
    queryKey: ["profesor", "detalle_clase", claseId],
    queryFn: () => detalleClaseApi.getDetalleById(Number(claseId)),
    enabled: !!claseId,
  });

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
      if (t) setSelectedTab(t);
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
      <div className="text-center p-8">
        <AlertCircle className="mx-auto text-warning mb-4" size={48} />
        <h3 className="text-lg font-semibold mb-2">Clase no encontrada</h3>
        <p className="text-default-500 mb-4">
          La clase solicitada no existe o no tienes acceso.
        </p>
        <Button
          color="primary"
          startContent={<ArrowLeft size={18} />}
          onPress={() => navigate("/profesor/horarios")}
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
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button
          isIconOnly
          className="self-start"
          size="sm"
          variant="flat"
          onPress={() =>
            navigate(`/profesor/horarios/${clase.horario_id}/clases`)
          }
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              {clase.taller_nombre}
            </h1>
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
          <p className="text-lg text-default-600 mt-1 capitalize">
            {formatDate(clase.fecha_clase)}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Chip
              color="default"
              size="sm"
              startContent={<Clock size={12} />}
              variant="flat"
            >
              {formatTimeHHMM(clase.hora_inicio)} -{" "}
              {formatTimeHHMM(clase.hora_fin)}
            </Chip>
            <Chip
              color="default"
              size="sm"
              startContent={<MapPin size={12} />}
              variant="flat"
            >
              {clase.ubicacion_nombre}
            </Chip>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        aria-label="Opciones de clase"
        classNames={{
          tabList: "w-full",
          tab: "flex-1",
        }}
        color="primary"
        selectedKey={selectedTab}
        size="lg"
        variant="underlined"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="planificacion"
          title={
            <div className="flex items-center gap-2">
              <FileText size={18} />
              <span>Planificación</span>
            </div>
          }
        >
          <PlanificacionTab
            clase={clase}
            esEditable={esEditable}
            isEditing={isEditing}
            profesorId={user?.profesor_id}
            queryClient={queryClient}
            setIsEditing={setIsEditing}
          />
        </Tab>
        <Tab
          key="alumnos"
          title={
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>Alumnos</span>
            </div>
          }
        >
          <AlumnosTab alumnos={alumnos} isLoading={asistenciaLoading} />
        </Tab>
        <Tab
          key="asistencia"
          title={
            <div className="flex items-center gap-2">
              <CheckSquare size={18} />
              <span>Asistencia</span>
            </div>
          }
        >
          <AsistenciaTab
            alumnos={alumnos}
            clase={clase}
            esEditable={asistenciaData?.es_editable || false}
            isLoading={asistenciaLoading}
            queryClient={queryClient}
          />
        </Tab>
      </Tabs>
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
      <Card className="mt-4">
        <CardBody className="flex flex-col items-center justify-center p-12">
          <FileText className="text-default-300 mb-4" size={48} />
          <p className="text-default-500 font-medium text-center">
            No hay planificación registrada para esta clase
          </p>
          {esEditable && (
            <Button
              className="mt-4"
              color="primary"
              startContent={<Edit size={16} />}
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
    <Card className="mt-4">
      <CardBody className="space-y-6 p-6">
        {/* Header con botón editar */}
        {esEditable && !isEditing && (
          <div className="flex justify-end">
            <Button
              color="primary"
              size="sm"
              startContent={<Edit size={14} />}
              variant="flat"
              onPress={() => setIsEditing(true)}
            >
              Editar
            </Button>
          </div>
        )}

        {/* Objetivo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="text-primary" size={18} />
            <h3 className="font-semibold text-lg">Objetivo</h3>
          </div>
          {isEditing ? (
            <Textarea
              minRows={2}
              placeholder="Describe el objetivo de la clase..."
              value={formData.objetivo}
              onChange={(e) =>
                setFormData({ ...formData, objetivo: e.target.value })
              }
            />
          ) : (
            <p className="text-default-700 whitespace-pre-wrap">
              {clase.objetivo || "Sin objetivo definido"}
            </p>
          )}
        </div>

        <Divider />

        {/* Actividades */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="text-secondary" size={18} />
            <h3 className="font-semibold text-lg">Actividades</h3>
          </div>
          {isEditing ? (
            <Textarea
              minRows={3}
              placeholder="Lista las actividades a realizar..."
              value={formData.actividades}
              onChange={(e) =>
                setFormData({ ...formData, actividades: e.target.value })
              }
            />
          ) : (
            <p className="text-default-700 whitespace-pre-wrap">
              {clase.actividades || "Sin actividades definidas"}
            </p>
          )}
        </div>

        <Divider />

        {/* Observaciones */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="text-warning" size={18} />
            <h3 className="font-semibold text-lg">Observaciones</h3>
          </div>
          {isEditing ? (
            <Textarea
              minRows={2}
              placeholder="Notas adicionales, materiales, etc..."
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
            />
          ) : (
            <p className="text-default-700 whitespace-pre-wrap">
              {clase.observaciones || "Sin observaciones"}
            </p>
          )}
        </div>

        {/* Botones de edición */}
        {isEditing && (
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="light"
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
            <Button
              color="primary"
              isLoading={updateMutation.isPending}
              startContent={<Save size={16} />}
              onPress={handleSave}
            >
              Guardar
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
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
      <Card className="mt-4">
        <CardBody className="flex flex-col items-center justify-center p-12">
          <Users className="text-default-300 mb-4" size={48} />
          <p className="text-default-500 font-medium">
            No hay alumnos inscritos en este horario
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Users size={18} />
            Alumnos Inscritos ({alumnos.length})
          </h3>
        </div>
        <Table aria-label="Tabla de alumnos">
          <TableHeader>
            <TableColumn>RUT</TableColumn>
            <TableColumn>NOMBRE</TableColumn>
            <TableColumn>TELÉFONO</TableColumn>
            <TableColumn>EMERGENCIA</TableColumn>
          </TableHeader>
          <TableBody>
            {alumnos.map((alumno) => (
              <TableRow key={alumno.id}>
                <TableCell>{alumno.rut}</TableCell>
                <TableCell>
                  <span className="font-medium">{alumno.nombre_completo}</span>
                </TableCell>
                <TableCell>{alumno.telefono || "-"}</TableCell>
                <TableCell>{alumno.telefono_emergencia || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
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
  useMemo(() => {
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
    if (!esEditable) return;
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
    if (!esEditable) return;
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
      <Card className="mt-4">
        <CardBody className="flex flex-col items-center justify-center p-12">
          <CheckSquare className="text-default-300 mb-4" size={48} />
          <p className="text-default-500 font-medium">
            No hay alumnos para pasar asistencia
          </p>
        </CardBody>
      </Card>
    );
  }

  const presentes = Object.values(asistencias).filter(Boolean).length;
  const total = alumnos.length;
  const porcentaje = total > 0 ? (presentes / total) * 100 : 0;

  return (
    <Card className="mt-4">
      <CardBody className="space-y-4">
        {/* Estadísticas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="text-success" size={20} />
              <span className="font-semibold">{presentes} presentes</span>
            </div>
            <div className="flex items-center gap-2">
              <UserX className="text-danger" size={20} />
              <span className="font-semibold">
                {total - presentes} ausentes
              </span>
            </div>
          </div>
          <Progress
            aria-label="Porcentaje asistencia"
            className="max-w-md"
            color={
              porcentaje > 80
                ? "success"
                : porcentaje > 50
                  ? "warning"
                  : "danger"
            }
            label={`${porcentaje.toFixed(0)}% asistencia`}
            size="md"
            value={porcentaje}
          />
        </div>

        {/* Acciones rápidas */}
        {esEditable && (
          <div className="flex gap-2">
            <Button
              color="success"
              size="sm"
              startContent={<UserCheck size={14} />}
              variant="flat"
              onPress={() => marcarTodos(true)}
            >
              Todos presentes
            </Button>
            <Button
              color="danger"
              size="sm"
              startContent={<UserX size={14} />}
              variant="flat"
              onPress={() => marcarTodos(false)}
            >
              Todos ausentes
            </Button>
          </div>
        )}

        {!esEditable && (
          <Chip color="warning" variant="flat">
            La asistencia de esta clase no se puede editar
          </Chip>
        )}

        <Divider />

        {/* Lista de alumnos */}
        <Table
          aria-label="Tabla de asistencia"
          classNames={{
            tr: esEditable ? "cursor-pointer hover:bg-default-100" : "",
          }}
        >
          <TableHeader>
            <TableColumn width={60}>ASIST.</TableColumn>
            <TableColumn>RUT</TableColumn>
            <TableColumn>NOMBRE</TableColumn>
          </TableHeader>
          <TableBody>
            {alumnos.map((alumno) => (
              <TableRow
                key={alumno.id}
                onClick={() => esEditable && handleToggle(alumno.id)}
              >
                <TableCell>
                  <Checkbox
                    color="success"
                    isDisabled={!esEditable}
                    isSelected={asistencias[alumno.id] || false}
                    onValueChange={() => handleToggle(alumno.id)}
                  />
                </TableCell>
                <TableCell>{alumno.rut}</TableCell>
                <TableCell>
                  <span
                    className={
                      asistencias[alumno.id]
                        ? "font-medium text-success"
                        : "text-default-500"
                    }
                  >
                    {alumno.nombre_completo}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Botón guardar */}
        {esEditable && hasChanges && (
          <div className="flex justify-end pt-4">
            <Button
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
      </CardBody>
    </Card>
  );
}

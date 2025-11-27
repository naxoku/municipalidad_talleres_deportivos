import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
} from "@heroui/react";
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Target,
  ListChecks,
  Clock,
  Lock,
  Eye,
  Copy,
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/auth";
import {
  detalleClaseApi,
  DetalleClaseForm,
  DetalleClase,
} from "@/api/detalle_clase";
import { profesorApi } from "@/api/profesor";
import { horariosApi } from "@/api/horarios";
import { localIsoDate } from "@/utils/localDate";

// Función helper para verificar si una fecha es pasada
const esFechaPasada = (fecha: string): boolean => {
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  const fechaClase = new Date(fecha + "T00:00:00");

  return fechaClase < hoy;
};

// Función helper para obtener fecha mínima (hoy)
const getFechaMinima = (): string => {
  return localIsoDate();
};

export default function ProfesorPlanificacionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados principales
  const [vistaActual, setVistaActual] = useState<"lista" | "crear">("lista");
  const [pasoActual, setPasoActual] = useState(1); // Pasos del wizard
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetalle, setSelectedDetalle] = useState<DetalleClase | null>(null);
  const [modoVisualizacion, setModoVisualizacion] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteIdToConfirm, setDeleteIdToConfirm] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState<DetalleClaseForm>({
    horario_id: 0,
    taller_id: 0,
    fecha_clase: "",
    objetivo: "",
    actividades: "",
    observaciones: "",
  });

  // Fetch talleres del profesor
  const { data: talleres } = useQuery({
    queryKey: ["profesor", "talleres", user?.profesor_id],
    queryFn: () => profesorApi.getTalleres(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  // Fetch all horarios
  const { data: todosHorarios = [] } = useQuery({
    queryKey: ["horarios"],
    queryFn: () => horariosApi.getAll(),
  });

  // Fetch planificaciones
  const { data: planificaciones, isLoading } = useQuery({
    queryKey: ["profesor", "planificaciones", user?.profesor_id],
    queryFn: () =>
      detalleClaseApi.getDetalles({ profesor_id: user!.profesor_id! }),
    enabled: !!user?.profesor_id,
  });

  // Normalizar la respuesta de la API a un array de planificaciones
  const planificacionesList = useMemo(() => {
    if (!planificaciones) return [] as DetalleClase[];
    if (Array.isArray(planificaciones))
      return planificaciones as DetalleClase[];
    if (Array.isArray((planificaciones as any).datos))
      return (planificaciones as any).datos as DetalleClase[];
    if (Array.isArray((planificaciones as any).value))
      return (planificaciones as any).value as DetalleClase[];
    if (Array.isArray((planificaciones as any).data?.datos))
      return (planificaciones as any).data.datos as DetalleClase[];

    return [] as DetalleClase[];
  }, [planificaciones]);

  // Normalizar la respuesta de la API a un array de talleres
  const talleresList = useMemo(() => {
    if (!talleres) return [] as any[];
    if (Array.isArray(talleres)) return talleres as any[];
    if (Array.isArray((talleres as any).datos))
      return (talleres as any).datos as any[];
    if (Array.isArray((talleres as any).value))
      return (talleres as any).value as any[];
    if (Array.isArray((talleres as any).data?.datos))
      return (talleres as any).data.datos as any[];

    return [] as any[];
  }, [talleres]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DetalleClaseForm) =>
      detalleClaseApi.createDetalle({
        ...data,
        profesor_id: user?.profesor_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profesor", "planificaciones"],
      });
      showToast({
        title: "Planificación creada exitosamente",
        color: "success",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      showToast({
        title: error.response?.data?.error || "Error al crear planificación",
        color: "danger",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: DetalleClaseForm & { id: number }) =>
      detalleClaseApi.updateDetalle(data.id, {
        ...data,
        profesor_id: user?.profesor_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profesor", "planificaciones"],
      });
      showToast({
        title: "Planificación actualizada exitosamente",
        color: "success",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      showToast({
        title:
          error.response?.data?.error || "Error al actualizar planificación",
        color: "danger",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      detalleClaseApi.deleteDetalle(id, user?.profesor_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profesor", "planificaciones"],
      });
      showToast({
        title: "Planificación eliminada exitosamente",
        color: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        title: error.response?.data?.error || "Error al eliminar planificación",
        color: "danger",
      });
    },
  });

  const filteredPlanificaciones = useMemo(() => {
    if (!planificacionesList) return [] as DetalleClase[];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let filtered = planificacionesList.filter((p) => {
      const matchesSearch =
        p.taller_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.objetivo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fecha_clase.includes(searchQuery);

      return matchesSearch;
    });

    // Ordenar: próximas primero, luego pasadas
    filtered.sort((a, b) => {
      const fechaA = new Date(a.fecha_clase + "T00:00:00");
      const fechaB = new Date(b.fecha_clase + "T00:00:00");
      
      // Si una es futura y otra pasada, la futura va primero
      if (fechaA >= hoy && fechaB < hoy) return -1;
      if (fechaA < hoy && fechaB >= hoy) return 1;
      
      // Si ambas son futuras, la más cercana primero
      if (fechaA >= hoy && fechaB >= hoy) {
        return fechaA.getTime() - fechaB.getTime();
      }
      
      // Si ambas son pasadas, la más reciente primero
      return fechaB.getTime() - fechaA.getTime();
    });

    return filtered;
  }, [planificacionesList, searchQuery]);

  const resetForm = () => {
    setFormData({
      horario_id: 0,
      taller_id: 0,
      fecha_clase: "",
      objetivo: "",
      actividades: "",
      observaciones: "",
    });
    setSelectedDetalle(null);
    setModoVisualizacion(false);
    setPasoActual(1);
    setVistaActual("lista");
  };

  const handleCreate = () => {
    resetForm();
    setModoVisualizacion(false);
    setVistaActual("crear");
    setPasoActual(1);
  };

  const handleEdit = (detalle: DetalleClase) => {
    // Verificar si la fecha es pasada
    if (esFechaPasada(detalle.fecha_clase)) {
      showToast({
        title: "No se puede editar esta planificación porque la clase ya pasó",
        color: "danger",
      });

      return;
    }

    setSelectedDetalle(detalle);
    setModoVisualizacion(false);
    setFormData({
      horario_id: detalle.horario_id,
      taller_id: detalle.taller_id,
      fecha_clase: detalle.fecha_clase,
      objetivo: detalle.objetivo,
      actividades: detalle.actividades,
      observaciones: detalle.observaciones,
    });
    onOpen();
  };

  const handleView = (detalle: DetalleClase) => {
    setSelectedDetalle(detalle);
    setModoVisualizacion(true);
    setFormData({
      horario_id: detalle.horario_id,
      taller_id: detalle.taller_id,
      fecha_clase: detalle.fecha_clase,
      objetivo: detalle.objetivo,
      actividades: detalle.actividades,
      observaciones: detalle.observaciones,
    });
    onOpen();
  };

  const handleCopyToNew = (detalle: DetalleClase) => {
    setSelectedDetalle(null);
    setModoVisualizacion(false);
    setFormData({
      horario_id: 0,
      taller_id: detalle.taller_id,
      fecha_clase: "", // Se debe seleccionar nueva fecha
      objetivo: detalle.objetivo,
      actividades: detalle.actividades,
      observaciones: detalle.observaciones,
    });
    showToast({
      title: "Contenido copiado. Selecciona una nueva fecha para la clase.",
      color: "primary",
    });
    onOpen();
  };

  const handleDelete = (id: number, fechaClase: string) => {
    // Verificar si la fecha es pasada
    if (esFechaPasada(fechaClase)) {
      showToast({
        title:
          "No se puede eliminar esta planificación porque la clase ya pasó",
        color: "danger",
      });

      return;
    }

    // Abrir modal de confirmación en vez de usar confirm() nativo
    setDeleteIdToConfirm(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.horario_id || !formData.taller_id || !formData.fecha_clase) {
      showToast({
        title: "Por favor completa los campos requeridos",
        color: "danger",
      });

      return;
    }

    // Validar que la fecha no sea pasada
    if (esFechaPasada(formData.fecha_clase)) {
      showToast({
        title: "No puedes crear una planificación para una fecha pasada",
        color: "danger",
      });

      return;
    }

    if (selectedDetalle) {
      updateMutation.mutate({ ...formData, id: selectedDetalle.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Get horarios for selected taller
  const horariosDelTaller = useMemo(() => {
    if (!formData.taller_id || !todosHorarios) return [];

    return todosHorarios.filter(
      (h) =>
        Number(h.taller_id) === Number(formData.taller_id) &&
        Number(h.profesor_id) === Number(user?.profesor_id),
    );
  }, [formData.taller_id, todosHorarios, user?.profesor_id]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner label="Cargando planificaciones..." size="lg" />
      </div>
    );
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximasCount = planificacionesList.filter((p) => {
    const fechaClase = new Date(p.fecha_clase + "T00:00:00");
    return fechaClase >= hoy;
  }).length;

  // VISTA CREAR/EDITAR
  if (vistaActual === "crear") {
    return (
      <div className="space-y-5 pb-10">
        {/* Header con volver */}
        <div className="flex flex-col gap-2">
          <Button
            className="w-fit"
            size="sm"
            startContent={<ArrowLeft size={16} />}
            variant="light"
            onPress={() => resetForm()}
          >
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {pasoActual === 1 ? (
                <Calendar className="text-primary" size={24} />
              ) : pasoActual === 2 ? (
                <Target className="text-primary" size={24} />
              ) : (
                <ListChecks className="text-primary" size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {selectedDetalle ? "Editar Planificación" : "Nueva Planificación"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Paso {pasoActual} de 3
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((paso) => (
            <div
              key={paso}
              className={`flex-1 h-2 rounded-full transition-all ${
                paso <= pasoActual ? "bg-primary" : "bg-default-200"
              }`}
            />
          ))}
        </div>

        {/* PASO 1: Seleccionar clase */}
        {pasoActual === 1 && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardBody className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Calendar className="text-primary shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      ¿Cuándo es la clase?
                    </h3>
                    <p className="text-sm text-default-500">
                      Selecciona el taller, horario y fecha de la clase
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Taller */}
                  <Select
                    isRequired
                    label="Taller"
                    placeholder="Selecciona un taller"
                    selectedKeys={
                      formData.taller_id ? [formData.taller_id.toString()] : []
                    }
                    size="lg"
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const tallerId = Array.from(keys)[0]?.toString();
                      setFormData({
                        ...formData,
                        taller_id: tallerId ? parseInt(tallerId) : 0,
                        horario_id: 0,
                      });
                    }}
                  >
                    {talleresList?.map((taller) => (
                      <SelectItem
                        key={taller.id.toString()}
                        textValue={taller.nombre}
                      >
                        {taller.nombre}
                      </SelectItem>
                    )) || []}
                  </Select>

                  {/* Horario */}
                  <Select
                    isRequired
                    isDisabled={!formData.taller_id}
                    label="Horario"
                    placeholder={
                      formData.taller_id
                        ? "Selecciona un horario"
                        : "Primero selecciona un taller"
                    }
                    selectedKeys={
                      formData.horario_id ? [formData.horario_id.toString()] : []
                    }
                    size="lg"
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const horarioId = Array.from(keys)[0]?.toString();
                      setFormData({
                        ...formData,
                        horario_id: horarioId ? parseInt(horarioId) : 0,
                      });
                    }}
                  >
                    {horariosDelTaller.map((horario) => (
                      <SelectItem
                        key={horario.id.toString()}
                        textValue={`${horario.dia_semana} ${horario.hora_inicio} - ${horario.hora_fin}`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span className="capitalize">
                            {horario.dia_semana} {horario.hora_inicio?.slice(0, 5)} -{" "}
                            {horario.hora_fin?.slice(0, 5)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Fecha */}
                  <Input
                    isRequired
                    description="Solo puedes seleccionar fechas de hoy en adelante"
                    label="Fecha de la clase"
                    min={getFechaMinima()}
                    size="lg"
                    startContent={<Calendar size={18} />}
                    type="date"
                    value={formData.fecha_clase}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_clase: e.target.value })
                    }
                  />
                </div>
              </CardBody>
            </Card>

            <Button
              fullWidth
              color="primary"
              isDisabled={
                !formData.taller_id || !formData.horario_id || !formData.fecha_clase
              }
              size="lg"
              onPress={() => {
                if (esFechaPasada(formData.fecha_clase)) {
                  showToast({
                    title: "No puedes crear una planificación para una fecha pasada",
                    color: "danger",
                  });
                  return;
                }
                setPasoActual(2);
              }}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* PASO 2: Objetivo */}
        {pasoActual === 2 && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardBody className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Target className="text-primary shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      ¿Cuál es el objetivo?
                    </h3>
                    <p className="text-sm text-default-500">
                      Describe qué quieres lograr en esta clase
                    </p>
                  </div>
                </div>

                <Textarea
                  minRows={5}
                  placeholder="Ejemplo: Mejorar la técnica de pase en fútbol, trabajando precisión y visión de juego..."
                  size="lg"
                  value={formData.objetivo}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, objetivo: e.target.value })
                  }
                />
              </CardBody>
            </Card>

            <div className="flex gap-2">
              <Button
                fullWidth
                size="lg"
                variant="flat"
                onPress={() => setPasoActual(1)}
              >
                Atrás
              </Button>
              <Button
                fullWidth
                color="primary"
                size="lg"
                onPress={() => setPasoActual(3)}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* PASO 3: Actividades y Observaciones */}
        {pasoActual === 3 && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-secondary">
              <CardBody className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <ListChecks className="text-secondary shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      ¿Qué actividades harás?
                    </h3>
                    <p className="text-sm text-default-500">
                      Lista los ejercicios o dinámicas de la clase
                    </p>
                  </div>
                </div>

                <Textarea
                  minRows={5}
                  placeholder="Ejemplo:&#10;1. Calentamiento (10 min)&#10;2. Ejercicios de pase en parejas (15 min)&#10;3. Juego en espacios reducidos (20 min)..."
                  size="lg"
                  value={formData.actividades}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, actividades: e.target.value })
                  }
                />
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardBody className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="text-warning shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      Observaciones (Opcional)
                    </h3>
                    <p className="text-sm text-default-500">
                      Materiales, consideraciones especiales, etc.
                    </p>
                  </div>
                </div>

                <Textarea
                  minRows={3}
                  placeholder="Ejemplo: Traer conos, balones, petos. Revisar estado del campo..."
                  size="lg"
                  value={formData.observaciones}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                />
              </CardBody>
            </Card>

            <div className="flex gap-2">
              <Button
                fullWidth
                size="lg"
                variant="flat"
                onPress={() => setPasoActual(2)}
              >
                Atrás
              </Button>
              <Button
                fullWidth
                color="primary"
                isLoading={createMutation.isPending || updateMutation.isPending}
                size="lg"
                onPress={handleSubmit}
              >
                {selectedDetalle ? "Guardar Cambios" : "Crear Planificación"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA LISTA
  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="text-primary" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Mis Planificaciones
            </h1>
            <p className="text-sm text-muted-foreground">
              {proximasCount > 0
                ? `${proximasCount} ${proximasCount === 1 ? "clase próxima" : "clases próximas"}`
                : "No hay clases próximas"}
            </p>
          </div>
        </div>
      </div>

      {/* Botón crear */}
      <Button
        fullWidth
        color="primary"
        size="lg"
        startContent={<Plus size={20} />}
        onPress={handleCreate}
      >
        Nueva Planificación
      </Button>

      {/* Búsqueda */}
      {planificacionesList.length > 0 && (
        <Input
          placeholder="Buscar por taller, objetivo o fecha..."
          size="lg"
          startContent={<Search size={18} />}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
      )}

      {/* Lista */}
      {filteredPlanificaciones.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center p-8 text-center h-60">
            <BookOpen className="text-default-300 mb-4" size={64} />
            <p className="text-default-500 font-medium mb-1">
              {searchQuery
                ? "No se encontraron planificaciones"
                : "No hay planificaciones aún"}
            </p>
            <p className="text-sm text-default-400 mb-4">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Comienza creando tu primera planificación"}
            </p>
            {!searchQuery && (
              <Button
                color="primary"
                size="lg"
                startContent={<Plus size={18} />}
                onPress={handleCreate}
              >
                Nueva Planificación
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPlanificaciones.map((detalle) => {
            const esPasada = esFechaPasada(detalle.fecha_clase);
            const fechaClase = new Date(detalle.fecha_clase + "T00:00:00");
            const esHoy = fechaClase.toDateString() === hoy.toDateString();
            const diasHasta = Math.ceil(
              (fechaClase.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
            );

            return (
              <Card
                key={detalle.id}
                isPressable={!esPasada}
                className={`shadow-none border border-default-200 transition-all ${
                  esPasada
                    ? "opacity-70 border-l-4 border-l-default-300"
                    : esHoy
                      ? "border-l-4 border-l-success"
                      : "border-l-4 border-l-primary"
                }`}
                onPress={() => !esPasada && handleEdit(detalle)}
              >
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Fecha visual */}
                    <div
                      className={`flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-lg ${
                        esPasada
                          ? "bg-default-100"
                          : esHoy
                            ? "bg-success-50"
                            : "bg-primary-50"
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          esPasada
                            ? "text-default-500"
                            : esHoy
                              ? "text-success-600"
                              : "text-primary-600"
                        }`}
                      >
                        {fechaClase.toLocaleDateString("es-CL", {
                          month: "short",
                        })}
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          esPasada
                            ? "text-default-700"
                            : esHoy
                              ? "text-success-700"
                              : "text-primary-700"
                        }`}
                      >
                        {fechaClase.getDate()}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base truncate">
                            {detalle.taller_nombre}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-default-500 mt-1">
                            <Clock size={12} />
                            <span className="capitalize">
                              {detalle.dia_semana} {detalle.hora_inicio?.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {esHoy && (
                            <Chip color="success" size="sm" variant="solid">
                              Hoy
                            </Chip>
                          )}
                          {!esHoy && !esPasada && diasHasta <= 7 && (
                            <Chip color="warning" size="sm" variant="flat">
                              {diasHasta === 1 ? "Mañana" : `En ${diasHasta} días`}
                            </Chip>
                          )}
                          {esPasada && (
                            <Chip
                              color="default"
                              size="sm"
                              startContent={<Lock size={12} />}
                              variant="flat"
                            >
                              Pasada
                            </Chip>
                          )}
                        </div>
                      </div>

                      {detalle.objetivo && (
                        <p className="text-sm text-default-600 line-clamp-2">
                          {detalle.objetivo}
                        </p>
                      )}

                      {/* Acciones */}
                      <div className="flex items-center gap-2 pt-1">
                        {!esPasada ? (
                          <>
                            <Button
                              color="primary"
                              size="sm"
                              startContent={<Edit size={14} />}
                              variant="flat"
                              onPress={() => handleEdit(detalle)}
                            >
                              Editar
                            </Button>
                            <Button
                              isIconOnly
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDelete(detalle.id, detalle.fecha_clase);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              color="default"
                              size="sm"
                              startContent={<Eye size={14} />}
                              variant="flat"
                              onPress={() => handleView(detalle)}
                            >
                              Ver
                            </Button>
                            <Button
                              color="primary"
                              size="sm"
                              startContent={<Copy size={14} />}
                              variant="flat"
                              onPress={() => handleCopyToNew(detalle)}
                            >
                              Reutilizar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de visualización para clases pasadas */}
      <Modal isOpen={isOpen} scrollBehavior="inside" size="lg" onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2 border-b">
            <Lock className="text-default-400" size={18} />
            <span>Planificación (Solo Lectura)</span>
          </ModalHeader>
          <ModalBody className="gap-4 py-6">
            <Card className="border-l-4 border-l-warning bg-warning-50/50">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-warning-600 shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-medium text-warning-800">
                      Esta planificación es de solo lectura
                    </p>
                    <p className="text-xs text-warning-600">
                      La clase ya pasó. Puedes copiar el contenido para reutilizarlo.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {selectedDetalle && (
              <>
                <div>
                  <label className="text-sm font-medium text-default-600 mb-2 block">
                    Taller
                  </label>
                  <p className="text-base font-semibold">
                    {selectedDetalle.taller_nombre}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-default-600 mb-2 block">
                    Horario
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-default-500" />
                    <p className="text-base capitalize">
                      {selectedDetalle.dia_semana}{" "}
                      {selectedDetalle.hora_inicio?.slice(0, 5)} -{" "}
                      {selectedDetalle.hora_fin?.slice(0, 5)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-default-600 mb-2 block">
                    Fecha
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-default-500" />
                    <p className="text-base">
                      {new Date(
                        selectedDetalle.fecha_clase + "T00:00:00",
                      ).toLocaleDateString("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {selectedDetalle.objetivo && (
                  <div>
                    <label className="text-sm font-medium text-default-600 mb-2 flex items-center gap-2">
                      <Target className="text-primary" size={16} />
                      Objetivo
                    </label>
                    <p className="text-base whitespace-pre-wrap">
                      {selectedDetalle.objetivo}
                    </p>
                  </div>
                )}

                {selectedDetalle.actividades && (
                  <div>
                    <label className="text-sm font-medium text-default-600 mb-2 flex items-center gap-2">
                      <ListChecks className="text-secondary" size={16} />
                      Actividades
                    </label>
                    <p className="text-base whitespace-pre-wrap">
                      {selectedDetalle.actividades}
                    </p>
                  </div>
                )}

                {selectedDetalle.observaciones && (
                  <div>
                    <label className="text-sm font-medium text-default-600 mb-2 flex items-center gap-2">
                      <FileText className="text-warning" size={16} />
                      Observaciones
                    </label>
                    <p className="text-base whitespace-pre-wrap">
                      {selectedDetalle.observaciones}
                    </p>
                  </div>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter className="border-t">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button fullWidth size="lg" variant="light" onPress={onClose}>
                Cerrar
              </Button>
              <Button
                fullWidth
                color="primary"
                size="lg"
                startContent={<Copy size={16} />}
                onPress={() => {
                  onClose();
                  if (selectedDetalle) {
                    handleCopyToNew(selectedDetalle);
                  }
                }}
              >
                Copiar para nueva clase
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmación eliminar */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        size="sm"
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Eliminar planificación</h3>
              </ModalHeader>
              <ModalBody>
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-danger shrink-0 mt-1" size={20} />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      ¿Estás seguro de eliminar esta planificación?
                    </p>
                    <p className="text-xs text-default-500">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2 w-full">
                  <Button fullWidth variant="light" onPress={() => onClose()}>
                    Cancelar
                  </Button>
                  <Button
                    fullWidth
                    color="danger"
                    isLoading={deleteMutation.isPending}
                    onPress={() => {
                      if (deleteIdToConfirm) {
                        deleteMutation.mutate(deleteIdToConfirm, {
                          onSuccess: () => {
                            onClose();
                            setDeleteIdToConfirm(null);
                          },
                        });
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

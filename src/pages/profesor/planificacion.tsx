import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
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
  Divider,
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
  // use the centralized HeroUI addToast wrapper
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaller, setSelectedTaller] = useState<string>("");
  const [selectedDetalle, setSelectedDetalle] = useState<DetalleClase | null>(
    null,
  );
  const [modoVisualizacion, setModoVisualizacion] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteIdToConfirm, setDeleteIdToConfirm] = useState<number | null>(
    null,
  );

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

    return planificacionesList.filter((p) => {
      const matchesSearch =
        p.taller_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.objetivo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fecha_clase.includes(searchQuery);

      const matchesTaller =
        !selectedTaller || p.taller_id.toString() === selectedTaller;

      return matchesSearch && matchesTaller;
    });
  }, [planificacionesList, searchQuery, selectedTaller]);

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
  };

  const handleCreate = () => {
    resetForm();
    setModoVisualizacion(false);
    onOpen();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planificación de Clases</h1>
          <p className="text-default-500">
            Gestiona el contenido y objetivos de tus clases
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={handleCreate}
        >
          Nueva Planificación
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          classNames={{ base: "flex-1" }}
          placeholder="Buscar por taller, fecha u objetivo..."
          startContent={<Search size={18} />}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <Select
          aria-label="Filtrar por taller"
          className="sm:w-64"
          placeholder="Filtrar por taller"
          selectedKeys={selectedTaller ? [selectedTaller] : []}
          onSelectionChange={(keys) =>
            setSelectedTaller(Array.from(keys)[0]?.toString() || "")
          }
        >
          {talleresList?.map((taller) => (
            <SelectItem key={taller.id.toString()} textValue={taller.nombre}>
              {taller.nombre}
            </SelectItem>
          )) || []}
        </Select>
      </div>

      {/* Planificaciones List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlanificaciones.length === 0 ? (
          <Card className="col-span-full">
            <CardBody className="text-center py-12">
              <BookOpen className="mx-auto mb-3 text-default-300" size={48} />
              <p className="text-default-500">
                No hay planificaciones aún. ¡Crea tu primera planificación!
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredPlanificaciones.map((detalle) => {
            const esPasada = esFechaPasada(detalle.fecha_clase);

            return (
              <Card
                key={detalle.id}
                className={`border-l-4 ${esPasada ? "border-l-default-300" : "border-l-primary"}`}
              >
                <CardHeader className="flex-col items-start gap-2">
                  <div className="flex w-full items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{detalle.taller_nombre}</h3>
                        {esPasada && (
                          <Lock className="text-default-400" size={14} />
                        )}
                      </div>
                      <p className="text-xs text-default-400 capitalize">
                        {detalle.dia_semana} {detalle.hora_inicio} -{" "}
                        {detalle.hora_fin}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Chip
                        color={esPasada ? "default" : "primary"}
                        size="sm"
                        variant="flat"
                      >
                        {new Date(detalle.fecha_clase).toLocaleDateString(
                          "es-CL",
                        )}
                      </Chip>
                      {esPasada && (
                        <span className="text-xs text-default-400">
                          Solo lectura
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="gap-3">
                  {detalle.objetivo && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="text-primary" size={14} />
                        <p className="text-xs font-semibold text-default-600">
                          Objetivo
                        </p>
                      </div>
                      <p className="text-sm text-default-700 line-clamp-2">
                        {detalle.objetivo}
                      </p>
                    </div>
                  )}

                  {detalle.actividades && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ListChecks className="text-secondary" size={14} />
                        <p className="text-xs font-semibold text-default-600">
                          Actividades
                        </p>
                      </div>
                      <p className="text-sm text-default-700 line-clamp-2">
                        {detalle.actividades}
                      </p>
                    </div>
                  )}

                  <Divider />

                  {esPasada ? (
                    /* Botones para planificación pasada */
                    <div className="flex gap-2">
                      <Button
                        fullWidth
                        color="default"
                        size="sm"
                        startContent={<Eye size={14} />}
                        variant="flat"
                        onPress={() => handleView(detalle)}
                      >
                        Ver Detalle
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
                    </div>
                  ) : (
                    /* Botones para planificación editable */
                    <div className="flex gap-2">
                      <Button
                        fullWidth
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
                        aria-label="Eliminar detalle"
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() =>
                          handleDelete(detalle.id, detalle.fecha_clase)
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Create/Edit/View */}
      <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            {modoVisualizacion ? (
              <>
                <Lock className="text-default-400" size={18} />
                Planificación (Solo Lectura)
              </>
            ) : selectedDetalle ? (
              "Editar Planificación"
            ) : (
              "Nueva Planificación"
            )}
          </ModalHeader>
          <ModalBody className="gap-4">
            {/* Banner de solo lectura */}
            {modoVisualizacion && (
              <div className="flex items-center gap-3 rounded-lg bg-warning-50 p-3 border-l-4 border-l-warning">
                <AlertCircle className="text-warning-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-warning-800">
                    Esta planificación es de solo lectura
                  </p>
                  <p className="text-xs text-warning-600">
                    La clase ya pasó. Puedes copiar el contenido para una nueva
                    planificación.
                  </p>
                </div>
              </div>
            )}

            {/* Taller Select */}
            <Select
              isRequired
              isDisabled={modoVisualizacion}
              label="Taller"
              placeholder="Selecciona un taller"
              selectedKeys={
                formData.taller_id ? [formData.taller_id.toString()] : []
              }
              onSelectionChange={(keys) => {
                const tallerId = Array.from(keys)[0]?.toString();

                setFormData({
                  ...formData,
                  taller_id: tallerId ? parseInt(tallerId) : 0,
                  horario_id: 0, // Reset horario
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

            {/* Horario Select */}
            <Select
              isRequired
              isDisabled={!formData.taller_id || modoVisualizacion}
              label="Horario"
              placeholder="Selecciona un horario"
              selectedKeys={
                formData.horario_id ? [formData.horario_id.toString()] : []
              }
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
                  <span className="capitalize">
                    {horario.dia_semana} {horario.hora_inicio} -{" "}
                    {horario.hora_fin}
                  </span>
                </SelectItem>
              ))}
            </Select>

            {/* Fecha */}
            <Input
              isRequired
              description={
                !modoVisualizacion
                  ? "Solo puedes seleccionar fechas de hoy en adelante"
                  : undefined
              }
              isDisabled={modoVisualizacion}
              label="Fecha de la Clase"
              min={getFechaMinima()}
              startContent={<Calendar size={18} />}
              type="date"
              value={formData.fecha_clase}
              onChange={(e) =>
                setFormData({ ...formData, fecha_clase: e.target.value })
              }
            />

            {/* Objetivo */}
            <Textarea
              isReadOnly={modoVisualizacion}
              label="Objetivo de la Clase"
              minRows={2}
              placeholder="Describe el objetivo principal de la clase..."
              value={formData.objetivo}
              onChange={(e) =>
                setFormData({ ...formData, objetivo: e.target.value })
              }
            />

            {/* Actividades */}
            <Textarea
              isReadOnly={modoVisualizacion}
              label="Actividades"
              minRows={3}
              placeholder="Lista las actividades y ejercicios a realizar..."
              value={formData.actividades}
              onChange={(e) =>
                setFormData({ ...formData, actividades: e.target.value })
              }
            />

            {/* Observaciones */}
            <Textarea
              isReadOnly={modoVisualizacion}
              label="Observaciones"
              minRows={2}
              placeholder="Notas adicionales, materiales necesarios, etc..."
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {modoVisualizacion ? "Cerrar" : "Cancelar"}
            </Button>
            {modoVisualizacion ? (
              <Button
                color="primary"
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
            ) : (
              <Button
                color="primary"
                isLoading={createMutation.isPending || updateMutation.isPending}
                onPress={handleSubmit}
              >
                {selectedDetalle ? "Actualizar" : "Crear"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmación eliminar planificación */}
      <Modal isOpen={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3 className="text-lg font-semibold">
                  Eliminar planificación
                </h3>
                <p className="text-sm text-default-500">
                  ¿Estás seguro de eliminar esta planificación?
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="text-sm">
                  Esta acción no se puede deshacer desde esta pantalla.
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2">
                  <Button variant="light" onPress={() => onClose()}>
                    Cancelar
                  </Button>
                  <Button
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-3">
                <BookOpen className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-default-500">
                  Total Planificaciones
                </p>
                <p className="text-2xl font-bold">
                  {planificacionesList?.length || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-100 p-3">
                <Calendar className="text-success" size={24} />
              </div>
              <div>
                <p className="text-sm text-default-500">Este Mes</p>
                <p className="text-2xl font-bold">
                  {planificacionesList?.filter((p) => {
                    const fecha = new Date(p.fecha_clase);
                    const hoy = new Date();

                    return (
                      fecha.getMonth() === hoy.getMonth() &&
                      fecha.getFullYear() === hoy.getFullYear()
                    );
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning-100 p-3">
                <Clock className="text-warning" size={24} />
              </div>
              <div>
                <p className="text-sm text-default-500">Próximas 7 Días</p>
                <p className="text-2xl font-bold">
                  {planificacionesList?.filter((p) => {
                    const fecha = new Date(p.fecha_clase);
                    const hoy = new Date();
                    const siete = new Date();

                    siete.setDate(hoy.getDate() + 7);

                    return fecha >= hoy && fecha <= siete;
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

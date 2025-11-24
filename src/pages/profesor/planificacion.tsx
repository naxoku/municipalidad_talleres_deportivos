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
  FileText,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/auth";
import {
  detalleClaseApi,
  DetalleClaseForm,
  DetalleClase,
} from "@/api/detalle_clase";
import { profesorApi } from "@/api/profesor";
import { horariosApi } from "@/api/horarios";

export default function ProfesorPlanificacionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaller, setSelectedTaller] = useState<string>("");
  const [selectedDetalle, setSelectedDetalle] = useState<DetalleClase | null>(
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
      toast.success("Planificación creada exitosamente");
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Error al crear planificación",
      );
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
      toast.success("Planificación actualizada exitosamente");
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Error al actualizar planificación",
      );
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
      toast.success("Planificación eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Error al eliminar planificación",
      );
    },
  });

  const filteredPlanificaciones = useMemo(() => {
    if (!planificaciones) return [];

    return planificaciones.filter((p) => {
      const matchesSearch =
        p.taller_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.objetivo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fecha_clase.includes(searchQuery);

      const matchesTaller =
        !selectedTaller || p.taller_id.toString() === selectedTaller;

      return matchesSearch && matchesTaller;
    });
  }, [planificaciones, searchQuery, selectedTaller]);

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
  };

  const handleCreate = () => {
    resetForm();
    onOpen();
  };

  const handleEdit = (detalle: DetalleClase) => {
    setSelectedDetalle(detalle);
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

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta planificación?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (!formData.horario_id || !formData.taller_id || !formData.fecha_clase) {
      toast.error("Por favor completa los campos requeridos");

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
          {talleres?.map((taller) => (
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
          filteredPlanificaciones.map((detalle) => (
            <Card key={detalle.id} className="border-l-4 border-l-primary">
              <CardHeader className="flex-col items-start gap-2">
                <div className="flex w-full items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold">{detalle.taller_nombre}</h3>
                    <p className="text-xs text-default-400 capitalize">
                      {detalle.dia_semana} {detalle.hora_inicio} -{" "}
                      {detalle.hora_fin}
                    </p>
                  </div>
                  <Chip color="primary" size="sm" variant="flat">
                    {new Date(detalle.fecha_clase).toLocaleDateString("es-CL")}
                  </Chip>
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
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => handleDelete(detalle.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Modal Create/Edit */}
      <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {selectedDetalle ? "Editar" : "Nueva"} Planificación
          </ModalHeader>
          <ModalBody className="gap-4">
            {/* Taller Select */}
            <Select
              isRequired
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
              {talleres?.map((taller) => (
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
              isDisabled={!formData.taller_id}
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
                  // use 'key' + textValue for selection; value prop isn't supported by the Listbox item
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
              label="Fecha de la Clase"
              startContent={<Calendar size={18} />}
              type="date"
              value={formData.fecha_clase}
              onChange={(e) =>
                setFormData({ ...formData, fecha_clase: e.target.value })
              }
            />

            {/* Objetivo */}
            <Textarea
              label="Objetivo de la Clase"
              minRows={2}
              placeholder="Describe el objetivo principal de la clase..."
              startContent={<Target size={18} />}
              value={formData.objetivo}
              onChange={(e) =>
                setFormData({ ...formData, objetivo: e.target.value })
              }
            />

            {/* Actividades */}
            <Textarea
              label="Actividades"
              minRows={3}
              placeholder="Lista las actividades y ejercicios a realizar..."
              startContent={<ListChecks size={18} />}
              value={formData.actividades}
              onChange={(e) =>
                setFormData({ ...formData, actividades: e.target.value })
              }
            />

            {/* Observaciones */}
            <Textarea
              label="Observaciones"
              minRows={2}
              placeholder="Notas adicionales, materiales necesarios, etc..."
              startContent={<FileText size={18} />}
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
              onPress={handleSubmit}
            >
              {selectedDetalle ? "Actualizar" : "Crear"}
            </Button>
          </ModalFooter>
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
                  {planificaciones?.length || 0}
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
                  {planificaciones?.filter((p) => {
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
                  {planificaciones?.filter((p) => {
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

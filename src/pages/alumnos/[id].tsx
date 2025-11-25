import {
  Button,
  Input,
  Card,
  CardBody,
  Spinner,
  Chip,
  Select,
  SelectItem,
  Textarea,
  DatePicker,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Pause,
  Archive,
  Trash2,
  BookOpen,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { parseDate } from "@internationalized/date";

import { inscripcionesFeatureApi as inscripcionesApi } from "@/features/inscripciones/api";
import { talleresFeatureApi as talleresApi } from "@/features/talleres/api";
import { alumnosFeatureApi as alumnosApi } from "@/features/alumnos/api";
import { Alumno } from "@/types/schema";

export default function AlumnoViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Alumno>>({});

  const {
    data: alumno,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["alumno", id],
    queryFn: () => alumnosApi.getById(Number(id)),
    enabled: !!id,
  });

  // Query para talleres inscritos
  const {
    data: talleresInscritos,
    isLoading: isLoadingTalleres,
    error: errorTalleres,
  } = useQuery({
    queryKey: ["alumno-talleres", id],
    queryFn: () => alumnosApi.getTalleres(Number(id)),
    enabled: !!id,
  });

  const [selectedInscripcion, setSelectedInscripcion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHorarioId, setSelectedHorarioId] = useState<number | null>(
    null,
  );
  const [selectedTallerId, setSelectedTallerId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [inscripcionToDelete, setInscripcionToDelete] = useState<number | null>(
    null,
  );
  const [isDeleteAlumnoOpen, setIsDeleteAlumnoOpen] = useState(false);

  // Query para asistencia
  const { data: asistencia, isLoading: isLoadingAsistencia } = useQuery({
    queryKey: ["alumno-asistencia", id],
    queryFn: () => alumnosApi.getAsistencia(Number(id)),
    enabled: !!id,
  });

  // Initialize form data when alumno loads
  useEffect(() => {
    if (alumno) {
      setFormData(alumno);
    }
  }, [alumno]);

  // Debug: log talleresInscritos
  useEffect(() => {
    if (talleresInscritos) {
      // console.debug("talleresInscritos:", talleresInscritos);
    }
  }, [talleresInscritos]);

  useEffect(() => {
    if (isModalOpen && selectedInscripcion) {
      const tallerId =
        selectedInscripcion.taller?.id ||
        selectedInscripcion.horario?.taller_id ||
        selectedInscripcion.taller_id ||
        null;

      setSelectedTallerId(tallerId);
      setSelectedHorarioId(selectedInscripcion.horario_id || null);
    } else if (!isModalOpen) {
      setSelectedTallerId(null);
      setSelectedHorarioId(null);
    }
  }, [isModalOpen, selectedInscripcion]);

  // Horarios for the selected taller (used in edit modal)
  const { data: horariosOptions, isLoading: isLoadingHorarios } = useQuery({
    queryKey: ["horarios-taller", selectedTallerId],
    queryFn: () =>
      selectedTallerId
        ? talleresApi.getHorarios(selectedTallerId)
        : Promise.resolve([]),
    enabled: !!selectedTallerId,
  });

  useEffect(() => {
    // console.debug(
    //   "selectedTallerId:",
    //   selectedTallerId,
    //   "selectedHorarioId:",
    //   selectedHorarioId,
    //   "horariosOptions:",
    //   horariosOptions,
    // );
  }, [selectedTallerId, selectedHorarioId, horariosOptions]);

  // After horariosOptions loads, ensure selectedHorarioId is picked if it's present in inscripcion
  useEffect(() => {
    if (!horariosOptions || !selectedInscripcion) return;
    const candidate =
      selectedInscripcion.horario?.id || selectedInscripcion.horario_id || null;

    if (
      candidate &&
      (!selectedHorarioId || Number(selectedHorarioId) !== Number(candidate))
    ) {
      if (
        horariosOptions.some((h: any) => Number(h.id) === Number(candidate))
      ) {
        setSelectedHorarioId(Number(candidate));
      }
    }
  }, [horariosOptions, selectedInscripcion]);

  // All talleres list (for edit modal taller select)
  const { data: talleresOptions, isLoading: isLoadingTalleresList } = useQuery({
    queryKey: ["talleres-list"],
    queryFn: () => talleresApi.getAll(),
  });

  useEffect(() => {
    if (talleresOptions) {
      // console.debug("talleresOptions:", talleresOptions?.length);
    }
  }, [talleresOptions]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Alumno>) => alumnosApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumno", id] });
      queryClient.invalidateQueries({ queryKey: ["alumnos"] });
      setEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => alumnosApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumnos"] });
      navigate("/alumnos");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(alumno || {});
    setEditMode(false);
  };

  const handlePause = () => {
    // Implement pause logic
    // console.log("Pause alumno", id);
  };

  const handleArchive = () => {
    // Implement archive logic
    // console.log("Archive alumno", id);
  };

  const handleDelete = () => {
    // Abrir modal de confirmación en vez de usar confirm()
    setIsDeleteAlumnoOpen(true);
  };

  const inscripcionUpdateMutation = useMutation({
    mutationFn: ({
      inscripcionId,
      horarioId,
      tallerId,
    }: {
      inscripcionId: number;
      horarioId?: number;
      tallerId?: number;
    }) =>
      inscripcionesApi.actualizar(inscripcionId, {
        ...(horarioId ? { horario_id: horarioId } : {}),
        ...(tallerId ? { taller_id: tallerId } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumno-talleres", id] });
      queryClient.invalidateQueries({ queryKey: ["alumno-asistencia", id] });
    },
  });

  const inscripcionDeleteMutation = useMutation({
    mutationFn: (inscripcionId: number) =>
      inscripcionesApi.eliminar(inscripcionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumno-talleres", id] });
      queryClient.invalidateQueries({ queryKey: ["alumno-asistencia", id] });
    },
  });

  // Helper function to convert date string to DateValue
  const parseDateValue = (dateString: string | undefined) => {
    if (!dateString) return undefined;
    try {
      return parseDate(dateString);
    } catch {
      return undefined;
    }
  };

  // Helper function to convert DateValue to string
  const formatDateValue = (dateValue: any) => {
    if (!dateValue) return "";

    return dateValue.toString();
  };

  // Determine if modal values differ from original inscripcion
  const modalHasChanges =
    !!selectedInscripcion &&
    ((selectedHorarioId != null &&
      selectedHorarioId !== (selectedInscripcion.horario_id || null)) ||
      (selectedTallerId != null &&
        selectedTallerId !==
          (selectedInscripcion.taller?.id ||
            selectedInscripcion.taller_id ||
            null)));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Cargando alumno..." />
      </div>
    );
  }

  if (error || !alumno) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar el alumno
        </h3>
        <p className="text-sm text-default-500">
          No se pudo encontrar el alumno solicitado.
        </p>
        <Button
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onPress={() => navigate("/alumnos")}
        >
          Volver a alumnos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            aria-label="Volver a la lista de alumnos"
            variant="light"
            onPress={() => navigate("/alumnos")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {alumno.nombre} {alumno.apellidos}
            </h1>
            <p className="text-default-500">RUT: {alumno.rut}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            startContent={<Pause size={16} />}
            variant="flat"
            onPress={handlePause}
          >
            Pausar
          </Button>
          <Button
            startContent={<Archive size={16} />}
            variant="flat"
            onPress={handleArchive}
          >
            Archivar
          </Button>
          <Button
            color="danger"
            isLoading={deleteMutation.isPending}
            startContent={<Trash2 size={16} />}
            onPress={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex w-full flex-col">
        <Tabs
          aria-label="Información del alumno"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "flex-1 px-0 h-12 justify-center",
            tabContent: "group-data-[selected=true]:text-primary",
          }}
          color="primary"
          variant="underlined"
        >
          <Tab
            key="info"
            title={
              <div className="flex items-center space-x-2">
                <Info size={18} />
                <span>Información personal</span>
              </div>
            }
          >
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Información del alumno
                </h3>
                <div className="flex gap-2">
                  {!editMode ? (
                    <Button
                      color="primary"
                      startContent={<Edit size={16} />}
                      onPress={() => setEditMode(true)}
                    >
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button
                        color="primary"
                        isLoading={updateMutation.isPending}
                        startContent={<Save size={16} />}
                        onPress={handleSave}
                      >
                        Guardar
                      </Button>
                      <Button
                        startContent={<X size={16} />}
                        variant="flat"
                        onPress={handleCancel}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Card>
                <CardBody className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="nombres-input"
                      >
                        Nombres
                      </label>
                      <Input
                        isRequired
                        id="nombres-input"
                        isDisabled={!editMode}
                        value={formData.nombre || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, nombre: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="apellidos-input"
                      >
                        Apellidos
                      </label>
                      <Input
                        isRequired
                        id="apellidos-input"
                        isDisabled={!editMode}
                        value={formData.apellidos || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, apellidos: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="rut-input"
                      >
                        RUT
                      </label>
                      <Input
                        isRequired
                        id="rut-input"
                        isDisabled={!editMode}
                        value={formData.rut || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, rut: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="genero-select"
                      >
                        Género
                      </label>
                      <Select
                        aria-label="Seleccionar género"
                        id="genero-select"
                        isDisabled={!editMode}
                        selectedKeys={formData.genero ? [formData.genero] : []}
                        onSelectionChange={(keys) =>
                          setFormData({
                            ...formData,
                            genero: Array.from(keys)[0] as string,
                          })
                        }
                      >
                        <SelectItem key="M">Masculino</SelectItem>
                        <SelectItem key="F">Femenino</SelectItem>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="fecha-nacimiento-picker"
                      >
                        Fecha de nacimiento
                      </label>
                      <DatePicker
                        aria-label="Seleccionar fecha de nacimiento"
                        id="fecha-nacimiento-picker"
                        isDisabled={!editMode}
                        value={parseDateValue(formData.fecha_nacimiento)}
                        onChange={(date) =>
                          setFormData({
                            ...formData,
                            fecha_nacimiento: formatDateValue(date),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="telefono-input"
                      >
                        Teléfono
                      </label>
                      <Input
                        id="telefono-input"
                        isDisabled={!editMode}
                        value={formData.telefono || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, telefono: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="telefono-emergencia-input"
                      >
                        Teléfono de emergencia
                      </label>
                      <Input
                        id="telefono-emergencia-input"
                        isDisabled={!editMode}
                        value={formData.telefono_emergencia || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            telefono_emergencia: value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="correo-electronico-input"
                      >
                        Correo electrónico
                      </label>
                      <Input
                        id="correo-electronico-input"
                        isDisabled={!editMode}
                        type="email"
                        value={formData.correo_electronico || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            correo_electronico: value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="direccion-input"
                      >
                        Dirección
                      </label>
                      <Input
                        id="direccion-input"
                        isDisabled={!editMode}
                        value={formData.direccion || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, direccion: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="colegio-input"
                      >
                        Colegio
                      </label>
                      <Input
                        id="colegio-input"
                        isDisabled={!editMode}
                        value={formData.colegio || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, colegio: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="curso-input"
                      >
                        Curso
                      </label>
                      <Input
                        id="curso-input"
                        isDisabled={!editMode}
                        value={formData.curso || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, curso: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="tutor-nombre-input"
                      >
                        Tutor nombre
                      </label>
                      <Input
                        id="tutor-nombre-input"
                        isDisabled={!editMode}
                        value={formData.tutor_nombre || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tutor_nombre: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="tutor-telefono-input"
                      >
                        Tutor teléfono
                      </label>
                      <Input
                        id="tutor-telefono-input"
                        isDisabled={!editMode}
                        value={formData.tutor_telefono || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tutor_telefono: value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="autorizacion-imagenes-select"
                      >
                        Autorización de imágenes
                      </label>
                      <Select
                        aria-label="Seleccionar autorización de imágenes"
                        id="autorizacion-imagenes-select"
                        isDisabled={!editMode}
                        selectedKeys={
                          formData.autorizo_imagenes !== undefined
                            ? [formData.autorizo_imagenes ? "si" : "no"]
                            : []
                        }
                        onSelectionChange={(keys) =>
                          setFormData({
                            ...formData,
                            autorizo_imagenes: Array.from(keys)[0] === "si",
                          })
                        }
                      >
                        <SelectItem key="si">Sí</SelectItem>
                        <SelectItem key="no">No</SelectItem>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="notificaciones-moviles-select"
                      >
                        Notificaciones móviles
                      </label>
                      <Select
                        aria-label="Seleccionar notificaciones móviles"
                        id="notificaciones-moviles-select"
                        isDisabled={!editMode}
                        selectedKeys={
                          formData.notificaciones_movil !== undefined
                            ? [formData.notificaciones_movil ? "si" : "no"]
                            : []
                        }
                        onSelectionChange={(keys) =>
                          setFormData({
                            ...formData,
                            notificaciones_movil: Array.from(keys)[0] === "si",
                          })
                        }
                      >
                        <SelectItem key="si">Sí</SelectItem>
                        <SelectItem key="no">No</SelectItem>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="observaciones-textarea"
                    >
                      Observaciones
                    </label>
                    <Textarea
                      id="observaciones-textarea"
                      isDisabled={!editMode}
                      minRows={3}
                      placeholder="Observaciones adicionales..."
                      value={formData.observaciones || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, observaciones: value })
                      }
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab
            key="talleres"
            title={
              <div className="flex items-center space-x-2">
                <BookOpen size={18} />
                <span>Talleres</span>
              </div>
            }
          >
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Talleres inscritos</h3>
              </div>
              {errorTalleres ? (
                <div className="text-center py-8 text-danger">
                  <p className="font-medium">Error al cargar talleres</p>
                  <p className="text-sm">{String(errorTalleres)}</p>
                </div>
              ) : isLoadingTalleres ? (
                <div className="flex justify-center py-8">
                  <Spinner label="Cargando talleres..." />
                </div>
              ) : talleresInscritos && talleresInscritos.length > 0 ? (
                <Table aria-label="Talleres inscritos">
                  <TableHeader>
                    <TableColumn>NOMBRE</TableColumn>
                    <TableColumn>PROFESOR</TableColumn>
                    <TableColumn>HORARIO</TableColumn>
                    <TableColumn>UBICACIÓN</TableColumn>
                    <TableColumn>INSCRIPCIÓN</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                    <TableColumn>ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {talleresInscritos.map(
                      (inscripcion: any, index: number) => (
                        <TableRow
                          key={`inscripcion-${inscripcion.id || index}`}
                        >
                          <TableCell>
                            <div className="font-medium">
                              <Link
                                to={`/talleres/${inscripcion.taller?.id || inscripcion.horario?.taller_id || inscripcion.taller_id}`}
                              >
                                {inscripcion.horario?.taller?.nombre ||
                                  inscripcion.taller?.nombre ||
                                  `Taller ${inscripcion.taller_id || inscripcion.horario?.taller_id || ""}`}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell>
                            {inscripcion.horario?.profesor?.nombre ||
                              inscripcion.profesor?.nombre ||
                              "Sin asignar"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {inscripcion.horario?.dia_semana
                                ? `${inscripcion.horario.dia_semana} ${inscripcion.horario.hora_inicio}-${inscripcion.horario.hora_fin}`
                                : inscripcion.dia_semana
                                  ? `${inscripcion.dia_semana} ${inscripcion.hora_inicio}-${inscripcion.hora_fin}`
                                  : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {inscripcion.horario?.ubicacion?.nombre ||
                                inscripcion.ubicacion?.nombre ||
                                ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {inscripcion.fecha_inscripcion
                                ? new Date(
                                    inscripcion.fecha_inscripcion,
                                  ).toLocaleDateString("es-ES")
                                : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip color="success" size="sm" variant="flat">
                              Activo
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                startContent={<Edit size={14} />}
                                variant="flat"
                                onPress={() => {
                                  setSelectedInscripcion(inscripcion);
                                  const horarioInitial =
                                    inscripcion.horario?.id ||
                                    inscripcion.horario_id ||
                                    null;

                                  setSelectedHorarioId(horarioInitial);
                                  const tallerId =
                                    inscripcion.taller?.id ||
                                    inscripcion.horario?.taller_id ||
                                    inscripcion.taller_id ||
                                    null;

                                  setSelectedTallerId(tallerId);
                                  setIsModalOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                color="danger"
                                startContent={<Trash2 size={14} />}
                                variant="flat"
                                onPress={() => {
                                  setInscripcionToDelete(inscripcion.id);
                                  setIsConfirmOpen(true);
                                }}
                              >
                                Desasignar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-default-500">
                  <BookOpen className="mx-auto mb-4 opacity-50" size={48} />
                  <p>No hay talleres inscritos aún</p>
                  <p className="text-sm">
                    Los talleres inscritos aparecerán aquí
                  </p>
                </div>
              )}
            </div>
          </Tab>

          <Tab
            key="asistencia"
            title={
              <div className="flex items-center space-x-2">
                <ClipboardCheck size={18} />
                <span>Asistencia</span>
              </div>
            }
          >
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Historial de asistencia
                </h3>
              </div>
              {isLoadingAsistencia ? (
                <div className="flex justify-center py-8">
                  <Spinner label="Cargando asistencia..." />
                </div>
              ) : asistencia && asistencia.length > 0 ? (
                <Table aria-label="Historial de asistencia">
                  <TableHeader>
                    <TableColumn>FECHA</TableColumn>
                    <TableColumn>TALLER</TableColumn>
                    <TableColumn>HORARIO</TableColumn>
                    <TableColumn>ASISTENCIA</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {asistencia.map((registro: any) => (
                      <TableRow key={`${registro.id}`}>
                        <TableCell>
                          {new Date(registro.fecha).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell>
                          {registro.horario?.taller?.nombre ||
                            `Taller ${registro.horario?.taller_id}`}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {registro.horario?.dia_semana}{" "}
                            {registro.horario?.hora_inicio}-
                            {registro.horario?.hora_fin}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={registro.presente ? "success" : "danger"}
                            size="sm"
                            variant="flat"
                          >
                            {registro.presente ? "Presente" : "Ausente"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-default-500">
                  <ClipboardCheck
                    className="mx-auto mb-4 opacity-50"
                    size={48}
                  />
                  <p>No hay registros de asistencia</p>
                  <p className="text-sm">
                    El historial de asistencia aparecerá aquí
                  </p>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
        {/* Edit inscription modal */}
        <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <h3 className="text-lg font-semibold">Editar inscripción</h3>
                  <p className="text-sm text-default-500">
                    Modificar horario o desasignar alumno
                  </p>
                </ModalHeader>
                <ModalBody>
                  {selectedInscripcion ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor="modal-taller-select"
                        >
                          Taller
                        </label>
                        {isLoadingTalleresList ? (
                          <Spinner label="Cargando talleres..." />
                        ) : (
                          <Select
                            aria-label="Seleccionar taller"
                            id="modal-taller-select"
                            isDisabled={isLoadingTalleresList}
                            selectedKeys={
                              selectedTallerId ? [String(selectedTallerId)] : []
                            }
                            onSelectionChange={(keys) => {
                              const newTallerId = Number(Array.from(keys)[0]);

                              setSelectedTallerId(newTallerId);
                              setSelectedHorarioId(null);
                            }}
                          >
                            {(talleresOptions || []).map((t: any) => (
                              <SelectItem key={String(t.id)}>
                                {t.nombre}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor="modal-horario-select"
                        >
                          Horario
                        </label>
                        {isLoadingHorarios || !selectedTallerId ? (
                          <Spinner label="Cargando horarios..." />
                        ) : (
                          <Select
                            aria-label="Seleccionar horario"
                            id="modal-horario-select"
                            isDisabled={
                              !selectedTallerId ||
                              isLoadingHorarios ||
                              !horariosOptions?.length
                            }
                            selectedKeys={
                              selectedHorarioId
                                ? [String(selectedHorarioId)]
                                : []
                            }
                            onSelectionChange={(keys) =>
                              setSelectedHorarioId(Number(Array.from(keys)[0]))
                            }
                          >
                            {(horariosOptions || []).map((h: any) => (
                              <SelectItem key={String(h.id)}>
                                {h.dia_semana} {h.hora_inicio}-{h.hora_fin}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>No hay inscripción seleccionada</div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <div className="flex gap-2">
                    <Button
                      variant="light"
                      onPress={() => {
                        onClose();
                        setSelectedInscripcion(null);
                        setSelectedHorarioId(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={() => {
                        if (selectedInscripcion) {
                          setInscripcionToDelete(selectedInscripcion.id);
                          setIsConfirmOpen(true);
                        }
                      }}
                    >
                      Desasignar
                    </Button>
                    <Button
                      color="primary"
                      isDisabled={!modalHasChanges}
                      isLoading={inscripcionUpdateMutation.isPending}
                      startContent={<Save size={16} />}
                      onPress={() => {
                        if (!selectedInscripcion) return;
                        inscripcionUpdateMutation.mutate(
                          {
                            inscripcionId: selectedInscripcion.id,
                            horarioId: selectedHorarioId || undefined,
                            tallerId: selectedTallerId || undefined,
                          },
                          {
                            onSuccess: () => {
                              onClose();
                              setSelectedInscripcion(null);
                              setSelectedHorarioId(null);
                            },
                          },
                        );
                      }}
                    >
                      Guardar cambios
                    </Button>
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* Confirmación eliminar alumno */}
        <Modal isOpen={isDeleteAlumnoOpen} onOpenChange={setIsDeleteAlumnoOpen}>
          <ModalContent>
            {(onCloseConfirm) => (
              <>
                <ModalHeader>
                  <h3 className="text-lg font-semibold">Eliminar alumno</h3>
                  <p className="text-sm text-default-500">
                    ¿Estás seguro de que quieres eliminar este alumno? Esta
                    acción no se puede deshacer.
                  </p>
                </ModalHeader>
                <ModalBody>
                  <div className="text-sm">
                    Si confirmas, el alumno será eliminado y no podrás
                    recuperarlo desde esta interfaz.
                  </div>
                </ModalBody>
                <ModalFooter>
                  <div className="flex gap-2">
                    <Button variant="light" onPress={() => onCloseConfirm()}>
                      Cancelar
                    </Button>
                    <Button
                      color="danger"
                      isLoading={deleteMutation.isPending}
                      onPress={() => {
                        deleteMutation.mutate(undefined, {
                          onSuccess: () => {
                            onCloseConfirm();
                            setIsDeleteAlumnoOpen(false);
                          },
                        });
                      }}
                    >
                      Eliminar alumno
                    </Button>
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* Confirm Desasignar modal */}
        <Modal isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <ModalContent>
            {(onCloseConfirm) => (
              <>
                <ModalHeader>
                  <h3 className="text-lg font-semibold">
                    Desasignar inscripción
                  </h3>
                  <p className="text-sm text-default-500">
                    ¿Estás seguro de desasignar al alumno de este taller?
                  </p>
                </ModalHeader>
                <ModalBody>
                  <div className="text-sm">
                    Esta acción eliminará la inscripción y no podrá revertirse
                    desde esta pantalla.
                  </div>
                </ModalBody>
                <ModalFooter>
                  <div className="flex gap-2">
                    <Button
                      variant="light"
                      onPress={() => {
                        onCloseConfirm();
                        setInscripcionToDelete(null);
                        setIsConfirmOpen(false);
                        setSelectedInscripcion(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="danger"
                      isLoading={inscripcionDeleteMutation.isPending}
                      onPress={() => {
                        if (inscripcionToDelete) {
                          inscripcionDeleteMutation.mutate(
                            inscripcionToDelete,
                            {
                              onSuccess: () => {
                                onCloseConfirm();
                                setInscripcionToDelete(null);
                                setIsConfirmOpen(false);
                                setSelectedInscripcion(null);
                                setSelectedHorarioId(null);
                              },
                            },
                          );
                        }
                      }}
                    >
                      Desasignar
                    </Button>
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

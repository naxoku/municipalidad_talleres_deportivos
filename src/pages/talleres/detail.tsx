import { useParams } from "react-router-dom";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  User,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Divider,
  Spinner,
} from "@heroui/react";
import {
  Calendar as CalendarIcon,
  Users,
  ClipboardCheck,
  Info,
  Plus,
  Trash2,
  Clock,
  MapPin,
  CalendarDays,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { talleresFeatureApi as talleresApi } from "@/features/talleres/api";

export default function TallerDetailPage() {
  const { id } = useParams();
  const tallerId = Number(id);
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<any>>({});
  const {
    isOpen: isHorarioOpen,
    onOpen: onHorarioOpen,
    onOpenChange: onHorarioOpenChange,
  } = useDisclosure();
  const {
    isOpen: isInscribirOpen,
    onOpen: onInscribirOpen,
    onOpenChange: onInscribirOpenChange,
  } = useDisclosure();

  // --- Queries ---
  const { data: taller, isLoading: isLoadingTaller } = useQuery({
    queryKey: ["taller", tallerId],
    queryFn: () => talleresApi.getById(tallerId),
    enabled: !!tallerId,
  });

  const { data: horarios } = useQuery({
    queryKey: ["taller_horarios", tallerId],
    queryFn: () => talleresApi.getHorarios(tallerId),
    enabled: !!tallerId,
  });

  const { data: alumnos } = useQuery({
    queryKey: ["taller_alumnos", tallerId],
    queryFn: () => talleresApi.getAlumnos(tallerId),
    enabled: !!tallerId,
  });

  const { data: clases } = useQuery({
    queryKey: ["taller_clases", tallerId],
    queryFn: () => talleresApi.getClases(tallerId),
    enabled: !!tallerId,
  });

  // Initialize form data when taller loads
  useEffect(() => {
    if (taller) {
      setFormData(taller);
    }
  }, [taller]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<any>) => talleresApi.update(tallerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taller", tallerId] });
      setEditMode(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(taller || {});
    setEditMode(false);
  };

  // Helper function to get profesor name
  const getProfesorName = (profesor: any) => {
    if (typeof profesor === "string") return profesor;
    if (profesor && typeof profesor === "object" && profesor.nombre)
      return profesor.nombre;

    return "Sin asignar";
  };

  if (isLoadingTaller) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando información del taller..." size="lg" />
      </div>
    );
  }

  if (!taller) {
    return <div className="text-center p-10">Taller no encontrado</div>;
  }

  // --- Render Functions ---

  const renderHorariosTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Horarios definidos</h3>
        <Button
          color="primary"
          endContent={<Plus size={16} />}
          size="sm"
          onPress={onHorarioOpen}
        >
          Agregar Horario
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {horarios?.map((h: any) => (
          <Card key={h.id} className="border border-default-200">
            <CardBody className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-primary" size={18} />
                  <span className="font-bold text-lg">
                    {h.dia_semana || h.dia}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-default-500 text-sm">
                  <Clock size={14} />
                  <span>
                    {h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-default-500 text-sm">
                  <MapPin size={14} />
                  <span>
                    {h.ubicacion_nombre || h.ubicacion || "Sin ubicación"}
                  </span>
                </div>
              </div>
              <Button
                isIconOnly
                aria-label="Eliminar horario"
                color="danger"
                size="sm"
                variant="light"
              >
                <Trash2 size={18} />
              </Button>
            </CardBody>
          </Card>
        )) || <p className="text-default-400">No hay horarios definidos.</p>}
      </div>
    </div>
  );

  const renderAlumnosTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Listado de Alumnos ({alumnos?.length || 0})
        </h3>
        <Button
          color="primary"
          endContent={<Plus size={16} />}
          size="sm"
          onPress={onInscribirOpen}
        >
          Inscribir Alumno
        </Button>
      </div>
      <Table aria-label="Tabla de alumnos inscritos">
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>RUT</TableColumn>
          <TableColumn>EDAD</TableColumn>
          <TableColumn align="end">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="No hay alumnos inscritos."
          items={alumnos || []}
        >
          {(alumno: any) => (
            <TableRow
              key={`inscripcion-${alumno.inscripcion_id || alumno.id || `${alumno.alumno_id}-${alumno.rut}` || Math.random()}`}
            >
              <TableCell>
                {alumno.nombre_completo || alumno.alumno_nombre || "Sin nombre"}
              </TableCell>
              <TableCell>{alumno.rut}</TableCell>
              <TableCell>
                {alumno.edad ||
                  new Date().getFullYear() -
                    new Date(alumno.fecha_nacimiento).getFullYear()}{" "}
                años
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button color="danger" size="sm" variant="light">
                    Dar de baja
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderAsistenciaTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-primary-50 p-4 rounded-xl border border-primary-100">
        <div>
          <h3 className="text-lg font-bold text-primary-900">Clase de Hoy</h3>
          <p className="text-primary-700 text-sm">
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Button color="primary" endContent={<ClipboardCheck />} size="lg">
          Tomar Asistencia
        </Button>
      </div>

      <Divider />

      <div>
        <h3 className="text-lg font-semibold mb-4">Historial de Clases</h3>
        <Table aria-label="Historial de clases">
          <TableHeader>
            <TableColumn>FECHA</TableColumn>
            <TableColumn>ASISTENCIA</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn align="end">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent="No hay clases registradas."
            items={clases || []}
          >
            {(clase: any) => (
              <TableRow
                key={`clase-${clase.id || clase.fecha || Math.random()}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="text-default-400" size={16} />
                    {new Date(clase.fecha).toLocaleDateString("es-CL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-small font-bold">
                      {clase.asistentes || 0}/{clase.total || 0}
                    </span>
                    <span className="text-tiny text-default-400">
                      Asistentes
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    color={clase.estado === "Realizada" ? "success" : "danger"}
                    size="sm"
                    variant="dot"
                  >
                    {clase.estado}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button size="sm" variant="light">
                      Ver detalle
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{taller.nombre}</h1>
            <Chip color={taller.activo ? "success" : "default"} variant="flat">
              {taller.activo ? "Activo" : "Inactivo"}
            </Chip>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex w-full flex-col">
        <Tabs
          aria-label="Opciones del Taller"
          className="w-full"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "flex-1 px-0 h-12",
            tabContent: "text-primary",
          }}
          color="primary"
          variant="underlined"
        >
          <Tab
            key="info"
            title={
              <div className="flex items-center space-x-2">
                <Info size={18} />
                <span>Información</span>
              </div>
            }
          >
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Información del taller
                </h3>
                <div className="flex gap-2">
                  {!editMode ? (
                    <Button
                      color="primary"
                      size="sm"
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
                        size="sm"
                        startContent={<Save size={16} />}
                        onPress={handleSave}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
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
                        htmlFor="nombre-taller-input"
                      >
                        Nombre del taller
                      </label>
                      <Input
                        id="nombre-taller-input"
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
                        htmlFor="profesor-input"
                      >
                        Profesor encargado
                      </label>
                      <Input
                        id="profesor-input"
                        isDisabled={!editMode}
                        value={getProfesorName(formData.profesor)}
                        onValueChange={(value) =>
                          setFormData({ ...formData, profesor: value })
                        }
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="descripcion-textarea"
                      >
                        Descripción
                      </label>
                      <Textarea
                        id="descripcion-textarea"
                        isDisabled={!editMode}
                        minRows={3}
                        value={formData.descripcion || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, descripcion: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="ubicacion-input"
                      >
                        Ubicación
                      </label>
                      <Input
                        id="ubicacion-input"
                        isDisabled={!editMode}
                        value={formData.ubicacion_principal || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            ubicacion_principal: value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Select
                        id="estado-select"
                        isDisabled={!editMode}
                        label="Estado del taller"
                        selectedKeys={
                          formData.activo
                            ? new Set(["activo"])
                            : new Set(["inactivo"])
                        }
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setFormData({
                            ...formData,
                            activo: selected === "activo",
                          });
                        }}
                      >
                        <SelectItem key="activo">
                          Activo para inscripciones
                        </SelectItem>
                        <SelectItem key="inactivo">Inactivo</SelectItem>
                      </Select>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab
            key="horarios"
            title={
              <div className="flex items-center space-x-2">
                <CalendarIcon size={18} />
                <span>Horarios</span>
              </div>
            }
          >
            <div className="mt-4">{renderHorariosTab()}</div>
          </Tab>

          <Tab
            key="alumnos"
            title={
              <div className="flex items-center space-x-2">
                <Users size={18} />
                <span>Alumnos</span>
              </div>
            }
          >
            <div className="mt-4">{renderAlumnosTab()}</div>
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
            <div className="mt-4">{renderAsistenciaTab()}</div>
          </Tab>
        </Tabs>
      </div>

      {/* --- Modals --- */}

      {/* Modal Agregar Horario */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isHorarioOpen}
        placement="center"
        onOpenChange={onHorarioOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Agregar Nuevo Horario
              </ModalHeader>
              <ModalBody>
                <Select label="Día de la semana" variant="bordered">
                  <SelectItem key="lunes">Lunes</SelectItem>
                  <SelectItem key="martes">Martes</SelectItem>
                  <SelectItem key="miércoles">Miércoles</SelectItem>
                  <SelectItem key="jueves">Jueves</SelectItem>
                  <SelectItem key="viernes">Viernes</SelectItem>
                  <SelectItem key="sábado">Sábado</SelectItem>
                </Select>
                <div className="flex gap-2">
                  <Input label="Hora Inicio" type="time" variant="bordered" />
                  <Input label="Hora Fin" type="time" variant="bordered" />
                </div>
                <Input
                  label="Ubicación Específica"
                  placeholder="Ej: Cancha 2"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  className="shadow-lg shadow-primary/40"
                  color="primary"
                  onPress={onClose}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Inscribir Alumno */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isInscribirOpen}
        placement="center"
        onOpenChange={onInscribirOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Inscribir Alumno
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Buscar Alumno"
                  placeholder="Buscar por nombre o RUT..."
                  startContent={<Users className="text-default-400" />}
                  variant="bordered"
                />
                <div className="max-h-[200px] overflow-y-auto border rounded-medium p-2 space-y-2">
                  {/* Mock search results */}
                  <div className="flex items-center justify-between p-2 hover:bg-default-100 rounded-lg cursor-pointer transition-colors">
                    <User description="12.345.678-9" name="Juanito Pérez" />
                    <Button color="primary" size="sm" variant="flat">
                      Seleccionar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 hover:bg-default-100 rounded-lg cursor-pointer transition-colors">
                    <User description="21.987.654-3" name="Maria González" />
                    <Button color="primary" size="sm" variant="flat">
                      Seleccionar
                    </Button>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

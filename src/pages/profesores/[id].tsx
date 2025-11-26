import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
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
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

import { profesoresFeatureApi as profesoresApi } from "@/features/profesores/api";
import { Profesor } from "@/types/schema";

export default function ProfesorDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profesorId = Number(id);
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Profesor>>({});
  const {
    isOpen: isTallerOpen,
    onOpen: onTallerOpen,
    onOpenChange: onTallerOpenChange,
  } = useDisclosure();

  // --- Queries ---
  const { data: profesor, isLoading: isLoadingProfesor } = useQuery({
    queryKey: ["profesor", profesorId],
    queryFn: () => profesoresApi.getById(profesorId),
    enabled: !!profesorId,
  });

  const { data: talleres } = useQuery({
    queryKey: ["profesor_talleres", profesorId],
    queryFn: () => profesoresApi.getTalleres(profesorId),
    enabled: !!profesorId,
  });

  // Normalizar respuesta de talleres
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

  const { data: horarios } = useQuery({
    queryKey: ["profesor_horarios", profesorId],
    queryFn: () => profesoresApi.getHorarios(profesorId),
    enabled: !!profesorId,
  });

  const { data: alumnos } = useQuery({
    queryKey: ["profesor_alumnos", profesorId],
    queryFn: () => profesoresApi.getAlumnos(profesorId),
    enabled: !!profesorId,
  });

  const { data: clases } = useQuery({
    queryKey: ["profesor_clases", profesorId],
    queryFn: () => profesoresApi.getClases(profesorId),
    enabled: !!profesorId,
  });

  // Initialize form data when profesor loads
  useEffect(() => {
    if (profesor) {
      setFormData(profesor);
    }
  }, [profesor]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Profesor>) =>
      profesoresApi.update(profesorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesor", profesorId] });
      setEditMode(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(profesor || {});
    setEditMode(false);
  };

  if (isLoadingProfesor) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando información del profesor..." size="lg" />
      </div>
    );
  }

  if (!profesor) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar el profesor
        </h3>
        <p className="text-sm text-default-500">
          No se pudo encontrar el profesor solicitado.
        </p>
        <Button
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onPress={() => navigate("/profesores")}
        >
          Volver a Profesores
        </Button>
      </div>
    );
  }

  // --- Render Functions ---

  const renderTalleresTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Talleres asignados</h3>
        <Button
          color="primary"
          endContent={<Plus size={16} />}
          size="sm"
          onPress={onTallerOpen}
        >
          Asignar Taller
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {talleresList?.map((t: any) => (
          <Card key={t.id} className="border border-default-200">
            <CardBody className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-primary" size={18} />
                  <span className="font-bold text-lg">{t.nombre}</span>
                </div>
                <div className="text-default-500 text-sm">
                  {t.descripcion || "Sin descripción"}
                </div>
                <div className="flex items-center gap-2 text-default-500 text-sm">
                  <Users size={14} />
                  <span>{t.alumnos_inscritos || 0} alumnos</span>
                </div>
              </div>
              <Button
                isIconOnly
                aria-label="Desasignar taller"
                color="danger"
                size="sm"
                variant="light"
              >
                <Trash2 size={18} />
              </Button>
            </CardBody>
          </Card>
        )) || <p className="text-default-400">No hay talleres asignados.</p>}
      </div>
    </div>
  );

  const renderHorariosTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Horarios asignados</h3>
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
                    {h.ubicacion?.nombre || h.ubicacion || "Sin ubicación"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-default-500 text-sm">
                  <BookOpen size={14} />
                  <span>{h.taller?.nombre || h.taller || "Sin taller"}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        )) || <p className="text-default-400">No hay horarios asignados.</p>}
      </div>
    </div>
  );

  const renderAlumnosTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Alumnos de talleres impartidos ({alumnos?.length || 0})
        </h3>
      </div>
      <Table aria-label="Tabla de alumnos">
        <TableHeader>
          <TableColumn>ALUMNO</TableColumn>
          <TableColumn>RUT</TableColumn>
          <TableColumn>TALLER</TableColumn>
          <TableColumn>ESTADO</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="No hay alumnos inscritos."
          items={alumnos || []}
        >
          {(alumno: any) => (
            <TableRow key={alumno.id || alumno.rut}>
              <TableCell>
                {alumno.nombre_completo || alumno.alumno_nombre || "Sin nombre"}
              </TableCell>
              <TableCell>{alumno.rut}</TableCell>
              <TableCell>{alumno.taller?.nombre || "Sin taller"}</TableCell>
              <TableCell>
                <Chip
                  color={alumno.estado === "Activo" ? "success" : "warning"}
                  size="sm"
                  variant="flat"
                >
                  {alumno.estado || "Activo"}
                </Chip>
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
          <h3 className="text-lg font-bold text-primary-900">Próxima Clase</h3>
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
            <TableColumn>TALLER</TableColumn>
            <TableColumn>ASISTENCIA</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn align="end">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent="No hay clases registradas."
            items={clases || []}
          >
            {(clase: any) => (
              <TableRow key={clase.id}>
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
                <TableCell>{clase.taller?.nombre || "Sin taller"}</TableCell>
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
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            aria-label="Volver a la lista de profesores"
            variant="light"
            onPress={() => navigate("/profesores")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold">{profesor.nombre}</h1>
          <Chip
            color={profesor.estado === "Activo" ? "success" : "default"}
            variant="flat"
          >
            {profesor.estado || "Activo"}
          </Chip>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex w-full flex-col">
        <Tabs
          aria-label="Opciones del Profesor"
          className="w-full"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "flex-1 px-0 h-12",
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
                <span>Información</span>
              </div>
            }
          >
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Información del profesor
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
                        htmlFor="nombre-input"
                      >
                        Nombre completo
                      </label>
                      <Input
                        id="nombre-input"
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
                        htmlFor="email-input"
                      >
                        Email
                      </label>
                      <Input
                        id="email-input"
                        isDisabled={!editMode}
                        type="email"
                        value={formData.email || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, email: value })
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
                        htmlFor="estado-select"
                      >
                        Estado
                      </label>
                      <Select
                        aria-label="Seleccionar estado"
                        className="w-full"
                        id="estado-select"
                        isDisabled={!editMode}
                        selectedKeys={formData.estado ? [formData.estado] : []}
                        onSelectionChange={(keys) =>
                          setFormData({
                            ...formData,
                            estado: Array.from(keys)[0] as string,
                          })
                        }
                      >
                        <SelectItem key="Activo">Activo</SelectItem>
                        <SelectItem key="Pausado">Pausado</SelectItem>
                        <SelectItem key="Archivado">Archivado</SelectItem>
                      </Select>
                    </div>
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
            <div className="mt-4">{renderTalleresTab()}</div>
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

      {/* Modal Asignar Taller */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isTallerOpen}
        placement="center"
        onOpenChange={onTallerOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Asignar Taller al Profesor
              </ModalHeader>
              <ModalBody>
                <Select label="Seleccionar taller" variant="bordered">
                  <SelectItem key="1">Danza Contemporánea</SelectItem>
                  <SelectItem key="2">Ballet Clásico</SelectItem>
                  <SelectItem key="3">Teatro</SelectItem>
                </Select>
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
                  Asignar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

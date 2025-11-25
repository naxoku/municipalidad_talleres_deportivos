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
  Edit,
  Save,
  X,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { horariosApi } from "@/api/horarios";
import { talleresApi } from "@/api/talleres";
import { profesoresApi } from "@/api/profesores";
import { ubicacionesApi } from "@/api/ubicaciones";
import { Horario } from "@/types/schema";

export default function HorarioDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const horarioId = Number(id);
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Horario>>({});
  const {
    isOpen: isAlumnoOpen,
    onOpen: onAlumnoOpen,
    onOpenChange: onAlumnoOpenChange,
  } = useDisclosure();

  // --- Queries ---
  const { data: horario, isLoading: isLoadingHorario } = useQuery({
    queryKey: ["horario", horarioId],
    queryFn: () => horariosApi.getById(horarioId),
    enabled: !!horarioId,
  });

  const { data: talleres } = useQuery({
    queryKey: ["talleres"],
    queryFn: talleresApi.getAll,
  });

  const { data: profesores } = useQuery({
    queryKey: ["profesores"],
    queryFn: profesoresApi.getAll,
  });

  const { data: ubicaciones } = useQuery({
    queryKey: ["ubicaciones"],
    queryFn: ubicacionesApi.getAll,
  });

  const { data: alumnos } = useQuery({
    queryKey: ["horario_alumnos", horarioId],
    queryFn: () => horariosApi.getAlumnos(horarioId),
    enabled: !!horarioId,
  });

  const { data: clases } = useQuery({
    queryKey: ["horario_clases", horarioId],
    queryFn: () => horariosApi.getClases(horarioId),
    enabled: !!horarioId,
  });

  // Initialize form data when horario loads
  useEffect(() => {
    if (horario) {
      setFormData(horario);
    }
  }, [horario]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Horario>) => horariosApi.update(horarioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horario", horarioId] });
      setEditMode(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(horario || {});
    setEditMode(false);
  };

  const taller = talleres?.find((t) => t.id === horario?.taller_id);

  if (isLoadingHorario) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando información del horario..." size="lg" />
      </div>
    );
  }

  if (!horario) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar el horario
        </h3>
        <p className="text-sm text-default-500">
          No se pudo encontrar el horario solicitado.
        </p>
        <Button
          className="mt-4"
          startContent={<ArrowLeft size={16} />}
          onPress={() => navigate("/horarios")}
        >
          Volver a Horarios
        </Button>
      </div>
    );
  }

  // --- Render Functions ---

  const renderAlumnosTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Alumnos inscritos ({alumnos?.length || 0})
        </h3>
        <Button
          color="primary"
          endContent={<Plus size={16} />}
          size="sm"
          onPress={onAlumnoOpen}
        >
          Inscribir Alumno
        </Button>
      </div>
      <Table aria-label="Tabla de alumnos inscritos">
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>RUT</TableColumn>
          <TableColumn>EDAD</TableColumn>
          <TableColumn>ESTADO</TableColumn>
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
                <Chip color="success" size="sm" variant="flat">
                  Activo
                </Chip>
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
          <h3 className="text-lg font-bold text-primary-900">Próxima Clase</h3>
          <p className="text-primary-700 text-sm">
            {horario.dia_semana} - {horario.hora_inicio?.slice(0, 5)}
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
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            aria-label="Volver a la lista de horarios"
            variant="light"
            onPress={() => navigate("/horarios")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold">
            {taller?.nombre || "Horario"} - {horario.dia_semana}
          </h1>
          <Chip color="success" variant="flat">
            Activo
          </Chip>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex w-full flex-col">
        <Tabs
          aria-label="Opciones del Horario"
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
                  Información del horario
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
                        htmlFor="taller-select"
                      >
                        Taller
                      </label>
                      <Select
                        id="taller-select"
                        isDisabled={!editMode}
                        label="Seleccionar taller"
                        selectedKeys={
                          formData.taller_id
                            ? [formData.taller_id.toString()]
                            : []
                        }
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setFormData({
                            ...formData,
                            taller_id: Number(selected),
                          });
                        }}
                      >
                        {talleres?.map((taller) => (
                          <SelectItem key={taller.id.toString()}>
                            {taller.nombre}
                          </SelectItem>
                        )) || []}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="profesor-select"
                      >
                        Profesor
                      </label>
                      <Select
                        id="profesor-select"
                        isDisabled={!editMode}
                        label="Seleccionar profesor"
                        selectedKeys={
                          formData.profesor_id
                            ? [formData.profesor_id.toString()]
                            : []
                        }
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setFormData({
                            ...formData,
                            profesor_id: Number(selected),
                          });
                        }}
                      >
                        {profesores?.map((profesor) => (
                          <SelectItem key={profesor.id.toString()}>
                            {profesor.nombre}
                          </SelectItem>
                        )) || []}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="ubicacion-select"
                      >
                        Ubicación
                      </label>
                      <Select
                        id="ubicacion-select"
                        isDisabled={!editMode}
                        label="Seleccionar ubicación"
                        selectedKeys={
                          formData.ubicacion_id
                            ? [formData.ubicacion_id.toString()]
                            : []
                        }
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setFormData({
                            ...formData,
                            ubicacion_id: Number(selected),
                          });
                        }}
                      >
                        {ubicaciones?.map((ubicacion) => (
                          <SelectItem key={ubicacion.id.toString()}>
                            {ubicacion.nombre}
                          </SelectItem>
                        )) || []}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="dia-select"
                      >
                        Día de la semana
                      </label>
                      <Select
                        id="dia-select"
                        isDisabled={!editMode}
                        label="Seleccionar día"
                        selectedKeys={
                          formData.dia_semana ? [formData.dia_semana] : []
                        }
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setFormData({
                            ...formData,
                            dia_semana: selected as any,
                          });
                        }}
                      >
                        <SelectItem key="lunes">Lunes</SelectItem>
                        <SelectItem key="martes">Martes</SelectItem>
                        <SelectItem key="miércoles">Miércoles</SelectItem>
                        <SelectItem key="jueves">Jueves</SelectItem>
                        <SelectItem key="viernes">Viernes</SelectItem>
                        <SelectItem key="sábado">Sábado</SelectItem>
                        <SelectItem key="domingo">Domingo</SelectItem>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="hora-inicio-input"
                      >
                        Hora inicio
                      </label>
                      <Input
                        id="hora-inicio-input"
                        isDisabled={!editMode}
                        type="time"
                        value={formData.hora_inicio || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, hora_inicio: value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        htmlFor="hora-fin-input"
                      >
                        Hora fin
                      </label>
                      <Input
                        id="hora-fin-input"
                        isDisabled={!editMode}
                        type="time"
                        value={formData.hora_fin || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, hora_fin: value })
                        }
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
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

      {/* Modal Inscribir Alumno */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isAlumnoOpen}
        placement="center"
        onOpenChange={onAlumnoOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Inscribir Alumno al Horario
              </ModalHeader>
              <ModalBody>
                <Select label="Seleccionar alumno" variant="bordered">
                  <SelectItem key="1">Juan Pérez</SelectItem>
                  <SelectItem key="2">María González</SelectItem>
                  <SelectItem key="3">Carlos Rodríguez</SelectItem>
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
                  Inscribir
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

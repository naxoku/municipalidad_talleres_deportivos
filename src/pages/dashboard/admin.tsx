import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
  Spinner,
  Progress,
  DatePicker,
} from "@heroui/react";
import {
  User,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Sun,
  Download,
  UserPlus,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/api/dashboard";
import { localIsoDate } from "@/utils/localDate";

const formatTimeHHMM = (timeString: string) => {
  if (!timeString) return "-";

  return timeString.slice(0, 5);
};

export default function DashboardPage() {
  const navigate = useNavigate();

  // Estados de carga y datos
  const {
    data,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.getStats,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Modales
  const { isOpen: isStudentOpen, onOpenChange: onStudentOpenChange } =
    useDisclosure();
  const {
    isOpen: isEnrollOpen,
    onOpen: onEnrollOpen,
    onOpenChange: onEnrollOpenChange,
  } = useDisclosure();
  const { isOpen: isTallerOpen, onOpenChange: onTallerOpenChange } =
    useDisclosure();
  const {
    isOpen: isClassOpen,
    onOpen: onClassOpen,
    onOpenChange: onClassOpenChange,
  } = useDisclosure();
  const {
    isOpen: isQuickReportOpen,
    onOpen: onQuickReportOpen,
    onOpenChange: onQuickReportOpenChange,
  } = useDisclosure();

  const [selectedClass, setSelectedClass] = useState<any>(null);

  // Procesar clases del día (actuales vs próximas)
  const { currentClasses, upcomingClasses } = useMemo(() => {
    if (!data?.clases_hoy) return { currentClasses: [], upcomingClasses: [] };

    const now = new Date();
    const todayStr = localIsoDate(now);
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Las clases de hoy no incluyen fecha, son las del día actual
    const todayClasses = data.clases_hoy.map((c: any) => ({
      ...c,
      fecha: todayStr,
    }));

    const current = [];
    const upcoming = [];

    for (const c of todayClasses) {
      const [hStart, mStart] = c.hora_inicio.split(":").map(Number);
      const [hEnd, mEnd] = c.hora_fin.split(":").map(Number);
      const startMinutes = hStart * 60 + mStart;
      const endMinutes = hEnd * 60 + mEnd;

      if (currentTime >= startMinutes && currentTime < endMinutes) {
        current.push(c);
      } else if (currentTime < startMinutes) {
        upcoming.push(c);
      }
    }

    return { currentClasses: current, upcomingClasses: upcoming };
  }, [data]);

  // Calcular métricas adicionales
  const metrics = useMemo(() => {
    if (!data) return {} as any;

    const totalTalleres = data.total_talleres || data.talleres_activos || 0;
    const totalAlumnos = data.total_alumnos || 0;
    const totalProfesores = data.total_profesores || 0;

    const asistenciaPromedio = data.asistencia_promedio || 0;

    const talleresActivos = data.talleres_activos || totalTalleres;
    const profesoresActivos = totalProfesores;

    const calculatedMetrics = {
      totalTalleres,
      totalAlumnos,
      totalProfesores,
      asistenciaPromedio,
      talleresActivos,
      profesoresActivos,
      alumnosInscritosHoy: Math.floor(totalAlumnos * 0.15),
      alumnosInscritosMes: Math.floor(totalAlumnos * 0.92),
    };

    return calculatedMetrics as any;
  }, [data]);

  const handleClassClick = (clase: any) => {
    setSelectedClass(clase);
    onClassOpen();
  };

  if (dashboardLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner label="Cargando dashboard..." size="lg" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">
          Error al cargar el dashboard
        </h3>
        <p className="text-sm text-default-500 mb-4">
          No se pudo conectar con el servidor. Verifica que el backend esté
          ejecutándose.
        </p>
        <p className="text-xs text-default-400">
          URL:{" "}
          {import.meta.env.VITE_API_URL || "http://localhost/talleres_backend"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-default-500 capitalize">
              {new Date().toLocaleDateString("es-CL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2" />
        </div>
      </div>

      <>
        {/* Métricas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            className="h-20 flex flex-col items-center justify-center gap-2"
            color="default"
            variant="bordered"
            onPress={() => navigate("/alumnos")}
          >
            <div className="text-center">
              <div className="text-lg font-bold">{metrics.totalAlumnos}</div>
              <div className="text-xs">Número de alumnos</div>
            </div>
          </Button>
          <Button
            className="h-20 flex flex-col items-center justify-center gap-2"
            color="default"
            variant="bordered"
            onPress={() => navigate("/asistencia")}
          >
            <div className="text-center">
              <div className="text-lg font-bold">
                {metrics.asistenciaPromedio}%
              </div>
              <div className="text-xs">Promedio de asistencias</div>
            </div>
          </Button>
          <Button
            className="h-20 flex flex-col items-center justify-center gap-2"
            color="default"
            variant="bordered"
            onPress={() => navigate("/talleres")}
          >
            <div className="text-center">
              <div className="text-lg font-bold">{metrics.talleresActivos}</div>
              <div className="text-xs">Talleres activos</div>
            </div>
          </Button>
          <Button
            className="h-20 flex flex-col items-center justify-center gap-2"
            color="default"
            variant="bordered"
            onPress={() => navigate("/profesores")}
          >
            <div className="text-center">
              <div className="text-lg font-bold">
                {metrics.profesoresActivos}
              </div>
              <div className="text-xs">Profesores activos</div>
            </div>
          </Button>
        </div>

        {/* Acciones rápidas principales */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              color="primary"
              variant="flat"
              onPress={onEnrollOpen}
            >
              <UserPlus size={24} />
              <div className="text-center">
                <div className="text-sm font-semibold">Inscribir Alumno</div>
                <div className="text-xs">Registrar en taller</div>
              </div>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              color="warning"
              variant="flat"
              onPress={() => {}}
            >
              <Calendar size={24} />
              <div className="text-center">
                <div className="text-sm font-semibold">Crear Horario</div>
                <div className="text-xs">Programar clases</div>
              </div>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              color="secondary"
              variant="flat"
              onPress={() => {}}
            >
              <CheckCircle size={24} />
              <div className="text-center">
                <div className="text-sm font-semibold">Corregir Asistencia</div>
                <div className="text-xs">Ajustar registros</div>
              </div>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              color="primary"
              variant="flat"
              onPress={() => {}}
            >
              <MapPin size={24} />
              <div className="text-center">
                <div className="text-sm font-semibold">Ver Ubicaciones</div>
                <div className="text-xs">Disponibilidad de espacios</div>
              </div>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              color="success"
              variant="flat"
              onPress={onQuickReportOpen}
            >
              <FileSpreadsheet size={24} />
              <div className="text-center">
                <div className="text-sm font-semibold">Reporte Rápido</div>
                <div className="text-xs">Generar reportes instantáneos</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Clases del día */}
        <ClassesTodaySection
          currentClasses={currentClasses}
          upcomingClasses={upcomingClasses}
          onClassClick={handleClassClick}
        />
      </>

      {/* Modales */}
      <ModalsSection
        isClassOpen={isClassOpen}
        isEnrollOpen={isEnrollOpen}
        isQuickReportOpen={isQuickReportOpen}
        isStudentOpen={isStudentOpen}
        isTallerOpen={isTallerOpen}
        navigate={navigate}
        selectedClass={selectedClass}
        onClassOpenChange={onClassOpenChange}
        onEnrollOpenChange={onEnrollOpenChange}
        onQuickReportOpenChange={onQuickReportOpenChange}
        onStudentOpenChange={onStudentOpenChange}
        onTallerOpenChange={onTallerOpenChange}
      />
    </div>
  );
}

// --- Componentes principales ---
function ClassesTodaySection({
  currentClasses,
  upcomingClasses,
  onClassClick,
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Clases de hoy</h2>

      {/* Current Classes */}
      {currentClasses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-success uppercase tracking-wider">
              En curso ({currentClasses.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentClasses.map((c: any) => (
              <ClassCard
                key={c.id}
                clase={c}
                status="current"
                onClick={() => onClassClick(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="text-primary" size={16} />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Próximas ({upcomingClasses.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingClasses.map((c: any) => (
              <ClassCard
                key={c.id}
                clase={c}
                status="upcoming"
                onClick={() => onClassClick(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {currentClasses.length === 0 && upcomingClasses.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-default-200 rounded-xl bg-default-50">
          <Sun className="text-default-300 mb-4" size={48} />
          <p className="text-default-500 font-medium">
            No hay clases programadas para hoy
          </p>
          <p className="text-sm text-default-400">
            Las actividades comenzarán próximamente
          </p>
        </div>
      )}
    </div>
  );
}

function ModalsSection({
  isStudentOpen,
  onStudentOpenChange,
  isEnrollOpen,
  onEnrollOpenChange,
  isTallerOpen,
  onTallerOpenChange,
  isClassOpen,
  onClassOpenChange,
  isQuickReportOpen,
  onQuickReportOpenChange,
  selectedClass,
  navigate,
}: any) {
  return (
    <>
      {/* Nuevo Alumno Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isStudentOpen}
        placement="center"
        onOpenChange={onStudentOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Nuevo Alumno
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Nombre completo"
                  placeholder="Ej: Juan Pérez"
                  variant="bordered"
                />
                <Input
                  label="Edad"
                  placeholder="Ej: 12"
                  type="number"
                  variant="bordered"
                />
                <Input
                  label="Contacto"
                  placeholder="+569..."
                  variant="bordered"
                />
                <Input
                  label="Email"
                  placeholder="juan@email.com"
                  type="email"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button className="shadow-md" color="primary" onPress={onClose}>
                  Crear Alumno
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Nueva Inscripción Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isEnrollOpen}
        placement="center"
        onOpenChange={onEnrollOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Nueva Inscripción
              </ModalHeader>
              <ModalBody>
                <Select
                  label="Alumno"
                  placeholder="Selecciona un alumno"
                  variant="bordered"
                >
                  <SelectItem key="1">Juan Pérez</SelectItem>
                  <SelectItem key="2">Maria Gonzalez</SelectItem>
                </Select>
                <Select
                  label="Taller"
                  placeholder="Selecciona un taller"
                  variant="bordered"
                >
                  <SelectItem key="1">Fútbol</SelectItem>
                  <SelectItem key="2">Zumba</SelectItem>
                </Select>
                <DatePicker label="Fecha de inicio" variant="bordered" />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button className="shadow-md" color="primary" onPress={onClose}>
                  Inscribir
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Nuevo Taller Modal */}
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
                Nuevo Taller
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Nombre del taller"
                  placeholder="Ej: Tenis"
                  variant="bordered"
                />
                <Input
                  label="Descripción"
                  placeholder="Descripción breve"
                  variant="bordered"
                />
                <Input
                  label="Cupos máximos"
                  placeholder="20"
                  type="number"
                  variant="bordered"
                />
                <Select
                  label="Categoría"
                  placeholder="Selecciona categoría"
                  variant="bordered"
                >
                  <SelectItem key="deportivo">Deportivo</SelectItem>
                  <SelectItem key="artistico">Artístico</SelectItem>
                  <SelectItem key="cultural">Cultural</SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button className="shadow-md" color="primary" onPress={onClose}>
                  Crear Taller
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Detalle Clase Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isClassOpen}
        placement="center"
        onOpenChange={onClassOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedClass?.taller_nombre}
                <span className="text-small font-normal text-default-500">
                  Detalle de la clase
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-tiny text-default-500 uppercase font-bold">
                      Horario
                    </p>
                    <p>
                      {formatTimeHHMM(selectedClass?.hora_inicio)} -{" "}
                      {formatTimeHHMM(selectedClass?.hora_fin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-tiny text-default-500 uppercase font-bold">
                      Ubicación
                    </p>
                    <p>{selectedClass?.ubicacion_nombre}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-tiny text-default-500 uppercase font-bold">
                      Profesor
                    </p>
                    <p>{selectedClass?.profesor_nombre}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-tiny text-default-500 uppercase font-bold">
                      Asistencia
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress
                        aria-label={`Asistencia: ${selectedClass?.total_asistentes} de ${selectedClass?.cupos_max}`}
                        className="flex-1"
                        color="primary"
                        size="sm"
                        value={
                          (selectedClass?.total_asistentes /
                            selectedClass?.cupos_max) *
                          100
                        }
                      />
                      <span className="text-sm">
                        {selectedClass?.total_asistentes} /{" "}
                        {selectedClass?.cupos_max}
                      </span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => {
                    onClose();
                    navigate("/asistencia");
                  }}
                >
                  Marcar Asistencia
                </Button>
                <Button onPress={onClose}>Cerrar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Reporte Rápido Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-opacity-40",
        }}
        isOpen={isQuickReportOpen}
        placement="center"
        size="2xl"
        onOpenChange={onQuickReportOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} />
                  Reporte Rápido
                </div>
                <span className="text-small font-normal text-default-500">
                  Genera reportes instantáneos del sistema
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Tipo de reporte"
                    placeholder="Selecciona tipo"
                    variant="bordered"
                  >
                    <SelectItem key="asistencia">Asistencia General</SelectItem>
                    <SelectItem key="alumnos">Lista de Alumnos</SelectItem>
                    <SelectItem key="talleres">
                      Estadísticas de Talleres
                    </SelectItem>
                    <SelectItem key="profesores">
                      Carga de Profesores
                    </SelectItem>
                  </Select>
                  <Select
                    label="Formato"
                    placeholder="Selecciona formato"
                    variant="bordered"
                  >
                    <SelectItem key="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem key="csv">CSV (.csv)</SelectItem>
                    <SelectItem key="pdf">PDF (.pdf)</SelectItem>
                  </Select>
                  <DatePicker label="Fecha desde" variant="bordered" />
                  <DatePicker label="Fecha hasta" variant="bordered" />
                  <Select
                    label="Taller (opcional)"
                    placeholder="Todos los talleres"
                    variant="bordered"
                  >
                    <SelectItem key="all">Todos</SelectItem>
                    <SelectItem key="1">Fútbol</SelectItem>
                    <SelectItem key="2">Zumba</SelectItem>
                  </Select>
                  <div className="flex items-center gap-2">
                    <input id="includeInactive" type="checkbox" />
                    <label className="text-sm" htmlFor="includeInactive">
                      Incluir registros inactivos
                    </label>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  startContent={<Download size={16} />}
                  onPress={onClose}
                >
                  Generar y Descargar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

// --- Subcomponents ---

function ClassCard({ clase, status, onClick }: any) {
  const isCurrent = status === "current";

  return (
    <Card
      isPressable
      className={`border-l-4 ${isCurrent ? "border-l-success" : "border-l-primary"} w-full hover:shadow-sm transition-shadow`}
      onPress={onClick}
    >
      <CardBody className="flex flex-row p-0 overflow-hidden">
        {/* Time Block */}
        <div
          className={`flex flex-col justify-center items-center px-4 py-3 min-w-[90px] border-r border-default-100 ${isCurrent ? "bg-success-50" : "bg-primary-50"}`}
        >
          <span
            className={`text-sm font-bold ${isCurrent ? "text-success-700" : "text-primary-700"}`}
          >
            {formatTimeHHMM(clase.hora_inicio)}
          </span>
          <span className="text-xs text-default-400">-</span>
          <span
            className={`text-sm font-bold ${isCurrent ? "text-success-700" : "text-primary-700"}`}
          >
            {formatTimeHHMM(clase.hora_fin)}
          </span>
        </div>

        {/* Info Block */}
        <div className="flex flex-col justify-center p-3 gap-1 flex-grow">
          <h4 className="font-bold text-medium">{clase.taller_nombre}</h4>

          <div className="flex items-center gap-2 text-small text-default-500">
            <User size={14} />
            <span className="truncate">{clase.profesor_nombre}</span>
          </div>

          <div className="flex items-center gap-2 text-small text-default-500">
            <MapPin size={14} />
            <span className="truncate">{clase.ubicacion_nombre}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-default-400">
              {clase.total_asistentes || 0} / {clase.cupos_max || 0} alumnos
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

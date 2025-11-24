import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  Calendar,
  ClipboardCheck,
  Save,
  Users,
  Clock,
  MapPin,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/auth";
import { asistenciaApi, HorarioAsistencia } from "@/api/asistencia";

export default function ProfesorAsistenciaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<number>(0);
  const [fecha, setFecha] = useState<string>("");
  const [asistencias, setAsistencias] = useState<Map<number, boolean>>(
    new Map(),
  );

  // Fetch horarios del profesor con alumnos
  const { data: horarios, isLoading: loadingHorarios } = useQuery({
    queryKey: ["profesor", "horarios_asistencia", user?.profesor_id],
    queryFn: () => asistenciaApi.getHorariosConAlumnos(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  // Fetch asistencia para horario y fecha seleccionados
  const {
    data: alumnos,
    isLoading: loadingAlumnos,
    refetch: refetchAsistencia,
  } = useQuery({
    queryKey: [
      "profesor",
      "asistencia",
      horarioSeleccionado,
      fecha,
      user?.profesor_id,
    ],
    queryFn: () => asistenciaApi.getAsistenciaFecha(horarioSeleccionado, fecha),
    enabled: !!horarioSeleccionado && !!fecha,
  });

  // Inicializar asistencias cuando se cargan los alumnos
  useMemo(() => {
    if (alumnos) {
      const newAsistencias = new Map<number, boolean>();

      alumnos.forEach((alumno) => {
        newAsistencias.set(alumno.id, alumno.presente);
      });
      setAsistencias(newAsistencias);
    }
  }, [alumnos]);

  // Mutation para guardar asistencia
  const guardarMutation = useMutation({
    mutationFn: () =>
      asistenciaApi.guardarAsistencia({
        horario_id: horarioSeleccionado,
        fecha,
        asistencias: Array.from(asistencias.entries()).map(
          ([alumno_id, presente]) => ({
            alumno_id,
            presente,
          }),
        ),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profesor", "asistencia"],
      });
      toast.success("Asistencia guardada exitosamente");
      refetchAsistencia();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Error al guardar asistencia");
    },
  });

  // Normalizar datos recibidos de la query: la API puede devolver
  // directamente un arreglo o un objeto con la propiedad `datos` o `value`.
  const horariosList = useMemo<HorarioAsistencia[]>(() => {
    if (!horarios) return [];

    if (Array.isArray(horarios)) return horarios;

    if (Array.isArray((horarios as any).datos)) return (horarios as any).datos;

    if (Array.isArray((horarios as any).value)) return (horarios as any).value;

    return [];
  }, [horarios]);

  const horarioInfo = useMemo(() => {
    return horariosList.find((h) => h.id === horarioSeleccionado);
  }, [horariosList, horarioSeleccionado]);

  const handleToggleAsistencia = (alumnoId: number) => {
    setAsistencias((prev) => {
      const newMap = new Map(prev);

      newMap.set(alumnoId, !prev.get(alumnoId));

      return newMap;
    });
  };

  const handleMarcarTodos = (presente: boolean) => {
    if (!alumnos) return;
    setAsistencias((prev) => {
      const newMap = new Map(prev);

      alumnos.forEach((alumno) => {
        newMap.set(alumno.id, presente);
      });

      return newMap;
    });
  };

  const handleGuardar = () => {
    if (!horarioSeleccionado || !fecha) {
      toast.error("Selecciona un horario y una fecha");

      return;
    }
    guardarMutation.mutate();
  };

  const presentesCount = useMemo(() => {
    return Array.from(asistencias.values()).filter((p) => p).length;
  }, [asistencias]);

  const ausentesCount = useMemo(() => {
    return Array.from(asistencias.values()).filter((p) => !p).length;
  }, [asistencias]);

  if (loadingHorarios) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner label="Cargando horarios..." size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <ClipboardCheck className="text-primary" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Registro de Asistencia</h1>
          <p className="text-default-500">
            Marca la asistencia de tus alumnos por clase
          </p>
        </div>
      </div>

      {/* Selección de horario y fecha */}
      <Card className="mb-6">
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Select Horario */}
            <Select
              isRequired
              aria-label="Seleccionar horario"
              label="Horario de Clase"
              placeholder="Selecciona un horario"
              selectedKeys={
                horarioSeleccionado ? [horarioSeleccionado.toString()] : []
              }
              startContent={<Clock size={18} />}
              onSelectionChange={(keys) => {
                const id = Array.from(keys)[0]?.toString();

                setHorarioSeleccionado(id ? parseInt(id) : 0);
                setAsistencias(new Map());
              }}
            >
              {horariosList.map((horario) => (
                <SelectItem
                  key={horario.id.toString()}
                  textValue={`${horario.taller_nombre} - ${horario.dia_semana} ${horario.hora_inicio}`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {horario.taller_nombre}
                    </span>
                    <span className="text-small text-default-500">
                      <span className="capitalize">{horario.dia_semana}</span>{" "}
                      {horario.hora_inicio} - {horario.hora_fin}
                      {horario.ubicacion_nombre &&
                        ` • ${horario.ubicacion_nombre}`}
                    </span>
                    <span className="text-tiny text-default-400">
                      {horario.total_alumnos} alumno
                      {horario.total_alumnos !== 1 ? "s" : ""}
                    </span>
                  </div>
                </SelectItem>
              )) || []}
            </Select>

            {/* Input Fecha */}
            <Input
              isRequired
              label="Fecha de la Clase"
              max={new Date().toISOString().split("T")[0]}
              startContent={<Calendar size={18} />}
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setAsistencias(new Map());
              }}
            />
          </div>

          {/* Info del horario seleccionado */}
          {horarioInfo && (
            <div className="flex flex-wrap gap-4">
              <Chip
                color="primary"
                startContent={<Users size={16} />}
                variant="flat"
              >
                {horarioInfo.total_alumnos} Alumnos
              </Chip>
              <Chip
                color="secondary"
                startContent={<Clock size={16} />}
                variant="flat"
              >
                <span className="capitalize">{horarioInfo.dia_semana}</span>{" "}
                {horarioInfo.hora_inicio} - {horarioInfo.hora_fin}
              </Chip>
              {horarioInfo.ubicacion_nombre && (
                <Chip
                  color="default"
                  startContent={<MapPin size={16} />}
                  variant="flat"
                >
                  {horarioInfo.ubicacion_nombre}
                </Chip>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabla de asistencia */}
      {horarioSeleccionado && fecha && (
        <Card>
          <CardHeader className="flex-col items-start gap-3 pb-4">
            <div className="flex w-full items-center justify-between">
              <h2 className="text-lg font-semibold">Lista de Asistencia</h2>
              {alumnos && alumnos.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    color="success"
                    size="sm"
                    variant="flat"
                    onPress={() => handleMarcarTodos(true)}
                  >
                    Marcar todos presentes
                  </Button>
                  <Button
                    color="danger"
                    size="sm"
                    variant="flat"
                    onPress={() => handleMarcarTodos(false)}
                  >
                    Marcar todos ausentes
                  </Button>
                </div>
              )}
            </div>

            {alumnos && alumnos.length > 0 && (
              <div className="flex gap-4">
                <Chip color="success" variant="flat">
                  Presentes: {presentesCount}
                </Chip>
                <Chip color="danger" variant="flat">
                  Ausentes: {ausentesCount}
                </Chip>
                <Chip color="default" variant="flat">
                  Total: {alumnos.length}
                </Chip>
              </div>
            )}
          </CardHeader>

          <CardBody>
            {loadingAlumnos ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner label="Cargando alumnos..." />
              </div>
            ) : !alumnos || alumnos.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-default-400">
                <Users size={48} />
                <p className="mt-2">No hay alumnos inscritos en este horario</p>
              </div>
            ) : (
              <>
                <Table
                  aria-label="Tabla de asistencia"
                  className="hidden md:table"
                >
                  <TableHeader>
                    <TableColumn>ALUMNO</TableColumn>
                    <TableColumn>RUT</TableColumn>
                    <TableColumn width={150}>ASISTENCIA</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {alumnos.map((alumno) => (
                      <TableRow key={alumno.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {alumno.nombre_completo}
                            </p>
                            {alumno.telefono && (
                              <p className="text-small text-default-400">
                                {alumno.telefono}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{alumno.rut}</TableCell>
                        <TableCell>
                          <Checkbox
                            color="success"
                            isSelected={asistencias.get(alumno.id) || false}
                            onValueChange={() =>
                              handleToggleAsistencia(alumno.id)
                            }
                          >
                            Presente
                          </Checkbox>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Vista móvil */}
                <div className="flex flex-col gap-3 md:hidden">
                  {alumnos.map((alumno) => (
                    <Card key={alumno.id} shadow="sm">
                      <CardBody className="gap-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {alumno.nombre_completo}
                            </p>
                            <p className="text-small text-default-500">
                              {alumno.rut}
                            </p>
                            {alumno.telefono && (
                              <p className="text-small text-default-400">
                                📞 {alumno.telefono}
                              </p>
                            )}
                          </div>
                          <Checkbox
                            color="success"
                            isSelected={asistencias.get(alumno.id) || false}
                            size="lg"
                            onValueChange={() =>
                              handleToggleAsistencia(alumno.id)
                            }
                          >
                            Presente
                          </Checkbox>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {/* Botón guardar */}
                <div className="mt-6 flex justify-end">
                  <Button
                    color="primary"
                    isLoading={guardarMutation.isPending}
                    size="lg"
                    startContent={<Save size={20} />}
                    onPress={handleGuardar}
                  >
                    Guardar Asistencia
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Mensaje inicial */}
      {!horarioSeleccionado && !fecha && (
        <Card>
          <CardBody className="flex h-60 items-center justify-center text-center">
            <ClipboardCheck className="text-default-300" size={64} />
            <p className="mt-4 text-lg text-default-500">
              Selecciona un horario y una fecha para registrar la asistencia
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

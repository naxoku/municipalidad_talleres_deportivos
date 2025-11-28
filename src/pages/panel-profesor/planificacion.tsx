import { useState, useMemo } from "react";
import { BookOpen, Calendar, Clock, Lock } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Spinner,
  Textarea,
} from "@heroui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/auth";
import { profesorApi } from "@/api/profesor";
import {
  detalleClaseApi,
  type DetalleClase,
  type DetalleClaseForm,
} from "@/api/detalle_clase";

// Función helper para verificar si una fecha es pasada
const esFechaPasada = (fecha: string): boolean => {
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);
  const fechaClase = new Date(fecha + "T00:00:00");

  return fechaClase < hoy;
};

export default function ProfesorPlanificacionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados principales
  const [selectedTab, setSelectedTab] = useState<
    "todas" | "proximas" | "pasadas"
  >("todas");
  const [selectedTallerId, setSelectedTallerId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPlanificacionDrawer, setSelectedPlanificacionDrawer] =
    useState<DetalleClase | null>(null);
  const [drawerForm, setDrawerForm] = useState<{
    objetivo: string;
    actividades: string;
    observaciones: string;
  }>({ objetivo: "", actividades: "", observaciones: "" });

  // Fetch talleres del profesor
  const { data: talleres } = useQuery({
    queryKey: ["profesor", "talleres", user?.profesor_id],
    queryFn: () => profesorApi.getTalleres(user!.profesor_id!),
    enabled: !!user?.profesor_id,
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

  const filteredPlanificaciones = useMemo(() => {
    if (!planificacionesList) return [] as DetalleClase[];

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    let filtered = planificacionesList.filter((p) => {
      // Filtrar por taller seleccionado si hay uno
      if (selectedTallerId !== null) {
        if (p.taller_id !== selectedTallerId) return false;
      }

      // Filtrar por tab seleccionado
      if (selectedTab === "proximas") {
        const fechaClase = new Date(p.fecha_clase + "T00:00:00");

        if (fechaClase < hoy) return false;
      } else if (selectedTab === "pasadas") {
        const fechaClase = new Date(p.fecha_clase + "T00:00:00");

        if (fechaClase >= hoy) return false;
      }

      return true;
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
  }, [planificacionesList, selectedTallerId, selectedTab]);

  const resetForm = () => {
    // No form to reset
  };

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

      {/* Botones de navegación */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          color="primary"
          size="sm"
          startContent={<BookOpen size={16} />}
          variant={selectedTab === "todas" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("todas")}
        >
          Todas
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<Calendar size={16} />}
          variant={selectedTab === "proximas" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("proximas")}
        >
          Próximas
        </Button>
        <Button
          color="primary"
          size="sm"
          startContent={<Clock size={16} />}
          variant={selectedTab === "pasadas" ? "solid" : "ghost"}
          onPress={() => setSelectedTab("pasadas")}
        >
          Pasadas
        </Button>
      </div>

      {/* Filtro por taller */}
      {planificacionesList.length > 0 && (
        <div className="space-y-2">
          <Select
            label="Filtrar por taller"
            placeholder="Todos los talleres"
            selectedKeys={selectedTallerId ? [selectedTallerId.toString()] : []}
            size="lg"
            variant="bordered"
            onSelectionChange={(keys) => {
              const tallerId = Array.from(keys)[0]?.toString();

              setSelectedTallerId(tallerId ? parseInt(tallerId) : null);
            }}
          >
            {talleresList?.map((taller) => (
              <SelectItem key={taller.id.toString()} textValue={taller.nombre}>
                {taller.nombre}
              </SelectItem>
            )) || []}
          </Select>
          {selectedTallerId && (
            <Button
              size="sm"
              variant="light"
              onPress={() => setSelectedTallerId(null)}
            >
              Limpiar filtro
            </Button>
          )}
        </div>
      )}

      {/* Lista */}
      {filteredPlanificaciones.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center p-8 text-center h-60">
            <BookOpen className="text-default-300 mb-4" size={64} />
            <p className="text-default-500 font-medium mb-1">
              {selectedTallerId
                ? selectedTab === "todas"
                  ? "No hay planificaciones para este taller"
                  : selectedTab === "proximas"
                    ? "No hay planificaciones próximas para este taller"
                    : "No hay planificaciones pasadas para este taller"
                : selectedTab === "todas"
                  ? "No hay planificaciones aún"
                  : selectedTab === "proximas"
                    ? "No hay planificaciones próximas"
                    : "No hay planificaciones pasadas"}
            </p>
            <p className="text-sm text-default-400 mb-4">
              {selectedTallerId
                ? "Selecciona otro taller o limpia el filtro"
                : selectedTab === "todas"
                  ? "Comienza creando tu primera planificación"
                  : selectedTab === "proximas"
                    ? "Las planificaciones próximas aparecerán aquí"
                    : "Las planificaciones pasadas aparecerán aquí una vez realizadas"}
            </p>
            {selectedTallerId ? (
              <Button
                color="primary"
                size="lg"
                onPress={() => setSelectedTallerId(null)}
              >
                Ver todos los talleres
              </Button>
            ) : selectedTab !== "todas" ? (
              <Button
                color="primary"
                size="lg"
                onPress={() => setSelectedTab("todas")}
              >
                Ver todas las planificaciones
              </Button>
            ) : null}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPlanificaciones.map((detalle) => {
            const fechaClase = new Date(detalle.fecha_clase + "T00:00:00");
            const esPasada = fechaClase < hoy;
            const esHoy = fechaClase.toDateString() === hoy.toDateString();
            const diasHasta = Math.ceil(
              (fechaClase.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
            );

            return (
              <Card
                key={detalle.id}
                className={`w-full shadow-none border border-default-200 transition-all flex flex-col ${
                  esPasada
                    ? "opacity-70 border-l-4 border-l-default-300"
                    : esHoy
                      ? "border-l-4 border-l-success"
                      : "border-l-4 border-l-primary"
                }`}
              >
                <CardBody className="p-4 flex-1">
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
                              {detalle.dia_semana}{" "}
                              {detalle.hora_inicio?.slice(0, 5)}
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
                              {diasHasta === 1
                                ? "Mañana"
                                : `En ${diasHasta} días`}
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
                    </div>
                  </div>
                </CardBody>
                {/* Footer */}
                <div className="border-t border-default-200 p-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-sm ${detalle.objetivo ? "text-default-500" : "text-danger-600 font-medium"}`}
                    >
                      {detalle.objetivo
                        ? "Planificación disponible"
                        : "Sin planificación"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        color={esPasada ? "default" : "primary"}
                        size="sm"
                        variant={esPasada ? "flat" : "solid"}
                        onPress={() => {
                          setSelectedPlanificacionDrawer(detalle);
                          setDrawerForm({
                            objetivo: detalle.objetivo || "",
                            actividades: detalle.actividades || "",
                            observaciones: detalle.observaciones || "",
                          });
                          setIsDrawerOpen(true);
                        }}
                      >
                        {esPasada
                          ? "Ver planificación"
                          : "Editar planificación"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawer / Modal para ver/editar rápido la clase */}
      <Modal isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <ModalContent>
          {(onClose) => (
            <div className="w-full md:max-w-md ml-auto">
              <ModalHeader>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedPlanificacionDrawer?.taller_nombre ||
                      "Detalle de clase"}
                  </h3>
                  <p className="text-sm text-default-500">
                    {selectedPlanificacionDrawer?.dia_semana || ""} •{" "}
                    {selectedPlanificacionDrawer?.fecha_clase || ""} •{" "}
                    {selectedPlanificacionDrawer?.hora_inicio?.slice(0, 5)} -{" "}
                    {selectedPlanificacionDrawer?.hora_fin?.slice(0, 5)}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedPlanificacionDrawer ? (
                  <div className="space-y-4">
                    {/* Mostrar aviso si la clase ya pasó */}
                    {esFechaPasada(selectedPlanificacionDrawer.fecha_clase) && (
                      <Card className="border-l-4 border-l-warning bg-warning-50/40">
                        <CardBody className="p-3">
                          <p className="text-sm text-warning-800">
                            Esta clase ya finalizó. No puedes editar la
                            planificación.
                          </p>
                        </CardBody>
                      </Card>
                    )}

                    {/* Formulario de detalle */}
                    <div className="space-y-3">
                      <div>
                        <label
                          className="text-sm font-medium"
                          htmlFor="objetivo-textarea"
                        >
                          Objetivo
                        </label>
                        <Textarea
                          id="objetivo-textarea"
                          isDisabled={esFechaPasada(
                            selectedPlanificacionDrawer.fecha_clase,
                          )}
                          minRows={3}
                          value={drawerForm.objetivo}
                          variant="bordered"
                          onChange={(e) =>
                            setDrawerForm({
                              ...drawerForm,
                              objetivo: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label
                          className="text-sm font-medium"
                          htmlFor="actividades-textarea"
                        >
                          Actividades
                        </label>
                        <Textarea
                          id="actividades-textarea"
                          isDisabled={esFechaPasada(
                            selectedPlanificacionDrawer.fecha_clase,
                          )}
                          minRows={4}
                          placeholder="Describe las actividades de la clase"
                          value={drawerForm.actividades}
                          variant="bordered"
                          onChange={(e) =>
                            setDrawerForm({
                              ...drawerForm,
                              actividades: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label
                          className="text-sm font-medium"
                          htmlFor="observaciones-textarea"
                        >
                          Observaciones
                        </label>
                        <Textarea
                          id="observaciones-textarea"
                          isDisabled={esFechaPasada(
                            selectedPlanificacionDrawer.fecha_clase,
                          )}
                          minRows={2}
                          placeholder="Observaciones, materiales, etc."
                          value={drawerForm.observaciones}
                          variant="bordered"
                          onChange={(e) =>
                            setDrawerForm({
                              ...drawerForm,
                              observaciones: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>No hay detalles seleccionados</div>
                )}
              </ModalBody>
              <ModalFooter>
                {selectedPlanificacionDrawer &&
                !esFechaPasada(selectedPlanificacionDrawer.fecha_clase) ? (
                  <div className="flex gap-2">
                    <Button
                      variant="light"
                      onPress={() => {
                        onClose();
                        setIsDrawerOpen(false);
                        setSelectedPlanificacionDrawer(null);
                      }}
                    >
                      Cerrar
                    </Button>
                    <Button
                      color="primary"
                      isLoading={
                        updateMutation.isPending || createMutation.isPending
                      }
                      onPress={() => {
                        if (!selectedPlanificacionDrawer) return;
                        const payload: DetalleClaseForm & { id?: number } = {
                          horario_id: selectedPlanificacionDrawer.horario_id,
                          taller_id: selectedPlanificacionDrawer.taller_id,
                          fecha_clase: selectedPlanificacionDrawer.fecha_clase,
                          objetivo: drawerForm.objetivo,
                          actividades: drawerForm.actividades,
                          observaciones: drawerForm.observaciones,
                        };

                        if (selectedPlanificacionDrawer.id) {
                          updateMutation.mutate(
                            { ...payload, id: selectedPlanificacionDrawer.id },
                            {
                              onSuccess: () => {
                                onClose();
                                setIsDrawerOpen(false);
                                setSelectedPlanificacionDrawer(null);
                              },
                            },
                          );
                        } else {
                          createMutation.mutate(payload as DetalleClaseForm, {
                            onSuccess: () => {
                              onClose();
                              setIsDrawerOpen(false);
                              setSelectedPlanificacionDrawer(null);
                            },
                          });
                        }
                      }}
                    >
                      Guardar detalle
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="light"
                      onPress={() => {
                        onClose();
                        setIsDrawerOpen(false);
                        setSelectedPlanificacionDrawer(null);
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                )}
              </ModalFooter>
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

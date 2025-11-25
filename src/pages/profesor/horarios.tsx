import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Spinner,
} from "@heroui/react";
import { Edit } from "lucide-react";

import { useAuth } from "@/context/auth";
import { profesoresApi } from "@/api/profesores";

export default function ProfesorHorariosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const profesorId = user?.profesor_id;

  const {
    data: horarios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profesor_horarios", profesorId],
    queryFn: () => profesoresApi.getHorarios(Number(profesorId)),
    enabled: !!profesorId,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Cargando horarios..." />
      </div>
    );

  if (error)
    return (
      <div className="text-center text-danger p-4">
        <h3 className="text-lg font-semibold mb-2">Error al cargar horarios</h3>
        <p className="text-sm text-default-500">{String(error)}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mis Horarios</h1>
      </div>
      <Table aria-label="Tabla de horarios">
        <TableHeader>
          <TableColumn>TALLER</TableColumn>
          <TableColumn>DÍA / HORA</TableColumn>
          <TableColumn>UBICACIÓN</TableColumn>
          <TableColumn align="end">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="No hay horarios asignados."
          items={horarios || []}
        >
          {(h: any) => (
            <TableRow key={h.id}>
              <TableCell>
                {h.taller?.nombre || h.taller_nombre || "Sin taller"}
              </TableCell>
              <TableCell>{`${h.dia_semana || ""} ${h.hora_inicio?.slice(0, 5) || ""}-${h.hora_fin?.slice(0, 5) || ""}`}</TableCell>
              <TableCell>
                {h.ubicacion?.nombre || h.ubicacion_nombre || "Sin ubicación"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    isIconOnly
                    aria-label="Editar horario"
                    size="sm"
                    variant="light"
                    onPress={() => navigate(`/horarios/${h.id}`)}
                  >
                    <Edit size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

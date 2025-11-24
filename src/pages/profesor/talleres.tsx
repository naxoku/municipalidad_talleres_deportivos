import { useState } from "react";
import { Card, CardBody, Button, Spinner, Chip, Input } from "@heroui/react";
import { BookOpen, Users, Calendar, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/auth";
import { profesorApi, TallerProfesor } from "@/api/profesor";

export default function ProfesorTalleresPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: talleres, isLoading } = useQuery({
    queryKey: ["profesor", "talleres", user?.profesor_id],
    queryFn: () => profesorApi.getTalleres(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  const filteredTalleres = talleres?.filter((taller) =>
    taller.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner label="Cargando talleres..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Talleres</h1>
          <p className="text-default-500">Talleres que actualmente impartes</p>
        </div>
        <Chip color="primary" size="lg" variant="flat">
          {talleres?.length || 0} Talleres
        </Chip>
      </div>

      {/* Search */}
      <Input
        classNames={{
          base: "max-w-full sm:max-w-[300px]",
        }}
        placeholder="Buscar taller..."
        startContent={<Search size={18} />}
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      {/* Talleres Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTalleres?.map((taller) => (
          <TallerCard key={taller.id} taller={taller} />
        ))}
      </div>

      {filteredTalleres?.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center justify-center p-12">
            <BookOpen className="mb-4 text-default-300" size={48} />
            <p className="font-medium text-default-500">
              No se encontraron talleres
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function TallerCard({ taller }: { taller: TallerProfesor }) {
  const navigate = useNavigate();

  return (
    <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <CardBody className="gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{taller.nombre}</h3>
            {taller.descripcion && (
              <p className="text-sm text-default-500 line-clamp-2">
                {taller.descripcion}
              </p>
            )}
          </div>
          <Chip
            color={taller.estado === "activo" ? "success" : "default"}
            size="sm"
            variant="dot"
          >
            {taller.estado}
          </Chip>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Users className="text-primary" size={16} />
            </div>
            <div>
              <p className="text-xs text-default-400">Alumnos</p>
              <p className="text-sm font-semibold">{taller.total_alumnos}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-secondary-50 rounded-lg">
              <Calendar className="text-secondary" size={16} />
            </div>
            <div>
              <p className="text-xs text-default-400">Horarios</p>
              <p className="text-sm font-semibold">{taller.total_horarios}</p>
            </div>
          </div>
        </div>

        {/* Action */}
        <Button
          fullWidth
          color="primary"
          size="sm"
          variant="flat"
          onPress={() => navigate(`/talleres/${taller.id}`)}
        >
          Ver Detalle
        </Button>
      </CardBody>
    </Card>
  );
}

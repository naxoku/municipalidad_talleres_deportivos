import { useState, useMemo } from "react";
import { Card, CardBody, Spinner, Input } from "@heroui/react";
import { BookOpen, Users, Calendar, Search, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/auth";
import { profesorApi, type TallerProfesor } from "@/api/profesor";

export default function ProfesorTalleresPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: talleres, isLoading } = useQuery({
    queryKey: ["profesor", "talleres", user?.profesor_id],
    queryFn: () => profesorApi.getTalleres(user!.profesor_id!),
    enabled: !!user?.profesor_id,
  });

  const talleresList = useMemo(() => {
    if (!talleres) return [] as TallerProfesor[];
    if (Array.isArray(talleres)) return talleres as TallerProfesor[];
    if (Array.isArray((talleres as any).datos))
      return (talleres as any).datos as TallerProfesor[];
    if (Array.isArray((talleres as any).value))
      return (talleres as any).value as TallerProfesor[];
    if (Array.isArray((talleres as any).data?.datos))
      return (talleres as any).data.datos as TallerProfesor[];

    return [] as TallerProfesor[];
  }, [talleres]);

  const filteredTalleres = talleresList?.filter((taller) =>
    taller.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner label="Cargando..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Mis talleres
            </h1>
            <p className="text-sm text-muted-foreground">
              Talleres que actualmente impartes
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          classNames={{
            base: "w-full",
            inputWrapper: "h-12 bg-card shadow-sm",
          }}
          placeholder="Buscar taller..."
          radius="lg"
          size="lg"
          startContent={<Search className="text-muted-foreground" size={20} />}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredTalleres?.length || 0} talleres
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTalleres?.map((taller) => (
          <TallerCard key={taller.id} taller={taller} />
        ))}
      </div>

      {filteredTalleres?.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="text-muted-foreground mx-auto mb-4" size={48} />
          <p className="font-medium text-lg mb-2">No se encontraron talleres</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "Intenta con otro término de búsqueda"
              : "Aún no tienes talleres asignados"}
          </p>
        </div>
      )}
    </div>
  );
}

function TallerCard({ taller }: { taller: TallerProfesor }) {
  const navigate = useNavigate();

  return (
    <Card
      isPressable
      className="border-l-4 border-l-primary hover:border-l-primary-600 hover:shadow-lg transition-all duration-200 w-full"
      onPress={() => navigate(`/panel-profesor/talleres/${taller.id}`)}
    >
      <CardBody className="flex flex-row items-center gap-4 p-6">
        <div className="p-3 bg-primary-100 rounded-lg flex-shrink-0">
          <BookOpen className="text-primary" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-2 truncate">{taller.nombre}</h3>
          <div className="flex items-center gap-6 text-sm text-default-500">
            <div className="flex items-center gap-1">
              <Users className="text-success" size={16} />
              <span className="font-medium text-foreground">
                {taller.total_alumnos}
              </span>
              <span>alumnos</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="text-secondary" size={16} />
              <span className="font-medium text-foreground">
                {taller.total_horarios}
              </span>
              <span>horarios</span>
            </div>
          </div>
        </div>
        <ChevronRight className="text-primary flex-shrink-0" size={20} />
      </CardBody>
    </Card>
  );
}

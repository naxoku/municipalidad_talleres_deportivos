import { BookOpen, CheckCircle, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";

const Dashboard = () => {
  const navigate = useNavigate();
  const isCurrent = true; // Example value, replace with actual logic
  const clase = { horario_id: "123" }; // Example value, replace with actual logic

  return (
    <div>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Acciones rápidas</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              className="h-20"
              color="primary"
              variant="flat"
              onPress={() => navigate("/profesor/talleres")}
            >
              <div className="flex flex-col items-center gap-2">
                <BookOpen size={24} />
                <span className="text-sm font-semibold">Ver mis talleres</span>
              </div>
            </Button>

            <Button
              className="h-20 border-2 border-success"
              color="success"
              variant="flat"
              onPress={() => navigate("/profesor/clases-asistencia")}
            >
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={24} />
                <span className="text-sm font-semibold">Pasar Asistencia</span>
                <span className="text-xs opacity-80">
                  Marca presentes/ausentes
                </span>
              </div>
            </Button>

            <Button
              className="h-20"
              color="warning"
              variant="flat"
              onPress={() => navigate("/profesor/planificacion")}
            >
              <div className="flex flex-col items-center gap-2">
                <FileText size={24} />
                <span className="text-sm font-semibold">Planificación</span>
              </div>
            </Button>

            <Button
              className="h-20"
              color="secondary"
              variant="flat"
              onPress={() => navigate("/profesor/alumnos")}
            >
              <div className="flex flex-col items-center gap-2">
                <Users size={24} />
                <span className="text-sm font-semibold">Mis alumnos</span>
              </div>
            </Button>
          </div>
        </CardBody>
      </Card>

      {isCurrent && (
        <Button
          className="mt-2"
          color="success"
          size="sm"
          variant="solid"
          onPress={() =>
            navigate(`/profesor/clases-asistencia?horario=${clase.horario_id}`)
          }
        >
          ✓ Pasar Asistencia Ahora
        </Button>
      )}

      {/* ... rest of code here ... */}
    </div>
  );
};

export default Dashboard;

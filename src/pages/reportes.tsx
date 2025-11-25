import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import {
  Download,
  BarChart3,
  TrendingUp,
  Users,
  User,
  MapPin,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { showToast } from "@/lib/toast";

export function ReportsSection() {
  const navigate = useNavigate();
  // use showToast wrapper for toasts

  const reportTypes = [
    {
      title: "Asistencia General",
      description: "Reportes de asistencia por taller, profesor o período",
      icon: BarChart3,
      color: "primary" as const,
      formats: ["Excel", "PDF", "CSV"],
    },
    {
      title: "Estadísticas de Talleres",
      description: "Cupos, asistencia promedio, rendimiento",
      icon: TrendingUp,
      color: "success" as const,
      formats: ["Excel", "PDF"],
    },
    {
      title: "Lista de Alumnos",
      description: "Contactos, talleres inscritos, historial",
      icon: Users,
      color: "warning" as const,
      formats: ["Excel", "CSV", "PDF"],
    },
    {
      title: "Carga de Profesores",
      description: "Horas semanales, talleres asignados",
      icon: User,
      color: "secondary" as const,
      formats: ["Excel", "PDF"],
    },
    {
      title: "Uso de Espacios",
      description: "Ocupación de ubicaciones por horario",
      icon: MapPin,
      color: "primary" as const,
      formats: ["Excel", "PDF"],
    },
    {
      title: "Reportes Personalizados",
      description: "Filtros avanzados y consultas específicas",
      icon: FileText,
      color: "success" as const,
      formats: ["Excel", "CSV", "PDF"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Reportes y Exportación</h2>
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<Download size={16} />}
            variant="flat"
            onPress={() => navigate("/reportes")}
          >
            Exportar Todo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div
                className={`p-3 rounded-lg bg-${report.color}/10 text-${report.color} w-fit`}
              >
                <report.icon size={24} />
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
              <p className="text-sm text-default-500 mb-4">
                {report.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {report.formats.map((format, idx) => (
                  <Chip key={idx} size="sm" variant="bordered">
                    {format}
                  </Chip>
                ))}
              </div>
              <Button
                className="w-full"
                color={report.color}
                size="sm"
                variant="flat"
                onPress={() =>
                  showToast({
                    title: `Generando: ${report.title}`,
                    color: "primary",
                  })
                }
              >
                Generar Reporte
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-default-500">
            Genera y exporta reportes del sistema
          </p>
        </div>
      </div>
      <ReportsSection />
    </div>
  );
}

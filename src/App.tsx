import { Route, Routes, Navigate } from "react-router-dom";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ReportsPage from "@/pages/reportes";
import TalleresPage from "@/pages/talleres/index";
import TallerDetailPage from "@/pages/talleres/detail";
import AlumnosPage from "@/pages/alumnos/index";
import ProfesorTalleresPage from "@/pages/profesor/talleres";
import ProfesorHorariosPage from "@/pages/profesor/horarios";
import ClasesHorarioPage from "@/pages/profesor/clases-horario";
import DetalleClasePage from "@/pages/profesor/detalle-clase";
import ProfesorAlumnosPage from "@/pages/profesor/alumnos";
import ProfesorPlanificacionPage from "@/pages/profesor/planificacion";
import ProfesorAsistenciaPage from "@/pages/profesor/asistencia";
import ClasesAsistenciaPage from "@/pages/profesor/clases-asistencia";
import AlumnoViewPage from "@/pages/alumnos/[id]";
import HorariosPage from "@/pages/horarios/index";
import HorarioViewPage from "@/pages/horarios/[id]";
import ProfesoresPage from "@/pages/profesores/index";
import ProfesorViewPage from "@/pages/profesores/[id]";
import MainLayout from "@/layouts/main";
import { useAuth } from "@/context/auth";
import { ProtectedRoute, AuthLoader } from "@/components/ProtectedRoute";

const AppProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "admin" | "profesor" | ("admin" | "profesor")[];
}) => {
  const { isAuthenticated, isAuthReady } = useAuth();

  // Si el proveedor de auth aún no terminó de inicializar, mostrar loader
  if (!isAuthReady) return <AuthLoader />;

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />

      {/* Rutas accesibles para todos los usuarios autenticados */}
      <Route
        element={
          <AppProtectedRoute>
            <DashboardPage />
          </AppProtectedRoute>
        }
        path="/dashboard"
      />
      {/* Rutas específicas para profesores */}
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <ProfesorTalleresPage />
          </AppProtectedRoute>
        }
        path="/profesor/talleres"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <ProfesorHorariosPage />
          </AppProtectedRoute>
        }
        path="/profesor/horarios"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <ClasesHorarioPage />
          </AppProtectedRoute>
        }
        path="/profesor/horarios/:horarioId/clases"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <DetalleClasePage />
          </AppProtectedRoute>
        }
        path="/profesor/clases/:claseId"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <ProfesorAlumnosPage />
          </AppProtectedRoute>
        }
        path="/profesor/alumnos"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <ProfesorPlanificacionPage />
          </AppProtectedRoute>
        }
        path="/profesor/planificacion"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <ProfesorAsistenciaPage />
          </AppProtectedRoute>
        }
        path="/profesor/asistencia"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="profesor">
            <ClasesAsistenciaPage />
          </AppProtectedRoute>
        }
        path="/profesor/clases-asistencia"
      />

      {/* Rutas para talleres y alumnos (admin y profesor comparten) */}
      <Route
        element={
          <AppProtectedRoute>
            <TalleresPage />
          </AppProtectedRoute>
        }
        path="/talleres"
      />
      <Route
        element={
          <AppProtectedRoute>
            <TallerDetailPage />
          </AppProtectedRoute>
        }
        path="/talleres/:id"
      />
      <Route
        element={
          <AppProtectedRoute>
            <AlumnosPage />
          </AppProtectedRoute>
        }
        path="/alumnos"
      />
      <Route
        element={
          <AppProtectedRoute>
            <AlumnoViewPage />
          </AppProtectedRoute>
        }
        path="/alumnos/:id"
      />
      <Route
        element={
          <AppProtectedRoute>
            <HorariosPage />
          </AppProtectedRoute>
        }
        path="/horarios"
      />
      <Route
        element={
          <AppProtectedRoute>
            <HorarioViewPage />
          </AppProtectedRoute>
        }
        path="/horarios/:id"
      />

      {/* Rutas solo para administradores */}
      <Route
        element={
          <AppProtectedRoute requiredRole="admin">
            <ReportsPage />
          </AppProtectedRoute>
        }
        path="/reportes"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="admin">
            <ProfesoresPage />
          </AppProtectedRoute>
        }
        path="/profesores"
      />
      <Route
        element={
          <AppProtectedRoute requiredRole="admin">
            <ProfesorViewPage />
          </AppProtectedRoute>
        }
        path="/profesores/:id"
      />

      <Route element={<Navigate replace to="/dashboard" />} path="/" />
    </Routes>
  );
}

export default App;

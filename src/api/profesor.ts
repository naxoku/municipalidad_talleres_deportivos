import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost/talleres_backend";

// Tipos para Profesor
export interface TallerProfesor {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: string;
  edad_min: number | null;
  edad_max: number | null;
  genero: string;
  cupos_max: number;
  estado: string;
  imagen_url: string | null;
  total_horarios: number;
  total_alumnos: number;
  horarios: string[];
}

export interface AlumnoProfesor {
  id: number;
  rut: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  genero: string;
  edad: number;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  nombre_apoderado: string | null;
  telefono_apoderado: string | null;
  email_apoderado: string | null;
  talleres: string;
  total_inscripciones: number;
}

export interface DashboardProfesor {
  total_talleres: number;
  total_alumnos: number;
  clases_hoy: ClaseHoy[];
  asistencia_promedio: number;
}

export interface ClaseHoy {
  horario_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  taller_id: number;
  taller_nombre: string;
  cupos_max: number;
  ubicacion_nombre: string;
  total_inscritos: number;
}

export const profesorApi = {
  // Obtener talleres del profesor
  getTalleres: async (profesorId: number): Promise<TallerProfesor[]> => {
    const response = await axios.get(
      `${API_URL}/api/profesor_talleres.php?profesor_id=${profesorId}`,
    );

    return response.data;
  },

  // Obtener alumnos del profesor
  getAlumnos: async (profesorId: number): Promise<AlumnoProfesor[]> => {
    const response = await axios.get(
      `${API_URL}/api/profesor_alumnos.php?profesor_id=${profesorId}`,
    );

    return response.data;
  },

  // Obtener dashboard del profesor
  getDashboard: async (profesorId: number): Promise<DashboardProfesor> => {
    const response = await axios.get(
      `${API_URL}/api/profesor_dashboard.php?profesor_id=${profesorId}`,
    );

    return response.data;
  },
};

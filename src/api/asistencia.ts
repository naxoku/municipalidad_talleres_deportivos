import api from "./axios";

export interface HorarioAsistencia {
  id: number;
  taller_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  taller_nombre: string;
  ubicacion_nombre: string;
  total_alumnos: number;
}

export interface AlumnoAsistencia {
  id: number;
  rut: string;
  nombre: string;
  apellidos: string;
  nombre_completo: string;
  presente: boolean;
  asistencia_id?: number;
  telefono?: string;
  telefono_emergencia?: string;
}

export interface GuardarAsistenciaRequest {
  horario_id: number;
  fecha: string;
  asistencias: Array<{
    alumno_id: number;
    presente: boolean;
  }>;
}

export const asistenciaApi = {
  getHorariosConAlumnos: async (
    profesor_id: number,
  ): Promise<HorarioAsistencia[]> => {
    const response = await api.get(
      `/api/profesor_asistencia.php?action=horarios_con_alumnos&profesor_id=${profesor_id}`,
    );

    return response.data.datos || response.data;
  },

  getAlumnosPorHorario: async (
    horario_id: number,
  ): Promise<AlumnoAsistencia[]> => {
    const response = await api.get(
      `/api/profesor_asistencia.php?action=alumnos_por_horario&horario_id=${horario_id}`,
    );

    return response.data.datos || response.data;
  },

  getAsistenciaFecha: async (
    horario_id: number,
    fecha: string,
  ): Promise<AlumnoAsistencia[]> => {
    const response = await api.get(
      `/api/profesor_asistencia.php?action=asistencia_fecha&horario_id=${horario_id}&fecha=${fecha}`,
    );

    return response.data.datos || response.data;
  },

  guardarAsistencia: async (
    data: GuardarAsistenciaRequest,
  ): Promise<{ mensaje: string }> => {
    const response = await api.post(
      "/api/profesor_asistencia.php?action=guardar_asistencia",
      data,
    );

    return response.data;
  },
};

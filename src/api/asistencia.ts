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

export interface AsistenciaResponse {
  alumnos: AlumnoAsistencia[];
  es_editable: boolean;
  fecha: string;
  mensaje: string;
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
  ): Promise<AsistenciaResponse> => {
    const response = await api.get(
      `/api/profesor_asistencia.php?action=asistencia_fecha&horario_id=${horario_id}&fecha=${fecha}`,
    );

    const data = response.data.datos || response.data;

    // Manejar formato antiguo (array) y nuevo (objeto con alumnos)
    if (Array.isArray(data)) {
      // usar fecha local para coherencia con frontend
      const hoy = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");

        return `${y}-${m}-${dd}`;
      })();

      return {
        alumnos: data,
        es_editable: fecha >= hoy,
        fecha,
        mensaje:
          fecha < hoy
            ? "Esta clase ya pasó. Los datos son de solo lectura."
            : "",
      };
    }

    return data;
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

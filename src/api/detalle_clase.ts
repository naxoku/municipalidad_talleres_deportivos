import axios from "./axios";

export interface DetalleClase {
  id: number;
  horario_id: number;
  taller_id: number;
  fecha_clase: string;
  objetivo: string;
  actividades: string;
  observaciones: string;
  fecha_creacion: string;
  ultima_modificacion: string;
  taller_nombre: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion_nombre?: string;
  asistentes_presentes?: number;
  asistentes_total?: number;
  estado?: "en_curso" | "margen_extra" | "editable" | "pasada";
  tiempo_restante_segundos?: number | null;
  puede_pasar_asistencia?: boolean;
}

export interface DetalleClaseForm {
  horario_id: number;
  taller_id: number;
  fecha_clase: string;
  objetivo: string;
  actividades: string;
  observaciones: string;
  profesor_id?: number;
}

export interface DetalleClaseFilters {
  profesor_id?: number;
  horario_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface ClasesPorHorarioResponse {
  horario: {
    id: number;
    taller_id: number;
    profesor_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    taller_nombre: string;
    ubicacion_nombre: string;
  };
  clases: DetalleClase[];
}

export interface ClaseHistorial extends Omit<DetalleClase, "id"> {
  id: number | null;
  tiene_detalle: boolean;
}

export const detalleClaseApi = {
  getDetalles: async (
    filters?: DetalleClaseFilters,
  ): Promise<DetalleClase[]> => {
    const params = new URLSearchParams();

    if (filters?.profesor_id) {
      params.append("profesor_id", filters.profesor_id.toString());
    }
    if (filters?.horario_id) {
      params.append("horario_id", filters.horario_id.toString());
    }
    if (filters?.fecha_desde) {
      params.append("fecha_desde", filters.fecha_desde);
    }
    if (filters?.fecha_hasta) {
      params.append("fecha_hasta", filters.fecha_hasta);
    }

    const response = await axios.get<DetalleClase[]>(
      `/api/detalle_clase.php?${params.toString()}`,
    );

    return response.data;
  },

  getHistorial: async (profesor_id: number): Promise<ClaseHistorial[]> => {
    const response = await axios.get<ClaseHistorial[]>(
      `/api/detalle_clase.php?action=historial&profesor_id=${profesor_id}`,
    );

    return response.data;
  },

  getDetalleById: async (id: number): Promise<DetalleClase> => {
    const response = await axios.get<DetalleClase>(
      `/api/detalle_clase.php?id=${id}`,
    );

    return response.data;
  },

  createDetalle: async (
    data: DetalleClaseForm,
  ): Promise<{ success: boolean; id: number; message: string }> => {
    const response = await axios.post<{
      success: boolean;
      id: number;
      message: string;
    }>("/api/detalle_clase.php", data);

    return response.data;
  },

  updateDetalle: async (
    id: number,
    data: Partial<DetalleClaseForm> & { id: number },
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axios.put<{ success: boolean; message: string }>(
      "/api/detalle_clase.php",
      { ...data, id },
    );

    return response.data;
  },

  deleteDetalle: async (
    id: number,
    profesor_id?: number,
  ): Promise<{ success: boolean; message: string }> => {
    const params = new URLSearchParams();

    params.append("id", id.toString());
    if (profesor_id) {
      params.append("profesor_id", profesor_id.toString());
    }

    const response = await axios.delete<{ success: boolean; message: string }>(
      `/api/detalle_clase.php?${params.toString()}`,
    );

    return response.data;
  },

  getClasesPorHorario: async (
    horario_id: number,
  ): Promise<ClasesPorHorarioResponse> => {
    // Si el horario_id no es válido, evitar llamar al backend y retornar una estructura vacía
    if (!Number.isFinite(horario_id) || horario_id <= 0) {
      return {
        horario: {
          id: 0,
          taller_id: 0,
          profesor_id: 0,
          dia_semana: "",
          hora_inicio: "",
          hora_fin: "",
          taller_nombre: "",
          ubicacion_nombre: "",
        },
        clases: [],
      } as ClasesPorHorarioResponse;
    }

    const response = await axios.get<{ datos: ClasesPorHorarioResponse }>(
      `/api/clases.php?action=por_horario&horario_id=${horario_id}`,
    );

    return response.data.datos;
  },
};

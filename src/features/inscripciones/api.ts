import api from "@/api/axios";

export const inscripcionesFeatureApi = {
  getAll: async () => {
    const response = await api.get("/api/inscripciones.php?action=listar");

    return response.data.datos || response.data;
  },

  crear: async (data: {
    alumno_id: number;
    taller_id: number;
    horario_id?: number;
  }) => {
    const response = await api.post(
      "/api/inscripciones.php?action=crear",
      data,
    );

    return response.data.datos || response.data;
  },

  actualizar: async (
    id: number,
    data: Partial<{ horario_id: number; taller_id: number }>,
  ) => {
    const response = await api.put(
      `/api/inscripciones.php?action=actualizar&id=${id}`,
      data,
    );

    return response.data.datos || response.data;
  },

  eliminar: async (id: number) => {
    const response = await api.delete(
      `/api/inscripciones.php?action=eliminar&id=${id}`,
    );

    return response.data.datos || response.data;
  },
};

import api from "@/api/axios";
import { Profesor } from "@/types/schema";

export const profesoresFeatureApi = {
  getAll: async (): Promise<Profesor[]> => {
    const response = await api.get("/api/profesores.php?action=listar");

    return response.data.datos || response.data;
  },

  getById: async (id: number): Promise<Profesor> => {
    const response = await api.get(
      `/api/profesores.php?action=obtener&id=${id}`,
    );

    return response.data.datos || response.data;
  },

  create: async (profesor: Omit<Profesor, "id">): Promise<Profesor> => {
    const response = await api.post(
      `/api/profesores.php?action=crear`,
      profesor,
    );

    return response.data;
  },

  update: async (
    id: number,
    profesor: Partial<Profesor>,
  ): Promise<Profesor> => {
    const response = await api.put(
      `/api/profesores.php?action=actualizar&id=${id}`,
      profesor,
    );

    return response.data;
  },

  getTalleres: async (id: number) => {
    const response = await api.get(
      `/api/profesores.php?action=talleres&id=${id}`,
    );

    return response.data.datos || response.data;
  },

  getHorarios: async (id: number) => {
    const response = await api.get(
      `/api/profesores.php?action=horarios&id=${id}`,
    );

    return response.data.datos || response.data;
  },

  getAlumnos: async (id: number) => {
    const response = await api.get(
      `/api/profesores.php?action=alumnos&id=${id}`,
    );

    return response.data.datos || response.data;
  },

  getClases: async (id: number) => {
    const response = await api.get(
      `/api/profesores.php?action=clases&id=${id}`,
    );

    return response.data.datos || response.data;
  },
};

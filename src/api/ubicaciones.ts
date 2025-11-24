import api from "./axios";

import { Ubicacion } from "@/types/schema";

export const ubicacionesApi = {
  getAll: async (): Promise<Ubicacion[]> => {
    const response = await api.get("/api/ubicaciones.php?action=listar");

    return response.data.datos || response.data;
  },

  getById: async (id: number): Promise<Ubicacion> => {
    const response = await api.get(
      `/api/ubicaciones.php?action=obtener&id=${id}`,
    );

    return response.data.datos || response.data;
  },

  create: async (ubicacion: Omit<Ubicacion, "id">): Promise<Ubicacion> => {
    const response = await api.post(
      "/api/ubicaciones.php?action=crear",
      ubicacion,
    );

    return response.data;
  },

  update: async (
    id: number,
    ubicacion: Partial<Ubicacion>,
  ): Promise<Ubicacion> => {
    const response = await api.put(
      `/api/ubicaciones.php?action=actualizar&id=${id}`,
      ubicacion,
    );

    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ubicaciones.php?action=eliminar&id=${id}`);
  },
};

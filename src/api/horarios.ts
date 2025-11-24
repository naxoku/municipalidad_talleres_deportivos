import api from "./axios";

import { Horario } from "@/types/schema";

export const horariosApi = {
  getAll: async (): Promise<Horario[]> => {
    const response = await api.get("/api/horarios.php?action=listar");

    return response.data.datos || response.data;
  },

  getById: async (id: number): Promise<Horario> => {
    const response = await api.get(`/api/horarios.php?action=obtener&id=${id}`);

    return response.data.datos || response.data;
  },

  update: async (id: number, data: Partial<Horario>): Promise<Horario> => {
    const response = await api.post("/api/horarios.php?action=actualizar", {
      id,
      ...data,
    });

    return response.data.datos || response.data;
  },

  getAlumnos: async (id: number): Promise<any[]> => {
    const response = await api.get(`/api/horarios.php?action=alumnos&id=${id}`);

    return response.data.datos || response.data;
  },

  getClases: async (id: number): Promise<any[]> => {
    const response = await api.get(`/api/horarios.php?action=clases&id=${id}`);

    return response.data.datos || response.data;
  },
};

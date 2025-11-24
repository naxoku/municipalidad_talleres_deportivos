import api from "./axios";

import { Taller } from "@/types/schema";

export const talleresApi = {
  getAll: async (): Promise<Taller[]> => {
    const response = await api.get("/api/talleres.php?action=listar");
    const data = response.data.datos || response.data;

    // Mapear campos del backend al formato del frontend
    return data.map((taller: any) => ({
      id: parseInt(taller.id),
      nombre: taller.nombre,
      descripcion: taller.descripcion || "",
      activo: true, // Por defecto activo
      inscritos_count: 0, // Se puede obtener de otro endpoint
      horarios_count: parseInt(taller.horarios_count) || 0,
      alumnos_count: parseInt(taller.alumnos_count) || 0,
      profesores: taller.profesores || [],
      profesor: taller.profesores?.[0]?.nombre || "Sin asignar", // Para compatibilidad
    }));
  },

  getById: async (id: number): Promise<Taller> => {
    const response = await api.get(`/api/talleres.php?action=obtener&id=${id}`);
    const data = response.data.datos || response.data;

    // Mapear campos del backend al formato del frontend
    return {
      id: parseInt(data.id),
      nombre: data.nombre,
      descripcion: data.descripcion || "",
      activo: data.activo === 1 || data.activo === true,
      profesor: data.profesor || "Sin asignar",
      ubicacion_principal: data.ubicacion_principal || "Sin ubicación",
      inscritos_count: 0, // Se puede obtener de otro endpoint
      horarios_count: 0, // Se puede obtener de otro endpoint
      alumnos_count: 0, // Se puede obtener de otro endpoint
    };
  },

  getHorarios: async (id: number) => {
    const response = await api.get(
      `/api/horarios.php?action=por_taller&taller_id=${id}`,
    );

    const data = response.data.datos || response.data;

    return Array.isArray(data) ? data : [];
  },

  getAlumnos: async (id: number) => {
    const response = await api.get(
      `/api/inscripciones.php?action=por_taller&taller_id=${id}`,
    );

    const data = response.data.datos || response.data;

    return Array.isArray(data) ? data : [];
  },

  getClases: async (id: number) => {
    const response = await api.get(
      `/api/clases.php?action=por_taller&taller_id=${id}`,
    );

    const data = response.data.datos || response.data;

    return Array.isArray(data) ? data : [];
  },

  create: async (taller: Omit<Taller, "id">): Promise<Taller> => {
    const response = await api.post("/api/talleres.php?action=crear", taller);

    return response.data;
  },

  update: async (id: number, taller: Partial<Taller>): Promise<Taller> => {
    const response = await api.put(
      `/api/talleres.php?action=actualizar&id=${id}`,
      taller,
    );

    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/talleres.php?action=eliminar&id=${id}`);
  },
};

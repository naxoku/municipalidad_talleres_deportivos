import api from "@/api/axios";
import { Taller } from "@/types/schema";

export const talleresFeatureApi = {
  getAll: async (): Promise<Taller[]> => {
    const response = await api.get("/api/talleres.php?action=listar");
    const data = response.data.datos || response.data;

    return data.map((taller: any) => ({
      id: parseInt(taller.id),
      nombre: taller.nombre,
      descripcion: taller.descripcion || "",
      activo: true,
      inscritos_count: 0,
      horarios_count: parseInt(taller.horarios_count) || 0,
      alumnos_count: parseInt(taller.alumnos_count) || 0,
      profesores: taller.profesores || [],
      profesor: taller.profesores?.[0]?.nombre || "Sin asignar",
    }));
  },

  getById: async (id: number): Promise<Taller> => {
    const response = await api.get(`/api/talleres.php?action=obtener&id=${id}`);
    const data = response.data.datos || response.data;

    return {
      id: parseInt(data.id),
      nombre: data.nombre,
      descripcion: data.descripcion || "",
      activo: data.activo === 1 || data.activo === true,
      profesor: data.profesor || "Sin asignar",
      ubicacion_principal: data.ubicacion_principal || "Sin ubicación",
      inscritos_count: 0,
      horarios_count: 0,
      alumnos_count: 0,
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

    // Mapear los datos para normalizar nombres de campos y exponer propiedades
    if (Array.isArray(data)) {
      return data.map((clase: any) => ({
        ...clase,
        // mantener ambas propiedades para compatibilidad: `fecha_clase` y `fecha`
        fecha_clase: clase.fecha_clase || clase.fecha || null,
        fecha: clase.fecha || clase.fecha_clase || null,

        // conservar horas si vienen desde la API
        hora_inicio: clase.hora_inicio || null,
        hora_fin: clase.hora_fin || null,

        // normalizar conteos de asistentes
        asistentes_presentes:
          clase.asistentes_presentes ?? clase.asistentes ?? 0,
        asistentes_total: clase.asistentes_total ?? clase.total ?? 0,

        // mantener aliases antiguos por compatibilidad con UI
        asistentes: clase.asistentes_presentes ?? clase.asistentes ?? 0,
        total: clase.asistentes_total ?? clase.total ?? 0,

        // estado (si viene)
        estado: clase.estado || clase.estado_clase || null,
      }));
    }

    return [];
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

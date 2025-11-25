import api from "@/api/axios";
import { Alumno } from "@/types/schema";

export const alumnosFeatureApi = {
  getAll: async (): Promise<Alumno[]> => {
    const response = await api.get("/api/alumnos.php?action=listar");
    const data = response.data.datos || response.data;

    return data.map((alumno: any) => ({
      id: alumno.id,
      rut: alumno.rut,
      nombre: alumno.nombres,
      apellidos: alumno.apellidos,
      fecha_nacimiento: alumno.fecha_nacimiento,
      genero: alumno.sexo,
      telefono: alumno.telefono || "",
      telefono_emergencia: alumno.telefono_emergencia || "",
      observaciones: alumno.observaciones || "",
      correo_electronico: alumno.correo_electronico || "",
      direccion: alumno.direccion || "",
      colegio: alumno.colegio || "",
      curso: alumno.curso || "",
      tutor_nombre: alumno.tutor_nombre || "",
      tutor_telefono: alumno.tutor_telefono || "",
      autorizo_imagenes: Boolean(alumno.autorizo_imagenes),
      notificaciones_movil: Boolean(alumno.notificaciones_movil),
      edad: alumno.edad,
      fecha_inscripcion: alumno.inscripcion,
    }));
  },

  getById: async (id: number): Promise<Alumno> => {
    const response = await api.get(`/api/alumnos.php?action=obtener&id=${id}`);
    const alumno = response.data.datos || response.data;

    return {
      id: alumno.id,
      rut: alumno.rut,
      nombre: alumno.nombres,
      apellidos: alumno.apellidos,
      fecha_nacimiento: alumno.fecha_nacimiento,
      genero: alumno.sexo,
      telefono: alumno.telefono || "",
      telefono_emergencia: alumno.telefono_emergencia || "",
      observaciones: alumno.observaciones || "",
      correo_electronico: alumno.correo_electronico || "",
      direccion: alumno.direccion || "",
      colegio: alumno.colegio || "",
      curso: alumno.curso || "",
      tutor_nombre: alumno.tutor_nombre || "",
      tutor_telefono: alumno.tutor_telefono || "",
      autorizo_imagenes: Boolean(alumno.autorizo_imagenes),
      notificaciones_movil: Boolean(alumno.notificaciones_movil),
      edad: alumno.edad,
      fecha_inscripcion: alumno.inscripcion,
    };
  },

  getTalleres: async (id: number) => {
    const response = await api.get(`/api/alumnos.php?action=talleres&id=${id}`);
    const data = response.data.datos || response.data || [];

    return (data as any[]).map((insc: any) => ({
      id: insc.id,
      alumno_id: insc.alumno_id,
      horario_id: insc.horario_id,
      fecha_inscripcion: insc.fecha_inscripcion,
      horario: insc.horario
        ? {
            id: insc.horario.id || insc.horario_id,
            taller_id: insc.horario.taller_id || insc.taller_id,
            profesor_id: insc.horario.profesor_id || insc.profesor_id,
            dia_semana: insc.horario.dia_semana,
            hora_inicio: insc.horario.hora_inicio,
            hora_fin: insc.horario.hora_fin,
            ubicacion_id: insc.horario.ubicacion_id || insc.ubicacion_id,
            taller:
              insc.horario.taller ||
              (insc.taller_id
                ? {
                    id: insc.taller_id,
                    nombre: insc.taller_nombre,
                    descripcion: insc.taller_descripcion,
                  }
                : null),
            profesor:
              insc.horario.profesor ||
              (insc.profesor_id
                ? {
                    id: insc.profesor_id,
                    nombre: insc.profesor_nombre,
                  }
                : null),
            ubicacion:
              insc.horario.ubicacion ||
              (insc.ubicacion_id
                ? {
                    id: insc.ubicacion_id,
                    nombre: insc.ubicacion_nombre,
                  }
                : null),
          }
        : insc.horario_id
          ? {
              id: insc.horario_id,
              taller_id: insc.taller_id,
              profesor_id: insc.profesor_id,
              dia_semana: insc.dia_semana,
              hora_inicio: insc.hora_inicio,
              hora_fin: insc.hora_fin,
              ubicacion_id: insc.ubicacion_id,
              taller: insc.taller_id
                ? {
                    id: insc.taller_id,
                    nombre: insc.taller_nombre,
                    descripcion: insc.taller_descripcion,
                  }
                : null,
              profesor: insc.profesor_id
                ? {
                    id: insc.profesor_id,
                    nombre: insc.profesor_nombre,
                  }
                : null,
              ubicacion: insc.ubicacion_id
                ? {
                    id: insc.ubicacion_id,
                    nombre: insc.ubicacion_nombre,
                  }
                : null,
            }
          : null,
      taller_id:
        insc.taller_id ||
        (insc.horario && insc.horario.taller_id) ||
        insc.horario?.taller?.id,
      taller:
        insc.taller ||
        insc.horario?.taller ||
        (insc.taller_id
          ? {
              id: insc.taller_id,
              nombre: insc.taller_nombre,
              descripcion: insc.taller_descripcion,
            }
          : null),
    }));
  },

  getAsistencia: async (id: number) => {
    const response = await api.get(
      `/api/alumnos.php?action=asistencia&id=${id}`,
    );

    return response.data.datos || response.data;
  },

  create: async (alumno: Alumno): Promise<Alumno> => {
    const response = await api.post("/api/alumnos.php?action=crear", alumno);

    return response.data;
  },

  update: async (id: number, alumno: Partial<Alumno>): Promise<Alumno> => {
    const response = await api.put(
      `/api/alumnos.php?action=actualizar&id=${id}`,
      alumno,
    );

    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/alumnos.php?action=eliminar&id=${id}`);
  },
};

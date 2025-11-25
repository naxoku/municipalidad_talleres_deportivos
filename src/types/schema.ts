export type Role = "admin" | "profesor";

export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: Role;
  token?: string;
  profesor_id?: number;
}

export interface Profesor {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  usuario_id?: number;
  estado?: string;
  talleres_asignados?: any[];
  carga_semanal?: number;
  clases_semana?: number;
  ultima_modificacion?: string;
}

export interface Ubicacion {
  id: number;
  nombre: string;
  direccion: string;
  tipo: "Cancha" | "Sala" | "Piscina" | "Otro";
}

export interface Horario {
  cupos_max: number | undefined;
  ubicacion_nombre: string;
  profesor_nombre: string;
  taller_nombre: string;
  id: number;
  taller_id: number;
  dia_semana:
    | "Lunes"
    | "Martes"
    | "Miércoles"
    | "Jueves"
    | "Viernes"
    | "Sábado"
    | "Domingo";
  hora_inicio: string;
  hora_fin: string;
  ubicacion_id: number;
  profesor_id: number;
  descripcion?: string;
  ubicacion?: Ubicacion;
  profesor?: Profesor;
}

export interface Taller {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  categoria?: string;
  capacidad_maxima?: number;
  ubicaciones?: Ubicacion[];
  updated_at?: string;
  horarios?: Horario[];
  inscritos_count?: number;
  horarios_count?: number;
  alumnos_count?: number;
  profesor?: Profesor | string; // Puede venir como objeto o nombre
  profesores?: Profesor[]; // Array de profesores asociados
  ubicacion_principal?: string;
}

export interface Alumno {
  id: number;
  rut: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  telefono_emergencia: string;
  observaciones: string;
  correo_electronico?: string;
  direccion?: string;
  colegio?: string;
  curso?: string;
  tutor_nombre?: string;
  tutor_telefono?: string;
  autorizo_imagenes?: boolean;
  notificaciones_movil?: boolean;
  fecha_inscripcion?: string;
  edad?: number;
  talleres_inscritos?: string[];
  ultima_modificacion?: string;
}

export interface Inscripcion {
  alumno_id: string; // RUT
  taller_id: number;
  fecha_inscripcion: string;
  estado: "Activa" | "Pausada" | "Retirado";
  alumno?: Alumno;
}

export interface Clase {
  id: number;
  fecha: string;
  horario_id: number;
  estado: "Programada" | "Realizada" | "Cancelada";
  planificacion?: string;
}

export interface Asistencia {
  clase_id: number;
  alumno_id: string;
  presente: boolean;
}

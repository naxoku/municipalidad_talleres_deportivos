// Tipos para la aplicación

export interface Profesor {
    id: number;
    nombre: string;
    telefono?: string;
    email?: string;
    usuario_id?: number;
    rol?: string;
    especialidad?: string;
}

export interface Estudiante {
    id: number;
    nombre: string;
    edad?: number;
    contacto?: string;
}

export interface Taller {
    id: number;
    nombre: string;
    descripcion?: string;
    profesores?: { id: number; nombre: string }[];
    // Optional fields populated client-side: ubicacion name and a readable horario string
    ubicacion?: string;
    horario?: string;
}

export interface Horario {
    id: number;
    taller_id: number;
    taller_nombre?: string;
    profesor_id?: number;
    profesor_nombre?: string;
    ubicacion_id?: number;
    ubicacion_nombre?: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cupos_max?: number;
    descripcion?: string;
}

export interface Clase {
    id: number;
    taller_id: number;
    taller_nombre?: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
}

export interface Inscripcion {
    id: number;
    estudiante_id: number;
    estudiante_nombre?: string;
    taller_id: number;
    taller_nombre?: string;
    fecha_inscripcion?: string;
}

export interface Asistencia {
    id: number;
    // En el esquema actual la asistencia se asocia a `horario_id` + `fecha` en lugar de `clase_id`
    clase_id?: number;
    horario_id?: number;
    fecha?: string;
    estudiante_id: number;
    estudiante_nombre?: string;
    presente: boolean;
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    mensaje?: string;
    datos?: T;
}

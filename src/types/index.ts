// Tipos para la aplicación

export interface Profesor {
    id: number;
    nombre: string;
    especialidad: string;
    email: string;
    usuario_id?: number;
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
    profesor_id?: number;
    profesor_nombre?: string;
}

export interface Horario {
    id: number;
    taller_id: number;
    taller_nombre?: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
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
    clase_id: number;
    estudiante_id: number;
    estudiante_nombre?: string;
    presente: boolean;
}

export interface Indumentaria {
    id: number;
    nombre: string;
    descripcion?: string;
    cantidad: number;
}

export interface IndumentariaTaller {
    id: number;
    indumentaria_id: number;
    indumentaria_nombre?: string;
    taller_id: number;
    taller_nombre?: string;
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    mensaje?: string;
    datos?: T;
}

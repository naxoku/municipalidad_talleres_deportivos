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
    nombres: string;
    apellidos: string;
    rut?: string;
    inscripcion?: string;
    sexo?: string;
    fecha_nacimiento?: string;
    telefono?: string;
    correo_electronico?: string;
    direccion?: string;
    curso?: string;
    colegio?: string;
    tutor_nombre?: string;
    tutor_rut?: string;
    tutor_telefono?: string;
    tutor_correo?: string;
    profesion?: string;
    notificaciones_movil?: boolean;
    autorizo_imagenes?: boolean;
    edad?: number;
}

export interface Taller {
    id: number;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
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
    horario_id: number;
    taller_id: number;
    fecha_clase: string;
    descripcion?: string;
    taller_nombre?: string;
    profesor_nombre?: string;
    dia_semana?: string;
    hora_inicio?: string;
    hora_fin?: string;
    fecha_creacion?: string;
    ultima_modificacion?: string;
}

export interface Inscripcion {
    id: number;
    estudiante_id: number;
    estudiante_nombre?: string;
    taller_id: number;
    taller_nombre?: string;
    horario_id?: number;
    horario_descripcion?: string;
    fecha_inscripcion?: string;
}

export interface Asistencia {
    id: number;
    horario_id: number;
    fecha: string;
    estudiante_id: number;
    estudiante_nombre?: string;
    presente: boolean;
    fecha_creacion?: string;
    ultima_modificacion?: string;
}

export interface Ubicacion {
    id: number;
    nombre: string;
    direccion?: string;
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    mensaje?: string;
    datos?: T;
}

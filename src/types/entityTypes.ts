// Tipos compartidos para componentes reutilizables de entidades
export type EntityType = 'taller' | 'alumno' | 'profesor';

export interface BaseEntity {
  id: number;
  nombre?: string;
  descripcion?: string;
  fecha_creacion?: string;
  activo?: boolean;
}

export interface Taller extends BaseEntity {
  nombre: string;
  descripcion?: string;
  horarios?: Horario[];
  alumnos?: Alumno[];
  profesores?: Profesor[];
  total_alumnos?: number;
  cupos_maximos?: number;
  asistencia_promedio?: number;
  estadisticas?: {
    capacidad_total: number;
    total_sesiones_30d: number;
    asistencia_promedio: number;
  };
}

export interface Alumno extends BaseEntity {
  nombres: string;
  apellidos?: string;
  rut?: string;
  edad?: number;
  telefono?: string;
  email?: string;
  tutor?: string;
  talleres?: Taller[];
  asistencia_promedio?: number;
}

export interface Profesor extends BaseEntity {
  nombre: string;
  especialidad: string;
  email: string;
  telefono?: string;
  talleres?: Taller[];
  horarios?: Horario[];
}

export interface Horario {
  id: number;
  taller_id: number;
  profesor_id?: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion?: string;
  cupos_max: number;
  fecha_creacion: string;
}

export interface Asistencia {
  id: number;
  estudiante_id: number;
  horario_id: number;
  fecha: string;
  presente: boolean;
  fecha_registro: string;
}

export interface Inscripcion {
  id: number;
  estudiante_id: number;
  taller_id: number;
  fecha_inscripcion: string;
}

// Props para componentes reutilizables
export interface DetailViewProps {
  entityType: EntityType;
  data: Taller | Alumno | Profesor;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate?: (path: string) => void;
}

export interface ListViewProps {
  entityType: EntityType;
  data: (Taller | Alumno | Profesor)[];
  onItemPress?: (item: Taller | Alumno | Profesor) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  renderItemActions?: (item: Taller | Alumno | Profesor) => React.ReactNode;
}

export interface EditFormProps {
  entityType: EntityType;
  data?: Taller | Alumno | Profesor;
  onSave: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface DeleteModalProps {
  visible: boolean;
  entityType: EntityType;
  entityName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}
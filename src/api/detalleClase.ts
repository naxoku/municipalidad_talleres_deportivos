import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { ApiResponse } from '../types';

export interface DetalleClase {
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
}

export const detalleClaseApi = {
  listar: async (): Promise<DetalleClase[]> => {
    try {
      const response = await fetch(`${API_URL}/api/detalle_clase.php?action=listar`, {
        headers: getHeaders(),
      });
      const data = await handleApiResponse(response);
      return data.datos || [];
    } catch (error) {
      handleNetworkError(error);
      return [];
    }
  },

  porHorario: async (horarioId: number): Promise<DetalleClase[]> => {
    try {
      const response = await fetch(
        `${API_URL}/api/detalle_clase.php?action=por_horario&horario_id=${horarioId}`,
        { headers: getHeaders() }
      );
      const data = await handleApiResponse(response);
      return data.datos || [];
    } catch (error) {
      handleNetworkError(error);
      return [];
    }
  },

  obtener: async (id: number): Promise<DetalleClase | null> => {
    try {
      const response = await fetch(`${API_URL}/api/detalle_clase.php?action=obtener&id=${id}`, {
        headers: getHeaders(),
      });
      const data = await handleApiResponse(response);
      return data.datos || null;
    } catch (error) {
      handleNetworkError(error);
      return null;
    }
  },

  crear: async (detalle: Omit<DetalleClase, 'id'>): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/api/detalle_clase.php?action=crear`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(detalle),
      });
      return await handleApiResponse(response);
    } catch (error) {
      handleNetworkError(error);
      throw error;
    }
  },

  actualizar: async (detalle: DetalleClase): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/api/detalle_clase.php?action=actualizar`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(detalle),
      });
      return await handleApiResponse(response);
    } catch (error) {
      handleNetworkError(error);
      throw error;
    }
  },

  eliminar: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_URL}/api/detalle_clase.php?action=eliminar`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ id }),
      });
      return await handleApiResponse(response);
    } catch (error) {
      handleNetworkError(error);
      throw error;
    }
  },
};

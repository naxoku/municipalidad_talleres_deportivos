import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Horario, ApiResponse } from '../types';

export const horariosApi = {
    listar: async (): Promise<Horario[]> => {
        try {
            const response = await fetch(`${API_URL}/api/horarios.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    crear: async (horario: Omit<Horario, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/horarios.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(horario),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    actualizar: async (horario: Horario): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/horarios.php?action=actualizar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(horario),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/horarios.php?action=eliminar`, {
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

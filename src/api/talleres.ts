import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Taller, ApiResponse } from '../types';

export const talleresApi = {
    listar: async (): Promise<Taller[]> => {
        try {
            const response = await fetch(`${API_URL}/api/talleres.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    obtener: async (id: number): Promise<Taller | null> => {
        try {
            const response = await fetch(`${API_URL}/api/talleres.php?action=obtener&id=${id}`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || null;
        } catch (error) {
            handleNetworkError(error);
            return null;
        }
    },

    crear: async (taller: Omit<Taller, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/talleres.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(taller),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    actualizar: async (taller: Taller): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/talleres.php?action=actualizar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(taller),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/talleres.php?action=eliminar`, {
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

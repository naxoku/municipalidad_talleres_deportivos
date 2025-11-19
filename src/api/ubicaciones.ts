import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Ubicacion, ApiResponse } from '../types';

export const ubicacionesApi = {
    listar: async (): Promise<Ubicacion[]> => {
        try {
            const response = await fetch(`${API_URL}/api/ubicaciones.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    obtener: async (id: number): Promise<Ubicacion | null> => {
        try {
            const response = await fetch(`${API_URL}/api/ubicaciones.php?action=obtener&id=${id}`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || null;
        } catch (error) {
            handleNetworkError(error);
            return null;
        }
    },

    crear: async (ubicacion: Omit<Ubicacion, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/ubicaciones.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(ubicacion),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    actualizar: async (ubicacion: Ubicacion): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/ubicaciones.php?action=actualizar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(ubicacion),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/ubicaciones.php?action=eliminar`, {
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
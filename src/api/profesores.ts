import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Profesor, ApiResponse } from '../types';

export const profesoresApi = {
    listar: async (): Promise<Profesor[]> => {
        try {
            const response = await fetch(`${API_URL}/api/profesores.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    obtener: async (id: number, include?: string): Promise<Profesor | null> => {
        try {
            const url = include 
                ? `${API_URL}/api/profesores.php?action=obtener&id=${id}&include=${include}`
                : `${API_URL}/api/profesores.php?action=obtener&id=${id}`;
            const response = await fetch(url, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || null;
        } catch (error) {
            handleNetworkError(error);
            return null;
        }
    },

    crear: async (profesor: Omit<Profesor, 'id'> & { contrasena: string }): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/profesores.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(profesor),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    actualizar: async (id: number, data: Partial<Profesor>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/profesores.php?action=actualizar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ id, ...data }),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/profesores.php?action=eliminar`, {
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

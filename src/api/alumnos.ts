import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Estudiante, ApiResponse } from '../types';

export const alumnosApi = {
    listar: async (): Promise<Estudiante[]> => {
        try {
            const response = await fetch(`${API_URL}/api/Alumnos.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    obtener: async (id: number): Promise<Estudiante | null> => {
        try {
            const response = await fetch(`${API_URL}/api/Alumnos.php?action=obtener&id=${id}`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || null;
        } catch (error) {
            handleNetworkError(error);
            return null;
        }
    },

    crear: async (estudiante: Omit<Estudiante, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/Alumnos.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(estudiante),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    actualizar: async (estudiante: Estudiante): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/Alumnos.php?action=actualizar`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(estudiante),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    eliminar: async (id: number): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/alumnos.php?action=eliminar`, {
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

import { API_URL, getHeaders, handleApiResponse, handleNetworkError } from './config';
import { Alumno, ApiResponse } from '../types';

export const alumnosApi = {
    listar: async (): Promise<Alumno[]> => {
        try {
            const response = await fetch(`${API_URL}/api/alumnos.php?action=listar`, {
                headers: getHeaders(),
            });
            const data = await handleApiResponse(response);
            return data.datos || [];
        } catch (error) {
            handleNetworkError(error);
            return [];
        }
    },

    obtener: async (id: number, include?: string): Promise<Alumno | null> => {
        try {
            const url = include 
                ? `${API_URL}/api/alumnos.php?action=obtener&id=${id}&include=${include}`
                : `${API_URL}/api/alumnos.php?action=obtener&id=${id}`;
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

    crear: async (alumno: Omit<Alumno, 'id'>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/alumnos.php?action=crear`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(alumno),
            });
            return await handleApiResponse(response);
        } catch (error) {
            handleNetworkError(error);
            throw error;
        }
    },

    actualizar: async (id: number, data: Partial<Alumno>): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${API_URL}/api/alumnos.php?action=actualizar`, {
                method: 'POST',
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
